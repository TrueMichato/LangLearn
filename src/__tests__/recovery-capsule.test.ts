import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  type CapsuleStorage,
  type RecoveryCapsule,
} from '../db/recovery-capsule';
import {
  findSuspectedDataLoss,
  restoreRecoveryPoint,
} from '../db/recovery';
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

  it('keeps the last valid capsule when a quota write fails', () => {
    const storage = new MemoryStorage();
    const previous = capsule('2026-01-01T00:00:00.000Z');
    const next = capsule('2026-01-02T00:00:00.000Z');
    storeRecoveryCapsule(previous, storage);

    storage.failWrites = true;
    expect(storeRecoveryCapsule(next, storage).kind).toBe('failed');
    expect(readRecoveryCapsule(storage)?.createdAt).toBe(previous.createdAt);
  });

  it('keeps the last valid capsule when the replacement is too large', () => {
    const storage = new MemoryStorage();
    const previous = capsule('2026-01-01T00:00:00.000Z');
    storeRecoveryCapsule(previous, storage);

    const oversized = capsule(
      '2026-01-02T00:00:00.000Z',
      [{ id: 2, language: 'ja', word: 'x'.repeat(MAX_RECOVERY_CAPSULE_BYTES) }],
    );
    expect(storeRecoveryCapsule(oversized, storage).kind).toBe('too-large');
    expect(readRecoveryCapsule(storage)?.createdAt).toBe(previous.createdAt);
  });
});

describe('recovery capsule restore', () => {
  const storage = new MemoryStorage();

  beforeEach(async () => {
    db.close();
    await db.delete();
    await db.open();
    storage.values.clear();
    storage.failWrites = false;
  });

  afterEach(async () => {
    db.close();
    await db.delete();
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
});
