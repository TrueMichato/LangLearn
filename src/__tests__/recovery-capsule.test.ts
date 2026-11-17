import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackupPayload } from '../db/backup';
import {
  MAX_RECOVERY_CAPSULE_BYTES,
  RECOVERY_CAPSULE_KEY,
  RECOVERY_CAPSULE_TABLES,
  RECOVERY_CAPSULE_VERSION,
  parseRecoveryCapsule,
  readRecoveryCapsule,
  refreshRecoveryCapsule,
  storeRecoveryCapsule,
  startRecoveryCapsuleLifecycle,
  type CapsuleStorage,
  type RecoveryCapsule,
} from '../db/recovery-capsule';
import {
  findSuspectedDataLoss,
  restoreRecoveryPoint,
  takeSnapshot,
  listSnapshots,
  dismissDataLoss,
  openDatabase,
  subscribeDatabaseInvalidation,
} from '../db/recovery';
import { getWordsForSet } from '../lib/study-sets';
import {
  CURRENT_SCHEMA_VERSION,
  db,
  type Word,
} from '../db/schema';

class MemoryStorage implements CapsuleStorage {
  readonly values = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    this.values.set(key, value);
  }
}

function emptyPayload(): BackupPayload {
  return {
    version: 2,
    exportedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tables: Object.fromEntries(
      RECOVERY_CAPSULE_TABLES.map((name) => [name, []]),
    ) as BackupPayload['tables'],
    localStorage: {},
  };
}

function capsule(
  createdAt: string,
  words: unknown[] = [{ id: 1, language: 'ja', word: '猫' }],
): RecoveryCapsule {
  const payload = emptyPayload();
  payload.tables.words = words;
  return {
    version: RECOVERY_CAPSULE_VERSION,
    createdAt,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    payload,
  };
}

describe('recovery capsule storage', () => {
  it('round-trips a complete versioned capsule', () => {
    const storage = new MemoryStorage();
    const original = capsule('2026-01-01T00:00:00.000Z');

    expect(storeRecoveryCapsule(original, storage).kind).toBe('saved');
    expect(readRecoveryCapsule(storage)).toEqual(original);
  });

  it('rejects malformed and future-schema capsules', () => {
    expect(parseRecoveryCapsule('not-json')).toBeNull();
    expect(
      parseRecoveryCapsule(
        JSON.stringify({
          ...capsule('2026-01-01T00:00:00.000Z'),
          schemaVersion: CURRENT_SCHEMA_VERSION + 1,
        }),
      ),
    ).toBeNull();
    expect(
      parseRecoveryCapsule(
        JSON.stringify({
          ...capsule('2026-01-01T00:00:00.000Z'),
          payload: { ...emptyPayload(), tables: { words: [] } },
        }),
      ),
    ).toBeNull();
  });

  it('accepts a complete pre-v11 capsule without guided activity progress', () => {
    const previous = capsule('2026-01-01T00:00:00.000Z');
    previous.schemaVersion = 10;
    previous.payload.schemaVersion = 10;
    delete previous.payload.tables.guidedActivityProgress;
    delete previous.payload.tables.skillProgress;

    expect(
      parseRecoveryCapsule(JSON.stringify(previous))?.payload.tables
        .guidedActivityProgress,
    ).toBeUndefined();
  });

  it('accepts v11 without skill counters but requires them in v12', () => {
    const previous = capsule('2026-01-01T00:00:00.000Z');
    previous.schemaVersion = 11;
    previous.payload.schemaVersion = 11;
    delete previous.payload.tables.skillProgress;
    expect(parseRecoveryCapsule(JSON.stringify(previous))).not.toBeNull();
    previous.schemaVersion = 12;
    previous.payload.schemaVersion = 12;
    expect(parseRecoveryCapsule(JSON.stringify(previous))).toBeNull();
  });

  it('keeps the last valid capsule when a quota write fails', () => {
    const storage = new MemoryStorage();
    const previous = capsule('2026-01-01T00:00:00.000Z');
    const next = capsule('2026-01-02T00:00:00.000Z');
    storeRecoveryCapsule(previous, storage);

    storage.failWrites = true;
    expect(storeRecoveryCapsule(next, storage).kind).toBe('failed');
    expect(readRecoveryCapsule(storage)?.createdAt).toBe(previous.createdAt);
  });

  it.each(['future-schema', 'malformed'] as const)(
    'retains the original bytes of an unreadable %s recovery copy',
    (format) => {
      const storage = new MemoryStorage();
      const previous = capsule('2026-01-01T00:00:00.000Z');
      const bytes = format === 'malformed' ? '{unreadable recovery bytes' :
        JSON.stringify({ ...previous, schemaVersion: CURRENT_SCHEMA_VERSION + 1 });
      storage.setItem(RECOVERY_CAPSULE_KEY, bytes);
      const write = vi.spyOn(storage, 'setItem');

      expect(storeRecoveryCapsule(capsule('2026-01-02T00:00:00.000Z'), storage))
        .toMatchObject({
          kind: 'kept', reason: 'unreadable-copy',
          error: { message: expect.stringMatching(/update.*export/i) },
        });
      expect(write).not.toHaveBeenCalled();
      expect(storage.getItem(RECOVERY_CAPSULE_KEY)).toBe(bytes);
    },
  );

  it('keeps the last valid capsule when the replacement is too large', () => {
    const storage = new MemoryStorage();
    const previous = capsule('2026-01-01T00:00:00.000Z');
    storeRecoveryCapsule(previous, storage);

    const oversized = capsule(
      '2026-01-02T00:00:00.000Z',
      [...previous.payload.tables.words!, { id: 2, language: 'ja', word: 'x'.repeat(MAX_RECOVERY_CAPSULE_BYTES) }],
    );
    expect(storeRecoveryCapsule(oversized, storage).kind).toBe('too-large');
    expect(readRecoveryCapsule(storage)?.createdAt).toBe(previous.createdAt);
  });
});

describe('recovery capsule restore', () => {
  const storage = new MemoryStorage();
  const lifecycles: ReturnType<typeof startRecoveryCapsuleLifecycle>[] = [];

  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
    storage.values.clear();
    storage.failWrites = false;
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(async () => {
    await Promise.all(lifecycles.splice(0).map((lifecycle) => lifecycle.stop()));
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    db.close();
    await db.delete();
  });

  it('detects missing history despite a surviving badge and a newly started timer', async () => {
    const saved = capsule('2026-01-01T00:00:00.000Z');
    storeRecoveryCapsule(saved, storage);
    await db.badges.put({ id: 'first-word', unlockedAt: saved.createdAt });
    await db.studySessions.add({
      startTime: new Date().toISOString(), endTime: null,
      durationSeconds: 0, xpEarned: 0, activity: 'srs',
    });

    expect(await findSuspectedDataLoss()).toMatchObject({ kind: 'capsule' });
    await refreshRecoveryCapsule(storage);
    expect(readRecoveryCapsule(storage)).toEqual(saved);
  });

  it('keeps the previous capsule and fails the safety check when history cannot be read', async () => {
    const saved = capsule('2026-01-01T00:00:00.000Z');
    storeRecoveryCapsule(saved, storage);
    vi.spyOn(Object.getPrototypeOf(db.words), 'toArray').mockRejectedValue(new Error('Read failed'));

    await expect(findSuspectedDataLoss()).rejects.toThrow('Read failed');
    expect((await refreshRecoveryCapsule(storage)).kind).toBe('failed');
    expect(readRecoveryCapsule(storage)).toEqual(saved);
  });

  it('refuses ambiguous word ID collisions without changing current progress or sets', async () => {
    const saved = capsule('2026-01-01T00:00:00.000Z');
    const currentWord = {
      id: 1, language: 'es', word: 'hola', reading: '', meaning: 'hello',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word' as const,
      createdAt: '2026-02-01T00:00:00.000Z',
    };
    await db.words.put(currentWord);
    storeRecoveryCapsule(saved, storage);
    expect(await findSuspectedDataLoss()).toMatchObject({ kind: 'capsule' });
    expect((await refreshRecoveryCapsule(storage)).kind).toBe('kept');
    expect(readRecoveryCapsule(storage)).toEqual(saved);
    storage.setItem('langlearn-study-sets', '{"state":{"sets":[{"wordIds":[1]}]}}');
    await expect(restoreRecoveryPoint({ kind: 'capsule', capsule: saved }))
      .rejects.toThrow(/current progress/i);
    expect(await db.words.get(1)).toEqual(currentWord);
    expect(await db.snapshots.count()).toBe(0);
    expect(storage.getItem('langlearn-study-sets')).toContain('"wordIds":[1]');
  });

  it('automatically captures the first word and lesson committed after boot, and cleans up', async () => {
    expect((await refreshRecoveryCapsule(storage)).kind).toBe('empty');
    const target = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
    const lifecycle = startRecoveryCapsuleLifecycle({ storage, delayMs: 20, visibilityTarget: target });
    lifecycles.push(lifecycle);
    await db.words.put({
      id: 41, language: 'ja', word: '猫', reading: '', meaning: 'cat',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '2026-01-01',
    });
    await db.lessonProgress.put({
      id: 'ja/first', language: 'ja', lessonId: 'first', completed: true,
      completedAt: '2026-01-01', attempts: 1, quizScore: 100,
    });
    await vi.waitFor(() => expect(readRecoveryCapsule(storage)?.payload.tables.lessonProgress).toHaveLength(1));
    expect(readRecoveryCapsule(storage)?.payload.tables.words).toHaveLength(1);
    // Hide also flushes the next pending post-commit edit.
    await db.words.update(41, { meaning: 'saved on hide' });
    target.visibilityState = 'hidden';
    target.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(readRecoveryCapsule(storage)?.payload.tables.words?.[0])
      .toMatchObject({ meaning: 'saved on hide' }));
    const saved = storage.getItem(RECOVERY_CAPSULE_KEY);

    await lifecycle.stop();
    await db.words.update(41, { meaning: 'edited after unmount' });
    target.dispatchEvent(new Event('visibilitychange'));
    await lifecycle.flush();
    expect(storage.getItem(RECOVERY_CAPSULE_KEY)).toBe(saved);
  });

  it('retains the useful capsule and snapshots even after dismissal and a little new progress', async () => {
    const saved = capsule('2026-01-01T00:00:00.000Z');
    saved.payload.tables.lessonProgress = [{
      id: 'ja/first', language: 'ja', completed: true, attempts: 1,
    }];
    storeRecoveryCapsule(saved, storage);
    await db.snapshots.add({
      createdAt: saved.createdAt, reason: 'older full copy', schemaVersion: CURRENT_SCHEMA_VERSION,
      payload: JSON.stringify(saved.payload), sizeBytes: 100,
    });
    dismissDataLoss({ kind: 'capsule', capsule: saved });
    expect(readRecoveryCapsule(storage)).toEqual(saved);
    await db.words.put({
      id: 70, language: 'es', word: 'hola', reading: '', meaning: 'hello',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '2026-02-01',
    });
    expect((await refreshRecoveryCapsule(storage)).kind).toBe('kept');
    expect(await takeSnapshot('daily automatic backup')).toBeNull();
    expect(await listSnapshots()).toHaveLength(1);
    expect(readRecoveryCapsule(storage)).toEqual(saved);
  });

  it('stops rather than reporting no recovery points when snapshot reads fail', async () => {
    vi.spyOn(db.snapshots, 'orderBy').mockImplementation(() => { throw new Error('Snapshot read failed'); });
    await expect(listSnapshots()).rejects.toThrow('Snapshot read failed');
    await expect(findSuspectedDataLoss()).rejects.toThrow('Snapshot read failed');
  });

  it('does not auto-open the database from recovery UI after opening failed', async () => {
    db.close();
    await expect(listSnapshots()).rejects.toThrow('Reload to retry');
    expect(db.isOpen()).toBe(false);
  });

  it.each(['capsule', 'snapshot'] as const)(
    'preserves new work, XP and original manual-set IDs during %s recovery',
    async (kind) => {
    const saved = capsule('2026-01-01T00:00:00.000Z', [{
      id: 41, language: 'ja', word: '猫', reading: 'ねこ', meaning: 'cat',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '2026-01-01',
    }]);
    saved.payload.tables.reviews = [{
      id: 17, wordId: 41, ease: 2.5, interval: 1, repetitions: 0,
      nextReviewDate: '2026-01-02', lastReviewDate: '',
    }];
    saved.payload.tables.studySessions = [{
      id: 2, startTime: '2026-02-01T10:00:00.000Z', endTime: null,
      durationSeconds: 100, xpEarned: 0, activity: 'srs',
    }];
    saved.payload.localStorage['langlearn-xp'] = JSON.stringify({
      version: 2, state: { bonusXP: 125, creditedVocabAttempts: {} },
    });
    storage.setItem('langlearn-xp', JSON.stringify({
      version: 2, state: { bonusXP: 150, creditedVocabAttempts: {} },
    }));
    storage.setItem('langlearn-badges', '{"state":{"unlocked":["first-word"]}}');
    storage.setItem('langlearn-study-sets', '{"state":{"sets":[{"wordIds":[41]}]}}');
    const set = {
      id: 'animals', name: 'Animals', description: '', type: 'custom' as const,
      tags: [], selectionMode: 'manual' as const, wordIds: [41], createdAt: '2026-01-01',
    };
    await db.words.put({
      id: 70, language: 'es', word: 'hola', reading: '', meaning: 'hello',
      contextSentence: '', sourceTextId: null, tags: [], type: 'word', createdAt: '2026-02-01',
    });
    await db.studySessions.put({
      id: 2, startTime: '2026-02-01T10:00:00.000Z', endTime: null,
      durationSeconds: 400, xpEarned: 10, activity: 'srs',
    });
    expect(await getWordsForSet(set)).toEqual([]);
    if (kind === 'snapshot') {
      await db.snapshots.add({
        createdAt: saved.createdAt, reason: 'older full copy', schemaVersion: CURRENT_SCHEMA_VERSION,
        payload: JSON.stringify(saved.payload), sizeBytes: 100,
      });
      const recovery = await findSuspectedDataLoss();
      expect(recovery).toMatchObject({ kind: 'snapshot' });
      await restoreRecoveryPoint(recovery!);
    } else {
      await restoreRecoveryPoint({ kind: 'capsule', capsule: saved });
    }
    expect(await db.words.get(70)).toMatchObject({ word: 'hola' });
    expect(await db.words.get(41)).toMatchObject({ word: '猫' });
    expect(await db.reviews.get(17)).toMatchObject({ wordId: 41 });
    expect(await db.studySessions.toArray()).toEqual([expect.objectContaining({ id: 2, durationSeconds: 400 })]);
    expect(await getWordsForSet(set)).toHaveLength(1);
    expect(JSON.parse(storage.getItem('langlearn-xp')!).state.bonusXP).toBe(150);
    expect(storage.getItem('langlearn-badges')).toContain('first-word');
    expect(storage.getItem('langlearn-study-sets')).toContain('"wordIds":[41]');
    const safety = (await listSnapshots())[0];
    expect(JSON.parse(safety.payload).tables.words).toEqual([expect.objectContaining({ id: 70 })]);
    },
  );

  it('leaves all data unchanged if the required pre-restore safety snapshot cannot be saved', async () => {
    const saved = capsule('2026-01-01T00:00:00.000Z');
    vi.spyOn(Object.getPrototypeOf(db.snapshots), 'add').mockRejectedValue(new Error('Quota exceeded'));
    await expect(restoreRecoveryPoint({ kind: 'capsule', capsule: saved })).rejects.toThrow('Quota exceeded');
    expect(await db.words.count()).toBe(0);
  });

  it('restores words with their review relationships after IndexedDB is emptied', async () => {
    const word: Word = {
      id: 41,
      language: 'ja',
      word: '猫',
      reading: 'ねこ',
      meaning: 'cat',
      contextSentence: '',
      sourceTextId: null,
      tags: ['lesson/animals'],
      type: 'word',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    await db.words.put(word);
    await db.reviews.put({
      id: 17,
      wordId: 41,
      ease: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: '2026-01-02',
      lastReviewDate: '2026-01-01',
    });
    await db.lessonProgress.put({
      id: 'ja/particles',
      language: 'ja',
      lessonId: 'particles',
      completed: true,
      quizScore: 90,
      completedAt: '2026-01-01T00:00:00.000Z',
      attempts: 1,
    });

    expect((await refreshRecoveryCapsule(storage)).kind).toBe('saved');
    storage.setItem('langlearn-badges', '{"state":{"unlocked":["first-word"]}}');
    const saved = readRecoveryCapsule(storage);
    expect(saved).not.toBeNull();

    await db.transaction(
      'rw',
      RECOVERY_CAPSULE_TABLES.map((name) => db.table(name)),
      async () => {
        await Promise.all(
          RECOVERY_CAPSULE_TABLES.map((name) => db.table(name).clear()),
        );
      },
    );
    expect(await db.words.count()).toBe(0);
    expect(storage.getItem('langlearn-badges')).toContain('first-word');

    const originalStorage = Object.getOwnPropertyDescriptor(
      globalThis,
      'localStorage',
    );
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });
    try {
      const detected = await findSuspectedDataLoss();
      expect(detected).toMatchObject({
        kind: 'capsule',
        capsule: { createdAt: saved!.createdAt },
      });
      await restoreRecoveryPoint(detected!);
    } finally {
      if (originalStorage) {
        Object.defineProperty(globalThis, 'localStorage', originalStorage);
      } else {
        delete (globalThis as { localStorage?: unknown }).localStorage;
      }
    }

    expect(await db.words.get(41)).toMatchObject({ word: '猫' });
    expect(await db.reviews.get(17)).toMatchObject({ wordId: 41 });
    expect(await db.lessonProgress.get('ja/particles')).toMatchObject({
      completed: true,
    });
  });

  it('uses a dedicated key outside IndexedDB', async () => {
    await db.words.put({
      language: 'es',
      word: 'hola',
      reading: '',
      meaning: 'hello',
      contextSentence: '',
      sourceTextId: null,
      tags: [],
      type: 'word',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    await refreshRecoveryCapsule(storage);
    expect(storage.getItem(RECOVERY_CAPSULE_KEY)).not.toBeNull();
    expect(await db.snapshots.count()).toBe(0);
  });

  it('keeps auto-open disabled after a native versionchange event', async () => {
    await expect(openDatabase()).resolves.toEqual({ kind: 'ready' });
    const changed = vi.fn();
    const unsubscribe = subscribeDatabaseInvalidation(changed);
    try {
      const connection = db.backendDB();
      connection.dispatchEvent(new IDBVersionChangeEvent('versionchange', {
        oldVersion: connection.version, newVersion: connection.version + 10,
      }));
      expect(changed).toHaveBeenCalledExactlyOnceWith({ kind: 'reload-required' });
      expect(db.isOpen()).toBe(false);
      await expect(db.words.count()).rejects.toMatchObject({ name: 'DatabaseClosedError' });
    } finally { unsubscribe(); }
  });
});
