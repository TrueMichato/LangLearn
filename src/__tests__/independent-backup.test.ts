import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const target = {
    get length() { return values.size; }, failKey: '',
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (key === this.failKey) throw new DOMException('Full', 'QuotaExceededError');
      values.set(key, value);
    },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: target });
  return target;
});

import { BACKUP_TABLE_NAMES, buildBackupPayload } from '../db/backup';
import { db, CURRENT_SCHEMA_VERSION } from '../db/schema';
import { createReadingProgress } from '../db/reading-progress';
import { IndependentBackupStore } from '../db/independent-backup-store';
import {
  captureIndependentPayload, independentProgressRows, payloadContent, readIndependentPayload,
  validateIndependentPayload, type IndependentBackupPayload,
} from '../db/independent-backup-payload';
import {
  createRecoveryKit, decryptCheckpoint, encryptCheckpoint, parseRecoveryKit, sha256,
  type CheckpointEnvelope, type CheckpointSummary, type RecoveryKit,
} from '../lib/backup-crypto';
import {
  decodeBackupCheckpoint, encryptedCheckpointFile, IndependentBackupClient, readEncryptedCheckpointFile,
  restoreIndependentCheckpoint, listRemoteCheckpoints, downloadRemoteCheckpoint,
  exportCurrentEncryptedRecoveryFile,
} from '../lib/independent-backup';
import { finishIndependentRestore } from '../lib/finish-backup-restore';
import { startIndependentBackupRuntime } from '../lib/backup-runtime';
import { saveCompletedGuidedGroups } from '../lib/guided-learning-progress';
import { saveAssessmentDraft } from '../lib/lesson-assessment-draft';
import { useXPStore } from '../stores/xpStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useBadgeStore } from '../stores/badgeStore';
import { completeVocabAttempt, createVocabAttempt, readVocabAttempt, saveVocabAttempt } from '../lib/vocab-lesson-attempt';

let store: IndependentBackupStore;
let kit: RecoveryKit;
let stopRuntime: (() => void) | undefined;
const date = '2026-11-17T00:00:00.000Z';

function persistedDefaults() {
  storage.clear();
  storage.setItem('langlearn-settings', JSON.stringify({ version: 1, state: {
    activeLanguages: ['ja'], currentLanguage: 'ja', onboardingComplete: true,
    notificationsEnabled: false, darkMode: false,
  } }));
  storage.setItem('langlearn-xp', '{"version":2,"state":{"bonusXP":0,"creditedVocabAttempts":{}}}');
  storage.setItem('langlearn-badges', '{"version":1,"state":{"unlockedBadges":{},"lastToast":null}}');
  storage.setItem('langlearn-study-sets', '{"version":2,"state":{"sets":[],"_initialized":false}}');
}

async function seedWord(id = 7) {
  await db.words.add({ id, word: `語${id}`, reading: 'ご', meaning: 'word', language: 'ja',
    type: 'word', tags: ['saved'], contextSentence: '', sourceTextId: null, createdAt: date });
}

async function enabledClient(fetcher: typeof fetch) {
  await store.change((s) => {
    s.kit = kit; s.enrolled = true; s.consent = true; s.kitConfirmed = true;
    s.enabled = true; s.dirty = true; s.generation = 1;
  });
  return new IndependentBackupClient(store, () => storage, () => 0, fetcher);
}

function mockService(options: { ackLost?: boolean; onPost?: () => Promise<void>; corruptReadback?: boolean } = {}) {
  const checkpoints = new Map<string, CheckpointEnvelope>();
  const requests: string[] = [];
  let headId: string | null = null;
  let lost = false;
  const summary = (cp: CheckpointEnvelope): CheckpointSummary => ({
    id: cp.id, parentId: cp.parentId, createdAt: cp.createdAt, storedAt: date,
    schemaVersion: cp.schemaVersion, progressRows: cp.progressRows, sha256: cp.sha256,
    bytes: new TextEncoder().encode(JSON.stringify(cp)).byteLength, sequence: [...checkpoints.keys()].indexOf(cp.id) + 1,
  });
  const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    expect(init).toMatchObject({ credentials: 'omit', cache: 'no-store', redirect: 'error' });
    const path = new URL(String(url)).pathname;
    if (init?.method === 'POST' && path.endsWith('/checkpoints')) {
      expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${kit.writeToken}`);
      const body = String(init.body);
      requests.push(body);
      const cp = JSON.parse(body) as CheckpointEnvelope;
      const existing = checkpoints.get(cp.id);
      if (!existing && cp.parentId !== headId) return Response.json({ error: { code: 'head-conflict', message: 'Conflict' }, headId }, { status: 409 });
      checkpoints.set(cp.id, cp); headId = cp.id;
      if (options.onPost) { const callback = options.onPost; options.onPost = undefined; await callback(); }
      if (options.ackLost && !lost) { lost = true; throw new TypeError('Network response lost'); }
      return Response.json({ checkpoint: summary(cp), headId }, { status: existing ? 200 : 201 });
    }
    if (/\/checkpoints\/[^/]+$/.test(path)) {
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${kit.readToken}`);
      const cp = checkpoints.get(path.split('/').at(-1)!)!;
      return Response.json({ checkpoint: options.corruptReadback ? { ...cp, ciphertext: cp.ciphertext.slice(4) } : cp, receipt: summary(cp) });
    }
    throw new Error('Unexpected request');
  }) as unknown as typeof fetch;
  return { fetcher, requests, checkpoints };
}

async function encrypted(payload: IndependentBackupPayload) {
  return encryptCheckpoint(JSON.stringify(payload), kit.encryptionKey, null, payload.schemaVersion, independentProgressRows(payload));
}

function raceBeforeSidecarTransaction(matches: (args: unknown[]) => boolean, write: () => Promise<unknown>) {
  const transaction = store.transaction;
  let injected = false;
  const raced = (...args: unknown[]) => {
    if (!injected && args[0] === 'rw' && matches(args)) {
      injected = true;
      return write().then(() => Reflect.apply(transaction, store, args));
    }
    return Reflect.apply(transaction, store, args);
  };
  return vi.spyOn(store, 'transaction').mockImplementation(raced as typeof store.transaction);
}

beforeEach(async () => {
  store = new IndependentBackupStore(`backup-test-${crypto.randomUUID()}`);
  kit = createRecoveryKit('http://localhost:8788');
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
  storage.failKey = '';
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useXPStore.setState(useXPStore.getInitialState(), true);
  useBadgeStore.setState(useBadgeStore.getInitialState(), true);
  useStudySetsStore.setState(useStudySetsStore.getInitialState(), true);
  persistedDefaults();
  await Promise.all([useXPStore.persist.rehydrate(), useSettingsStore.persist.rehydrate(),
    useBadgeStore.persist.rehydrate(), useStudySetsStore.persist.rehydrate()]);
});

describe('restore sidecar admission', () => {
  async function pendingFor(payload: IndependentBackupPayload, owner: RecoveryKit) {
    return { envelope: await encryptCheckpoint(JSON.stringify(payload), owner.encryptionKey, null,
      payload.schemaVersion, independentProgressRows(payload)), generation: 1, fingerprint: await sha256(payloadContent(payload)) };
  }

  async function expectRefusedBeforeWrites(checkpoint: CheckpointEnvelope, code: string) {
    const stateBefore = await store.state.get('client');
    const domainBefore = payloadContent(await readIndependentPayload(storage));
    const write = vi.spyOn(storage, 'setItem');
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code });
    expect(await store.state.get('client')).toStrictEqual(stateBefore);
    expect(await store.journal.count()).toBe(0);
    expect(await store.safetyCopies.count()).toBe(0);
    expect(payloadContent(await readIndependentPayload(storage))).toBe(domainBefore);
    expect(write).not.toHaveBeenCalled();
  }

  it.each(['same-vault', 'different-vault'])('preserves %s pending bytes and credentials before starting a new restore', async (owner) => {
    const payload = await captureIndependentPayload(storage, () => 0);
    const checkpoint = await encrypted(payload);
    const sourceKit = owner === 'same-vault' ? kit : createRecoveryKit('http://localhost:8788');
    const pending = await pendingFor(payload, sourceKit);
    await store.change((s) => { s.kit = sourceKit; s.pending = pending; });
    await expectRefusedBeforeWrites(checkpoint, 'restore-pending');
    expect(JSON.stringify((await store.read()).pending!.envelope)).toBe(JSON.stringify(pending.envelope));
  });

  describe('restore browser-state writer conflicts', () => {
    async function incomingWithXP(amount: number) {
      await seedWord();
      useXPStore.setState({ bonusXP: amount, creditedVocabAttempts: {} });
      const checkpoint = await encrypted(await captureIndependentPayload(storage, () => 0));
      await db.words.clear();
      persistedDefaults();
      await useXPStore.persist.rehydrate();
      return checkpoint;
    }

    function afterDatabaseWritten(write: () => Promise<void>) {
      const update = store.journal.update.bind(store.journal);
      let injected = false;
      return vi.spyOn(store.journal, 'update').mockImplementation((key, changes) => update(key, changes).then(async (result) => {
        if (!injected && (changes as { phase?: string }).phase === 'database-written') {
          injected = true;
          await write();
        }
        return result;
      }));
    }

    async function assertPreservedAndExportable(checkpoint: CheckpointEnvelope, key: string, value: string) {
      expect(storage.getItem(key)).toBe(value);
      expect(await store.journal.get('restore')).toMatchObject({
        phase: 'database-written', storageConflict: true, checkpointId: checkpoint.id,
      });
      await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true })).rejects.toBeDefined();
      expect(storage.getItem(key)).toBe(value);
      expect((await store.journal.get('restore'))?.phase).toBe('database-written');
      const exported = await readEncryptedCheckpointFile(await exportCurrentEncryptedRecoveryFile(kit, storage), kit);
      expect(exported.payload.localStorage[key]).toBe(value);
      const original = await readEncryptedCheckpointFile(encryptedCheckpointFile(kit, checkpoint), kit);
      expect(original.envelope).toStrictEqual(checkpoint);
      expect(exported.envelope.id).not.toBe(checkpoint.id);
    }

    it.each(['xp', 'guided-column', 'assessment-draft'])('preserves actual %s writes after database-written and exports current rather than safety progress', async (kind) => {
      const target = new EventTarget();
      vi.stubGlobal('window', target);
      const checkpoint = await incomingWithXP(175);
      const key = kind === 'xp' ? 'langlearn-xp' : kind === 'guided-column'
        ? 'langlearn-guided-ja-Hiragana' : 'langlearn-assessment-drafts';
      let written = '';
      afterDatabaseWritten(async () => {
        if (kind === 'xp') useXPStore.getState().addXP(25);
        if (kind === 'guided-column') await saveCompletedGuidedGroups('Hiragana', 'ja', new Set(['Vowels']), ['Vowels', 'K-row']);
        if (kind === 'assessment-draft') saveAssessmentDraft({ language: 'ja', kind: 'grammar', lessonIds: ['intro'] }, {
          questions: [{ id: 1, category: 'grammar', question: 'Q', options: ['A', 'B'], correctIndex: 0 }],
          index: 0, correctCount: 0, selectedIndex: null,
        });
        written = storage.getItem(key)!;
      });
      await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-conflict' });
      expect(written).not.toBe('');
      await assertPreservedAndExportable(checkpoint, key, written);
      if (kind === 'xp') {
        expect(JSON.parse(written).state.bonusXP).toBe(25);
        expect(JSON.parse((await store.journal.get('restore'))!.safetyCopy.localStorage[key]).state.bonusXP).toBe(0);
      }
    });

    it('refuses a new external XP value equal to incoming instead of treating it as an already-installed value', async () => {
      const checkpoint = await incomingWithXP(25);
      const external = '{"version":2,"state":{"bonusXP":25,"creditedVocabAttempts":{}}}';
      // Raw write deliberately emits no subscription/event: exact pre-install bytes
      // must protect a NEW restore independently of the participating-writer fence.
      afterDatabaseWritten(async () => { storage.setItem('langlearn-xp', external); });
      await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-conflict' });
      await assertPreservedAndExportable(checkpoint, 'langlearn-xp', external);
    });

    it.each(['state-put', 'verified-journal-put'])('preserves a late 25XP write across the final %s await without committing verified', async (site) => {
      const checkpoint = await incomingWithXP(175);
      let written = '';
      const write = () => {
        useXPStore.setState({ bonusXP: 25, creditedVocabAttempts: {} });
        written = storage.getItem('langlearn-xp')!;
      };
      if (site === 'state-put') {
        const put = store.state.put.bind(store.state);
        vi.spyOn(store.state, 'put').mockImplementation((value, key) => put(value, key).then((result) => {
          write(); return result;
        }));
      } else {
        const put = store.journal.put.bind(store.journal);
        vi.spyOn(store.journal, 'put').mockImplementation((value, key) => put(value, key).then((result) => {
          if (value.phase === 'verified') write();
          return result;
        }));
      }
      await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-conflict' });
      expect(JSON.parse(written).state.bonusXP).toBe(25);
      expect(await store.state.get('client')).toBeUndefined();
      await assertPreservedAndExportable(checkpoint, 'langlearn-xp', written);
    });
  });

  it.each(['endpoint', 'vaultId', 'readToken', 'writeToken', 'encryptionKey'] as const)('refuses a different existing kit %s even without pending or primary progress', async (field) => {
    const checkpoint = await encrypted(await captureIndependentPayload(storage, () => 0));
    const different = createRecoveryKit('https://different-backup.invalid');
    const sourceKit = { ...kit, [field]: different[field] };
    await store.change((s) => { s.kit = sourceKit; });
    await expectRefusedBeforeWrites(checkpoint, 'restore-connection');
  });

  it('allows an identical existing kit without pending when the domain target is fresh', async () => {
    const checkpoint = await encrypted(await captureIndependentPayload(storage, () => 0));
    await store.change((s) => { s.kit = structuredClone(kit); s.enrolled = true; });
    await restoreIndependentCheckpoint(kit, checkpoint, { store, storage });
    expect((await store.read()).kit).toStrictEqual(kit);
    expect((await store.journal.get('restore'))?.phase).toBe('verified');
  });

  it('atomically rechecks state before creating the journal or safety copy', async () => {
    const payload = await captureIndependentPayload(storage, () => 0);
    const checkpoint = await encrypted(payload);
    const queued = await pendingFor(payload, kit);
    const domainBefore = payloadContent(await readIndependentPayload(storage));
    const spy = raceBeforeSidecarTransaction((args) => args.includes(store.safetyCopies), () =>
      store.change((s) => { s.kit = kit; s.pending = queued; }));
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-sidecar-conflict' });
    expect(spy.mock.calls.find((args) => (args as unknown[]).includes(store.safetyCopies))).toContain(store.state);
    expect((await store.read()).pending).toStrictEqual(queued);
    expect((await store.read()).kit).toStrictEqual(kit);
    expect(await store.journal.count()).toBe(0);
    expect(await store.safetyCopies.count()).toBe(0);
    expect(payloadContent(await readIndependentPayload(storage))).toBe(domainBefore);
  });

  it.each(['pending', 'different-kit'])('preserves a concurrent %s at final adoption and keeps the original journal gated', async (change) => {
    await seedWord();
    const payload = await captureIndependentPayload(storage, () => 0);
    const checkpoint = await encrypted(payload);
    await db.words.clear(); storage.clear();
    await store.change((s) => { s.kit = kit; });
    const queued = await pendingFor(payload, kit);
    const replacement = createRecoveryKit('https://other-backup.invalid');
    const spy = raceBeforeSidecarTransaction((args) => args.includes(store.state) &&
      args.includes(store.journal) && !args.includes(store.safetyCopies), () =>
      store.change((s) => {
        if (change === 'pending') s.pending = queued;
        else s.kit = replacement;
      }));
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-sidecar-conflict' });
    const saved = await store.read();
    expect(saved.kit).toStrictEqual(change === 'pending' ? kit : replacement);
    expect(saved.pending).toStrictEqual(change === 'pending' ? queued : undefined);
    expect(saved.lastAck).toBeUndefined();
    expect(await store.journal.get('restore')).toMatchObject({ phase: 'database-written', checkpointId: checkpoint.id, kit });
    expect((await db.words.get(7))?.word).toBe('語7');
    spy.mockRestore();
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true })).rejects.toMatchObject({ code: 'restore-sidecar-conflict' });
    expect(await store.read()).toStrictEqual(saved);
    const normal = JSON.stringify(await buildBackupPayload());
    expect(normal).not.toContain(kit.encryptionKey);
    expect(normal).not.toContain(replacement.readToken);
    expect(normal).not.toContain(queued.envelope.ciphertext);
  });

  it('does not adopt metadata if the relevant journal changes before final commit', async () => {
    const checkpoint = await encrypted(await captureIndependentPayload(storage, () => 0));
    const competingId = crypto.randomUUID();
    raceBeforeSidecarTransaction((args) => args.includes(store.state) &&
      args.includes(store.journal) && !args.includes(store.safetyCopies), () =>
      store.journal.update('restore', { checkpointId: competingId }));
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ code: 'restore-journal-conflict' });
    expect((await store.journal.get('restore'))?.checkpointId).toBe(competingId);
    expect(await store.state.get('client')).toBeUndefined();
  });

  it('retries the exact interrupted journal despite benign dirty/error changes and retains its source credentials', async () => {
    await seedWord();
    const checkpoint = await encrypted(await captureIndependentPayload(storage, () => 0));
    await db.words.clear(); storage.clear();
    await store.change((s) => { s.kit = kit; });
    storage.failKey = 'langlearn-xp';
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect((await store.journal.get('restore'))?.sourceState?.kit).toStrictEqual(kit);
    await store.change((s) => { s.generation = 9; s.dirty = true; s.error = { code: 'network', message: 'Temporary connection issue' }; });
    storage.failKey = '';
    await restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true });
    expect((await store.journal.get('restore'))?.phase).toBe('verified');
    expect(await store.read()).toMatchObject({ generation: 9, kit, pending: undefined });
    expect(await store.safetyCopies.count()).toBe(1);
    await finishIndependentRestore(store, storage);
    expect(await store.journal.count()).toBe(0);
  });
});
afterEach(async () => {
  stopRuntime?.(); stopRuntime = undefined;
  storage.failKey = '';
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  await store.delete();
});

describe('encrypted backup formats', () => {
  it('authenticates headers and ciphertext, detects checksum errors, and refuses wrong keys/future formats', async () => {
    await seedWord();
    const payload = await captureIndependentPayload(storage, () => 0);
    const cp = await encrypted(payload);
    expect((await decodeBackupCheckpoint(cp, kit)).payload).toEqual(payload);
    await expect(decryptCheckpoint({ ...cp, ciphertext: `AAAA${cp.ciphertext.slice(4)}` }, kit.encryptionKey)).rejects.toMatchObject({ code: 'checksum' });
    const altered = { ...cp, progressRows: cp.progressRows + 1 };
    altered.sha256 = await sha256(JSON.stringify([1, altered.id, altered.parentId, altered.createdAt,
      altered.schemaVersion, altered.progressRows, altered.iv, altered.ciphertext]));
    await expect(decryptCheckpoint(altered, kit.encryptionKey)).rejects.toMatchObject({ code: 'authentication' });
    await expect(decryptCheckpoint(cp, createRecoveryKit('http://localhost').encryptionKey)).rejects.toMatchObject({ code: 'authentication' });
    await expect(decryptCheckpoint({ ...cp, version: 2 }, kit.encryptionKey)).rejects.toMatchObject({ code: 'unsupported-envelope' });
    expect(() => parseRecoveryKit({ ...kit, version: 2 })).toThrow(/different version/);
    for (const endpoint of ['http://example.com', 'https://x.example/path', 'https://user:pass@x.example', 'https://x.example/?token=x']) {
      expect(() => parseRecoveryKit({ ...kit, endpoint })).toThrow();
    }
    expect(() => parseRecoveryKit({ ...kit, readToken: `${kit.readToken.slice(0, -1)}A` })).toThrow();
    await expect(decodeBackupCheckpoint(await encryptCheckpoint(JSON.stringify({ ...payload, version: 99 }),
      kit.encryptionKey, null, payload.schemaVersion, independentProgressRows(payload)), kit)).rejects.toMatchObject({ code: 'unsupported-payload' });
  });

  it('refuses malformed full payload before any mutation and preserves future raw input', async () => {
    const payload = await captureIndependentPayload(storage, () => 0);
    const bad = { ...payload, tables: { ...payload.tables, reviews: [{ id: 1, wordId: 'not-an-id' }] } };
    const cp = await encryptCheckpoint(JSON.stringify(bad), kit.encryptionKey, null, CURRENT_SCHEMA_VERSION, 1);
    const before = await readIndependentPayload(storage);
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ code: 'invalid-payload' });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(payloadContent(before));
    expect(await store.journal.count()).toBe(0);
    const future = { ...payload, schemaVersion: CURRENT_SCHEMA_VERSION + 1 };
    const raw = JSON.stringify(future);
    expect(() => validateIndependentPayload(future)).toThrow(/different app/);
    expect(JSON.stringify(future)).toBe(raw);
  });

  it('refuses active orphan reviews before upload or restore, but retains historical dangling references', async () => {
    const orphan = { id: 12, wordId: 999, ease: 2.5, interval: 3, repetitions: 2, nextReviewDate: date, lastReviewDate: date };
    const payload = await captureIndependentPayload(storage, () => 0);
    const cp = await encryptCheckpoint(JSON.stringify({ ...payload, tables: { ...payload.tables, reviews: [orphan] } }),
      kit.encryptionKey, null, payload.schemaVersion, 1);
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ code: 'invalid-payload' });
    expect(await db.reviews.count()).toBe(0);
    await db.reviews.add(orphan);
    const fetcher = vi.fn();
    const client = await enabledClient(fetcher);
    await client.flush();
    expect(fetcher).not.toHaveBeenCalled();
    expect((await store.read()).error?.code).toBe('invalid-payload');
    expect((await db.reviews.get(12))?.wordId).toBe(999);
    await db.reviews.clear();
    await seedWord();
    await db.words.update(7, { sourceTextId: 404 });
    await db.reviewLog.add({ id: 2, reviewId: 808, wordId: 909, language: 'ja', grade: 4, isLapse: false, date });
    useStudySetsStore.getState().addSet({ id: 'historical', name: 'Keep missing IDs', description: '', tags: [],
      type: 'custom', selectionMode: 'manual', wordIds: [7, 404], createdAt: date });
    const valid = await encrypted(await captureIndependentPayload(storage, () => 0));
    await Promise.all(BACKUP_TABLE_NAMES.map((name) => db.table(name).clear()));
    storage.clear();
    await restoreIndependentCheckpoint(kit, valid, { store, storage });
    expect((await db.words.get(7))?.sourceTextId).toBe(404);
    expect(await db.reviewLog.get(2)).toMatchObject({ reviewId: 808, wordId: 909 });
    expect(JSON.parse(storage.getItem('langlearn-study-sets')!).state.sets[0].wordIds).toEqual([7, 404]);
    expect(await db.words.count()).toBe(1);
  });
});

describe('durable upload protocol', () => {
  it('does not enroll or send learner data before explicit consent and kit confirmation', async () => {
    const fetcher = vi.fn();
    const client = new IndependentBackupClient(store, () => storage, () => 0, fetcher);
    await client.flush();
    await expect(client.enroll('http://localhost', 'enrollment-secret', false)).rejects.toMatchObject({ code: 'consent' });
    await store.change((s) => { s.kit = kit; s.enrolled = true; s.enabled = true; s.consent = true; });
    await client.flush();
    await expect(client.enable(true, false)).rejects.toMatchObject({ code: 'consent' });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await store.read()).not.toHaveProperty('lastAck');
  });

  it('reconciles an ambiguous enrollment with READ authentication and never persists the enrollment secret', async () => {
    let enrolledKit: RecoveryKit | undefined;
    const enrollBodies: string[] = [];
    let statusCalls = 0;
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.credentials).toBe('omit');
      if (init?.method === 'POST') {
        enrollBodies.push(String(init.body));
        enrolledKit = (await store.read()).kit;
        return Response.json({ vaultId: enrolledKit!.vaultId }, { status: enrollBodies.length === 1 ? 201 : 409 });
      }
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${enrolledKit!.readToken}`);
      if (statusCalls++ === 0) throw new TypeError('Lost response');
      return Response.json({ headId: null, sequence: 0, storedBytes: 0, checkpointCount: 0, maxBytes: 128 * 1024 * 1024, retentionDays: 30 });
    }) as typeof fetch;
    const client = new IndependentBackupClient(store, () => storage, () => 0, fetcher);
    await expect(client.enroll('http://localhost:8788', 'synthetic-enrollment-only', true)).rejects.toBeInstanceOf(TypeError);
    expect((await store.read()).kit).toBeDefined();
    expect((await store.read()).enrolled).toBe(false);
    await client.enroll('http://localhost:8788', 'synthetic-enrollment-only', true);
    expect(enrollBodies[0]).toBe(enrollBodies[1]);
    expect(JSON.stringify(await store.read())).not.toContain('synthetic-enrollment-only');
    expect((await store.read()).enrolled).toBe(true);
    await client.flush();
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect((await store.read()).pending).toBeUndefined();
  });

  it('does not silently adopt a nonempty head discovered while reconciling enrollment', async () => {
    const headId = crypto.randomUUID();
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) =>
      init?.method === 'POST' ? Response.json({}, { status: 201 }) : Response.json({
        headId, sequence: 1, storedBytes: 100, checkpointCount: 1, maxBytes: 128 * 1024 * 1024, retentionDays: 30,
      })) as typeof fetch;
    const client = new IndependentBackupClient(store, () => storage, () => 0, fetcher);
    await client.enroll('http://localhost:8788', 'synthetic-only-code', true);
    expect(await store.read()).toMatchObject({ enrolled: true, headId: null, enabled: false, error: { code: 'head-conflict' } });
    await expect(client.enable(true, true)).rejects.toMatchObject({ code: 'head-conflict' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('persists exact encrypted bytes before send and reuses them after acknowledgement loss and restart', async () => {
    await seedWord();
    const service = mockService({ ackLost: true });
    const client = await enabledClient(service.fetcher);
    const checkingFetch = vi.fn(async (...args: Parameters<typeof fetch>) => {
      if (args[1]?.method === 'POST') {
        expect(JSON.stringify((await store.read()).pending!.envelope)).toBe(args[1].body);
      }
      return service.fetcher(...args);
    });
    const first = new IndependentBackupClient(store, () => storage, () => 0, checkingFetch);
    await first.flush();
    expect((await store.read()).pending).toBeDefined();
    expect((await store.read()).lastAck).toBeUndefined();
    client.stop();
    const restarted = new IndependentBackupClient(store, () => storage, () => 0, checkingFetch);
    await restarted.retry();
    expect(service.requests).toHaveLength(2);
    expect(service.requests[0]).toBe(service.requests[1]);
    expect((await store.read()).lastAck?.id).toBe(JSON.parse(service.requests[0]).id);
    expect((await store.read()).pending).toBeUndefined();
  });

  it('keeps new commits pending while an older upload is in flight', async () => {
    await seedWord();
    const service = mockService();
    const client = await enabledClient(async (...args) => {
      if (args[1]?.method === 'POST' && service.requests.length === 0) {
        await seedWord(8); await client.markDirty();
      }
      return service.fetcher(...args);
    });
    await client.flush();
    expect((await store.read()).lastAck).toBeDefined();
    expect((await store.read()).dirty).toBe(true);
    await client.flush();
    expect(service.checkpoints.size).toBe(2);
    const state = await store.read();
    expect(state.dirty).toBe(false);
    expect((await decodeBackupCheckpoint([...service.checkpoints.values()].at(-1), kit)).payload.tables.words).toHaveLength(2);
  });

  it('never claims confirmation on failed remote readback or a local queue quota failure', async () => {
    await seedWord();
    const service = mockService({ corruptReadback: true });
    const client = await enabledClient(service.fetcher);
    await client.flush();
    expect((await store.read()).lastAck).toBeUndefined();
    expect((await store.read()).pending).toBeDefined();
    expect((await store.read()).error).toBeDefined();
    await store.state.delete('client');
    await enabledClient(service.fetcher);
    const put = vi.spyOn(store.state, 'put').mockRejectedValue(new DOMException('Full', 'QuotaExceededError'));
    await client.flush();
    expect(service.requests).toHaveLength(1);
    expect((await store.read()).pending).toBeUndefined();
    expect((await store.read()).lastAck).toBeUndefined();
    expect(client.getProblem()?.code).toBe('local-quota');
    put.mockRestore();
  });

  it('retains the queue if persisting a verified remote acknowledgement fails', async () => {
    await seedWord();
    const service = mockService();
    const client = await enabledClient(service.fetcher);
    const change = store.change.bind(store);
    const spy = vi.spyOn(store, 'change').mockImplementation((update) => change((state) => {
      update(state);
      if (state.lastAck) throw new DOMException('Full', 'QuotaExceededError');
    }));
    await client.flush();
    expect((await store.read()).pending).toBeDefined();
    expect((await store.read()).lastAck).toBeUndefined();
    expect(client.getProblem()?.code).toBe('local-quota');
    spy.mockRestore();
    await client.retry();
    expect(service.requests).toHaveLength(2);
    expect(service.requests[0]).toBe(service.requests[1]);
    expect((await store.read()).lastAck).toBeDefined();
  });

  it('keeps exact queued bytes on head conflict and never silently adopts the remote head', async () => {
    await seedWord();
    const otherHead = crypto.randomUUID();
    const fetcher = vi.fn(async () => Response.json({
      error: { code: 'head-conflict', message: 'Do not expose arbitrary response text' }, headId: otherHead,
    }, { status: 409 })) as typeof fetch;
    const client = await enabledClient(fetcher);
    await client.flush();
    const first = await store.read();
    expect(first.error?.code).toBe('head-conflict');
    expect(first.headId).toBe(null);
    expect(first.pending).toBeDefined();
    await client.flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await store.read()).pending).toEqual(first.pending);
  });

  it('requires explicit history-decrease confirmation and keeps the original encrypted upload', async () => {
    await seedWord();
    const service = mockService();
    const refusedBodies: string[] = [];
    const fetcher = vi.fn(async (...args: Parameters<typeof fetch>) => {
      if (args[1]?.method === 'POST' && (args[1].headers as Record<string, string>)['X-Confirm-History-Decrease'] !== 'true') {
        refusedBodies.push(String(args[1].body));
        return Response.json({ error: { code: 'history-decreased', message: 'smaller' } }, { status: 409 });
      }
      return service.fetcher(...args);
    });
    const client = await enabledClient(fetcher);
    await client.flush();
    expect((await store.read()).error?.code).toBe('history-decreased');
    await expect(client.retry()).rejects.toMatchObject({ code: 'history-decreased' });
    await client.flush(true);
    expect(service.requests[0]).toBe(refusedBodies[0]);
    expect((await store.read()).lastAck).toBeDefined();
  });

  it('surfaces capacity failures without erasing queued bytes or claiming remote confirmation', async () => {
    await seedWord();
    const fetcher = vi.fn(async () => Response.json({ error: { code: 'capacity', message: 'full' } }, { status: 507 }));
    const client = await enabledClient(fetcher);
    await client.flush();
    expect((await store.read()).error?.code).toBe('capacity');
    expect((await store.read()).pending).toBeDefined();
    expect((await store.read()).lastAck).toBeUndefined();
    await client.flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retries coherence checks and stops explicitly if the source keeps changing', async () => {
    let revision = 0;
    await expect(captureIndependentPayload(storage, () => revision++)).rejects.toMatchObject({ code: 'capture-busy' });
  });
});

describe('capture coverage and fresh recovery', () => {
  async function preparedV12Restore() {
    const legacy = (payload: IndependentBackupPayload) => {
      const copy = { ...payload, schemaVersion: 12, tables: { ...payload.tables } };
      delete (copy.tables as Partial<typeof copy.tables>).readingProgress;
      return copy;
    };
    const safety = legacy(await captureIndependentPayload(storage, () => 0));
    await seedWord();
    const incoming = legacy(await captureIndependentPayload(storage, () => 0));
    const checkpoint = await encrypted(incoming);
    await db.words.clear();
    const journal = {
      id: 'restore' as const, phase: 'prepared' as const, checkpointId: checkpoint.id, kit, envelope: checkpoint,
      safetyCopy: safety, safetyStorageKeys: Object.keys(safety.localStorage), sourceState: null, startedAt: date,
    };
    await store.journal.put(journal);
    await store.safetyCopies.add({ createdAt: date, checkpointId: checkpoint.id, payload: safety });
    return { checkpoint, journal };
  }

  it('resumes a prepared v12 journal before database installation after the additive v13 upgrade', async () => {
    const { checkpoint, journal } = await preparedV12Restore();
    await restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true });
    expect(await db.words.count()).toBe(1);
    expect(await db.readingProgress.count()).toBe(0);
    expect(await store.journal.get('restore')).toMatchObject({
      phase: 'verified', safetyCopy: journal.safetyCopy, envelope: checkpoint,
    });
    expect((await store.safetyCopies.toArray())[0].payload).toEqual(journal.safetyCopy);
    expect((await store.journal.get('restore'))?.safetyCopy.schemaVersion).toBe(12);
    await finishIndependentRestore(store, storage);
    expect(await store.journal.count()).toBe(0);
    expect((await store.safetyCopies.toArray())[0].payload).toEqual(journal.safetyCopy);
  });

  it('still rejects actual concurrent changes when retrying a prepared v12 restore', async () => {
    const { checkpoint, journal } = await preparedV12Restore();
    await seedWord(19);
    const before = payloadContent(await readIndependentPayload(storage));
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true }))
      .rejects.toMatchObject({ code: 'restore-conflict' });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(before);
    expect(await db.words.get(7)).toBeUndefined();
    expect(await store.journal.get('restore')).toMatchObject({
      phase: 'prepared', safetyCopy: journal.safetyCopy, envelope: checkpoint,
    });
  });

  it('validates a v12 safety copy before upgrading it for comparison', async () => {
    const { checkpoint, journal } = await preparedV12Restore();
    const malformed = { ...journal.safetyCopy, tables: { ...journal.safetyCopy.tables } };
    delete (malformed.tables as Partial<typeof malformed.tables>).words;
    await store.journal.put({ ...journal, safetyCopy: malformed });
    const before = payloadContent(await readIndependentPayload(storage));
    await expect(restoreIndependentCheckpoint(kit, checkpoint, { store, storage, retry: true }))
      .rejects.toMatchObject({ code: 'invalid-payload' });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(before);
    expect((await store.journal.get('restore'))?.safetyCopy).toEqual(malformed);
  });

  it('restores a schema-12 checkpoint with an explicitly empty new reading table, without changing its authenticated header', async () => {
    await seedWord();
    const current = await captureIndependentPayload(storage, () => 0);
    const legacy = { ...current, schemaVersion: 12, tables: { ...current.tables } };
    delete (legacy.tables as Partial<typeof legacy.tables>).readingProgress;
    const checkpoint = await encrypted(legacy);
    expect((await decodeBackupCheckpoint(checkpoint, kit)).payload.schemaVersion).toBe(12);
    await Promise.all(db.tables.map((table) => table.clear()));
    persistedDefaults();
    await restoreIndependentCheckpoint(kit, checkpoint, { store, storage });
    expect(await db.words.count()).toBe(1);
    expect(await db.readingProgress.count()).toBe(0);
    expect((await store.journal.get('restore'))?.phase).toBe('verified');
  });

  it('round-trips reading snapshots and rejects invalid positions without writing', async () => {
    const place = createReadingProgress({ kind: 'curated', language: 'es', curatedId: 'story' }, 'Story', 'Hola.\n\nOtro día.');
    place.position = place.content.indexOf('Otro');
    place.purpose = 'close-study';
    place.reflection = 'A new day.';
    await db.readingProgress.put(place);
    const payload = await captureIndependentPayload(storage, () => 0);
    const checkpoint = await encrypted(payload);
    await Promise.all(db.tables.map((table) => table.clear()));
    persistedDefaults();
    const invalid = { ...payload, tables: { ...payload.tables, readingProgress: [{ ...place, position: 99 }] } };
    await expect(restoreIndependentCheckpoint(kit, await encrypted(invalid), { store, storage }))
      .rejects.toMatchObject({ code: 'invalid-payload' });
    expect(await db.readingProgress.count()).toBe(0);
    await restoreIndependentCheckpoint(kit, checkpoint, { store, storage });
    expect(await db.readingProgress.toArray()).toEqual([place]);
  });

  it('omits captured optional undefined object properties without rewriting source records', async () => {
    await seedWord();
    await db.table('words').put({
      ...await db.words.get(7), learnerEdited: undefined,
      lessonSourceSnapshot: {
        word: '語7', reading: 'ご', meaning: 'word', contextSentence: '', grammarRule: undefined,
      },
      lessonSource: {
        lessonId: 'intro', itemId: 'first', provenance: 'authored', sourceSection: undefined,
        legacyAliases: [{ rule: 'rule', example: 'example', optionalMetadata: undefined }],
      },
    });
    await db.reviews.add({ id: 12, wordId: 7, ease: 2.5, interval: 3, repetitions: 2,
      nextReviewDate: date, lastReviewDate: date, stability: undefined, difficulty: undefined });
    const wordBefore = await db.words.get(7);
    const reviewBefore = await db.reviews.get(12);
    expect(Object.hasOwn(wordBefore!, 'learnerEdited')).toBe(true);
    expect(Object.hasOwn(wordBefore!.lessonSourceSnapshot!, 'grammarRule')).toBe(true);
    expect(Object.hasOwn(reviewBefore!, 'stability')).toBe(true);
    const payload = await captureIndependentPayload(storage, () => 0);
    expect(payload.tables.words[0]).not.toHaveProperty('learnerEdited');
    expect(payload.tables.words[0].lessonSourceSnapshot).not.toHaveProperty('grammarRule');
    expect(payload.tables.words[0].lessonSource).toEqual({
      lessonId: 'intro', itemId: 'first', provenance: 'authored',
      legacyAliases: [{ rule: 'rule', example: 'example' }],
    });
    expect(payload.tables.reviews[0]).not.toHaveProperty('stability');
    expect(payload.tables.reviews[0]).not.toHaveProperty('difficulty');
    expect(await db.words.get(7)).toStrictEqual(wordBefore);
    expect(await db.reviews.get(12)).toStrictEqual(reviewBefore);
    // Decryption/import validation must not silently normalize untrusted values.
    const malformed = structuredClone(payload);
    malformed.tables.words[0].learnerEdited = undefined;
    expect(() => validateIndependentPayload(malformed)).toThrow(/invalid value/);
    const service = mockService();
    const client = await enabledClient(service.fetcher);
    await client.flush();
    expect((await store.read()).error).toBeUndefined();
    expect((await store.read()).lastAck).toBeDefined();
    expect((await decodeBackupCheckpoint([...service.checkpoints.values()][0], kit)).payload.tables.words).toEqual(payload.tables.words);
    expect(await db.words.get(7)).toStrictEqual(wordBefore);
  });

  it.each([
    ['undefined required field', { meaning: undefined }],
    ['undefined required nested snapshot field', {
      lessonSourceSnapshot: { word: undefined, reading: 'ご', meaning: 'word', contextSentence: '' },
    }],
    ['missing required nested snapshot field', {
      lessonSourceSnapshot: { reading: 'ご', meaning: 'word', contextSentence: '' },
    }],
    ['undefined required nested source field', {
      lessonSource: { lessonId: 'intro', itemId: undefined, provenance: 'authored' },
    }],
    ['undefined array entry', { tags: [undefined] }],
    ['sparse array entry', { tags: new Array(1) }],
    ['nested undefined array entry', { metadata: { items: [undefined] } }],
    ['nested NaN', { metadata: { score: Number.NaN } }],
    ['nested positive infinity', { metadata: { score: Number.POSITIVE_INFINITY } }],
    ['nested negative infinity', { metadata: { scores: [Number.NEGATIVE_INFINITY] } }],
    ['nonplain date', { metadata: new Date(date) }],
    ['nonplain map', { metadata: new Map([['score', 1]]) }],
    ['unsupported bigint', { metadata: 1n }],
    ['prototype field', { metadata: JSON.parse('{"__proto__":{"unsafe":true}}') }],
    ['undefined prototype field', { metadata: { constructor: undefined } }],
  ])('refuses captured %s rather than lossy JSON conversion', async (_label, fields) => {
    await seedWord();
    await db.table('words').put({ ...await db.words.get(7), ...fields });
    const before = await db.words.get(7);
    await expect(captureIndependentPayload(storage, () => 0)).rejects.toMatchObject({ code: 'invalid-payload' });
    expect(await db.words.get(7)).toStrictEqual(before);
  });

  it('still rejects a missing required field after capture normalization', async () => {
    await seedWord();
    const row = { ...await db.words.get(7) } as Record<string, unknown>;
    delete row.meaning;
    await db.table('words').put(row);
    await expect(captureIndependentPayload(storage, () => 0)).rejects.toMatchObject({ code: 'invalid-payload' });
    expect(await db.words.get(7)).not.toHaveProperty('meaning');
  });

  it.runIf(import.meta.env.VITE_LOCAL_BACKUP_INTEGRATION === 'true')('round-trips synthetic data through the real loopback Worker and recovers offline', async () => {
    // Explicit opt-in; fake IndexedDB contains only this file's synthetic fixtures.
    const client = new IndependentBackupClient(store, () => storage);
    kit = await client.enroll('http://127.0.0.1:8797', 'synthetic-only-langlearn-local-enrollment-not-production', true);
    await seedWord();
    await db.reviews.add({ id: 12, wordId: 7, ease: 2.5, interval: 3, repetitions: 2, nextReviewDate: date, lastReviewDate: date });
    await client.enable(true, true);
    await client.flush();
    const state = await store.read();
    expect(state.error).toBeUndefined();
    expect(state.lastAck).toBeDefined();
    const versions = await listRemoteCheckpoints(kit);
    expect(versions.checkpoints[0].id).toBe(state.lastAck!.id);
    const readback = await downloadRemoteCheckpoint(kit, versions.checkpoints[0].id);
    const file = encryptedCheckpointFile(kit, readback.envelope);
    const original = payloadContent(readback.payload);
    client.stop();
    await Promise.all(BACKUP_TABLE_NAMES.map((name) => db.table(name).clear()));
    storage.clear();
    const network = vi.fn(); vi.stubGlobal('fetch', network);
    const offline = await readEncryptedCheckpointFile(file, kit);
    await restoreIndependentCheckpoint(kit, offline.envelope, { store, storage });
    await finishIndependentRestore(store, storage);
    expect(payloadContent(await readIndependentPayload(storage))).toBe(original);
    expect((await db.reviews.get(12))?.wordId).toBe(7);
    expect(network).not.toHaveBeenCalled();
  });

  it('captures real same-tab guided column and assessment commits even with no lesson completion transaction', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const service = mockService();
    const client = await enabledClient(service.fetcher);
    await client.flush();
    const runtime = startIndependentBackupRuntime({ client, windowTarget: target, delayMs: 60_000 });
    stopRuntime = () => runtime.stop();
    await saveCompletedGuidedGroups('Hiragana', 'ja', new Set(['Vowels']), ['Vowels', 'K-row']);
    expect(await db.lessonProgress.count()).toBe(0);
    await vi.waitFor(async () => expect((await store.read()).dirty).toBe(true));
    await runtime.flush();
    let payload = (await decodeBackupCheckpoint([...service.checkpoints.values()].at(-1), kit)).payload;
    expect(payload.localStorage['langlearn-guided-ja-Hiragana']).toBe('["Vowels"]');
    expect((await store.read()).dirty).toBe(false);
    expect(saveAssessmentDraft({ language: 'ja', kind: 'grammar', lessonIds: ['intro'] }, {
      questions: [{ id: 1, category: 'grammar', question: 'Choose', options: ['a', 'b'], correctIndex: 0 }],
      index: 0, correctCount: 0, selectedIndex: null,
    })).toBe(true);
    await vi.waitFor(async () => expect((await store.read()).dirty).toBe(true));
    await runtime.flush();
    payload = (await decodeBackupCheckpoint([...service.checkpoints.values()].at(-1), kit)).payload;
    expect(JSON.parse(payload.localStorage['langlearn-assessment-drafts']).drafts).toHaveLength(1);
  });

  it('captures XP-only, manual-set, badge and settings subscriptions; excludes unrelated storage/database changes', async () => {
    const service = mockService();
    const client = await enabledClient(service.fetcher);
    await client.flush();
    const runtime = startIndependentBackupRuntime({ client, delayMs: 60_000 });
    stopRuntime = () => runtime.stop();
    const generation = (await store.read()).generation;
    await db.snapshots.add({ reason: 'not authoritative', createdAt: date, schemaVersion: 12, payload: '{}', sizeBytes: 2 });
    await store.change((s) => { s.error = undefined; });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect((await store.read()).generation).toBe(generation);
    await seedWord();
    await vi.waitFor(async () => expect((await store.read()).generation).toBe(generation + 1));
    useXPStore.getState().addXP(5);
    useBadgeStore.getState().unlockBadge('first-word');
    useSettingsStore.getState().setDailyGoal(12);
    useStudySetsStore.getState().addSet({ id: 'my-set', name: 'Mine', description: '', tags: [], type: 'custom',
      selectionMode: 'manual', wordIds: [7], createdAt: date });
    await vi.waitFor(async () => expect((await store.read()).generation).toBe(generation + 5));
    await runtime.flush();
    const payload = (await decodeBackupCheckpoint([...service.checkpoints.values()].at(-1), kit)).payload;
    expect(JSON.parse(payload.localStorage['langlearn-xp']).state.bonusXP).toBe(5);
    expect(JSON.parse(payload.localStorage['langlearn-settings']).state.dailyGoalMinutes).toBe(12);
    expect(JSON.parse(payload.localStorage['langlearn-study-sets']).state.sets[0].wordIds).toEqual([7]);
    expect(payload).not.toHaveProperty('snapshots');
    expect(payload.tables.words).toHaveLength(1);
  });

  it('restores every table, four stores, raw drafts, receipts and original links offline without double-crediting XP', async () => {
    await seedWord(7);
    await db.reviews.add({ id: 12, wordId: 7, ease: 2.5, interval: 3, repetitions: 2, nextReviewDate: date, lastReviewDate: date });
    await db.texts.add({ id: 9, language: 'ja', title: 'Saved', content: '私の文', createdAt: date });
    await db.words.update(7, { sourceTextId: 9 });
    await db.studySessions.add({ id: 5, startTime: date, endTime: date, durationSeconds: 60, activity: 'srs', xpEarned: 2 });
    await db.dailyActivity.add({ date: '2026-11-17', studySeconds: 60, cardsReviewed: 1, wordsAdded: 1, goalMet: false });
    await db.characterProgress.add({ id: 'ja/Hiragana/あ', language: 'ja', character: 'あ', romanji: 'a', correctCount: 1, totalAttempts: 1, lastPracticed: date, mastery: 'learning' });
    await db.testHistory.add({ id: 3, language: 'ja', type: 'grammar', score: 100, level: 'beginner', totalQuestions: 1, correctAnswers: 1, durationSeconds: 2, date });
    await db.badges.add({ id: 'first-word', unlockedAt: date });
    await db.reviewLog.add({ id: 30, reviewId: 12, wordId: 7, language: 'ja', grade: 4, isLapse: false, date });
    await db.guidedActivityProgress.add({ id: 'ja/first', language: 'ja', milestoneId: 'first', activity: 'listening', completedAt: date, attempts: 1, itemsCompleted: 1 });
    await db.skillProgress.add({ id: 'ja/numbers/one', language: 'ja', activity: 'numbers', skill: 'one', attempts: 1, correct: 1 });
    await db.settings.bulkPut([{ key: 'push-endpoint', value: 'https://private-push.invalid' },
      { key: 'push-last-worker-check', value: date }, { key: 'push-last-sync-at', value: date },
      { key: 'guided-baseline:v1:ja', value: '{"version":1,"original":"surviving raw state"}' }]);
    const attempt = createVocabAttempt('ja', 'one-word', { id: 'one-word',
      words: [{ word: '猫', reading: 'ねこ', meaning: 'cat', example: '', exampleMeaning: '' }], exercises: [] });
    const finished = await saveVocabAttempt({ ...attempt, step: 'summary' }, null);
    await completeVocabAttempt(finished);
    const xpBefore = useXPStore.getState().bonusXP;
    useStudySetsStore.getState().addSet({ id: 'manual', name: 'My words', description: '', tags: [], type: 'custom',
      selectionMode: 'manual', wordIds: [7, 404], createdAt: date });
    await saveCompletedGuidedGroups('Hiragana', 'ja', new Set(['Vowels']), ['Vowels', 'K-row']);
    saveAssessmentDraft({ language: 'ja', kind: 'grammar', lessonIds: ['intro'] }, {
      questions: [{ id: 1, category: 'grammar', question: 'Q', options: ['A', 'B'], correctIndex: 0 }],
      index: 0, correctCount: 0, selectedIndex: 1,
    });
    storage.setItem('langlearn-recovery-capsule-v1', 'do not recursively capture');
    const payload = await captureIndependentPayload(storage, () => 0);
    expect(Object.keys(payload.tables)).toHaveLength(14);
    expect(payload.tables.settings.some((row) => String(row.key).startsWith('push-'))).toBe(false);
    expect(Object.keys(payload.localStorage)).toHaveLength(6);
    const cp = await encrypted(payload);
    const file = encryptedCheckpointFile(kit, cp);
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await Promise.all(BACKUP_TABLE_NAMES.map((name) => db.table(name).clear()));
    storage.clear();
    const offline = await readEncryptedCheckpointFile(file, parseRecoveryKit(JSON.parse(JSON.stringify(kit))));
    await restoreIndependentCheckpoint(kit, offline.envelope, { store, storage });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(payloadContent(payload));
    expect((await db.reviews.get(12))?.wordId).toBe(7);
    expect((await db.words.get(7))?.sourceTextId).toBe(9);
    expect(JSON.parse(storage.getItem('langlearn-study-sets')!).state.sets[0].wordIds).toEqual([7, 404]);
    expect(await store.journal.get('restore')).toMatchObject({ phase: 'verified', checkpointId: cp.id });
    await useXPStore.persist.rehydrate();
    const restored = await readVocabAttempt('ja', 'one-word');
    expect(restored.kind).toBe('saved');
    if (restored.kind === 'saved') await completeVocabAttempt(restored.attempt);
    expect(useXPStore.getState().bonusXP).toBe(xpBefore);
    expect(fetcher).not.toHaveBeenCalled();
    const normal = await buildBackupPayload();
    expect(JSON.stringify(normal)).not.toContain(kit.encryptionKey);
    expect(JSON.stringify(normal)).not.toContain(kit.writeToken);
  });

  it('refuses existing data without rewriting numeric IDs, XP, or manual sets', async () => {
    const incoming = await encrypted(await captureIndependentPayload(storage, () => 0));
    await seedWord();
    useXPStore.getState().addXP(40);
    useStudySetsStore.getState().addSet({ id: 'keep', name: 'Keep', description: '', type: 'custom',
      selectionMode: 'manual', wordIds: [7], tags: [], createdAt: date });
    const before = await readIndependentPayload(storage);
    await expect(restoreIndependentCheckpoint(kit, incoming, { store, storage })).rejects.toMatchObject({ code: 'existing-progress' });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(payloadContent(before));
    expect(await store.journal.count()).toBe(0);
  });

  it.each(['xp', 'manual-set', 'guided-column', 'assessment-draft', 'guided-baseline', 'earned-streak-freeze'])('also refuses an otherwise empty target with surviving %s', async (kind) => {
    const incoming = await encrypted(await captureIndependentPayload(storage, () => 0));
    if (kind === 'xp') useXPStore.getState().addXP(10);
    if (kind === 'manual-set') useStudySetsStore.getState().addSet({ id: 'keep', name: 'Keep', description: '',
      type: 'custom', selectionMode: 'manual', wordIds: [17], tags: [], createdAt: date });
    if (kind === 'guided-column') await saveCompletedGuidedGroups('Hiragana', 'ja', new Set(['Vowels']), ['Vowels', 'K-row']);
    if (kind === 'assessment-draft') saveAssessmentDraft({ language: 'ja', kind: 'grammar', lessonIds: ['intro'] }, {
      questions: [{ id: 1, category: 'grammar', question: 'Q', options: ['A', 'B'], correctIndex: 0 }],
      index: 0, correctCount: 0, selectedIndex: null,
    });
    if (kind === 'guided-baseline') await db.settings.put({ key: 'guided-path-baseline-v2/ja',
      value: '{"version":2,"accessibleNodeIds":["letters:earned"],"completedLessonIds":[]}' });
    if (kind === 'earned-streak-freeze') useSettingsStore.getState().grantStreakFreeze(7);
    const before = payloadContent(await readIndependentPayload(storage));
    await expect(restoreIndependentCheckpoint(kit, incoming, { store, storage })).rejects.toMatchObject({ code: 'existing-progress' });
    expect(payloadContent(await readIndependentPayload(storage))).toBe(before);
  });

  it('journals the IDB/localStorage failure window and safely retries the identical recovery point', async () => {
    await seedWord();
    const payload = await captureIndependentPayload(storage, () => 0);
    const cp = await encrypted(payload);
    await db.words.clear(); storage.clear();
    storage.failKey = 'langlearn-xp';
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(await db.words.count()).toBe(1);
    expect(await store.journal.get('restore')).toMatchObject({ phase: 'database-written' });
    await expect(finishIndependentRestore(store, storage)).rejects.toMatchObject({ code: 'restore-incomplete' });
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ code: 'restore-in-progress' });
    storage.failKey = '';
    await restoreIndependentCheckpoint(kit, cp, { store, storage, retry: true });
    expect((await store.journal.get('restore'))?.phase).toBe('verified');
    expect(payloadContent(await readIndependentPayload(storage))).toBe(payloadContent(payload));
    await finishIndependentRestore(store, storage);
    expect(await store.journal.count()).toBe(0);
    expect(await store.safetyCopies.count()).toBe(1);
    expect(useXPStore.getState().bonusXP).toBe(0);
  });

  it('will not release the activation gate if restored state changes after verification', async () => {
    await seedWord();
    const cp = await encrypted(await captureIndependentPayload(storage, () => 0));
    await db.words.clear(); storage.clear();
    await restoreIndependentCheckpoint(kit, cp, { store, storage });
    await db.words.update(7, { meaning: 'external change' });
    await expect(finishIndependentRestore(store, storage)).rejects.toMatchObject({ code: 'restore-changed' });
    expect((await store.journal.get('restore'))?.phase).toBe('verified');
    expect((await db.words.get(7))?.meaning).toBe('external change');
  });

  it('refuses retry after a concurrent deletion instead of silently recreating a removed incoming row', async () => {
    await seedWord();
    const cp = await encrypted(await captureIndependentPayload(storage, () => 0));
    await db.words.clear(); storage.clear();
    storage.failKey = 'langlearn-xp';
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect((await store.journal.get('restore'))?.phase).toBe('database-written');
    await db.words.delete(7);
    storage.failKey = '';
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage, retry: true })).rejects.toMatchObject({ code: 'restore-conflict' });
    expect(await db.words.get(7)).toBeUndefined();
    expect((await store.journal.get('restore'))?.phase).toBe('database-written');
    expect(await store.safetyCopies.count()).toBe(1);
  });

  it('detects deletion of a browser key required by both the original and incoming snapshots', async () => {
    await seedWord();
    const cp = await encrypted(await captureIndependentPayload(storage, () => 0));
    await db.words.clear(); persistedDefaults();
    storage.failKey = 'langlearn-xp';
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage })).rejects.toMatchObject({ name: 'QuotaExceededError' });
    storage.removeItem('langlearn-badges');
    storage.failKey = '';
    await expect(restoreIndependentCheckpoint(kit, cp, { store, storage, retry: true })).rejects.toMatchObject({ code: 'restore-conflict' });
    expect(storage.getItem('langlearn-badges')).toBeNull();
    expect((await db.words.get(7))?.id).toBe(7);
  });
});
