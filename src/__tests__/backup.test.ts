import { describe, it, expect } from 'vitest';
import {
  BACKUP_PAYLOAD_VERSION,
  BACKUP_STORAGE_KEYS,
  BACKUP_TABLE_NAMES,
  mergeKey,
  normalizePayload,
  tablesInPayload,
} from '../db/backup';

describe('backup coverage', () => {
  it('covers every table that holds learner progress', () => {
    // The original backup carried five tables and the import cleared them, so a
    // restore silently destroyed streaks, lessons, characters, tests and badges.
    expect(BACKUP_TABLE_NAMES).toEqual(
      expect.arrayContaining([
        'words',
        'reviews',
        'texts',
        'studySessions',
        'settings',
        'dailyActivity',
        'lessonProgress',
        'characterProgress',
        'testHistory',
        'badges',
        'guidedActivityProgress',
      ]),
    );
  });

  it('carries the persisted zustand stores', () => {
    // XP, badges and settings live in localStorage, not IndexedDB. A backup
    // without them restores an account with no level and no unlocks.
    expect(BACKUP_STORAGE_KEYS).toEqual(
      expect.arrayContaining(['langlearn-xp', 'langlearn-settings', 'langlearn-badges']),
    );
  });
});

describe('normalizePayload', () => {
  it('reads a version 1 file', () => {
    const payload = normalizePayload({
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      words: [{ id: 1, word: 'ねこ', language: 'ja' }],
      reviews: [{ id: 1, wordId: 1 }],
    });
    expect(payload.version).toBe(1);
    expect(payload.tables.words).toHaveLength(1);
    expect(payload.tables.reviews).toHaveLength(1);
  });

  it('reads a version 1 file that has no version field', () => {
    const payload = normalizePayload({ words: [], reviews: [], settings: [] });
    expect(payload.version).toBe(1);
  });

  it('reports the tables a v1 file leaves untouched', () => {
    // The distinction matters: absent is not the same as empty, and replace mode
    // must not clear a table the file never carried.
    const payload = normalizePayload({ version: 1, words: [] });
    const { present, untouched } = tablesInPayload(payload);
    expect(present).toEqual(['words']);
    expect(untouched).toContain('dailyActivity');
    expect(untouched).toContain('badges');
  });

  it('reads a version 2 file', () => {
    const payload = normalizePayload({
      version: 2,
      exportedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: 10,
      tables: { words: [{ word: 'a' }], badges: [{ id: 'first-word' }] },
      localStorage: { 'langlearn-xp': '{"state":{"bonusXP":10}}' },
    });
    expect(payload.schemaVersion).toBe(10);
    expect(payload.tables.badges).toHaveLength(1);
    expect(payload.localStorage['langlearn-xp']).toContain('bonusXP');
  });

  it('refuses localStorage keys it does not own', () => {
    const payload = normalizePayload({
      version: 2,
      tables: { words: [] },
      localStorage: { 'langlearn-xp': 'ok', 'evil-key': 'nope' },
    });
    expect(payload.localStorage['langlearn-xp']).toBe('ok');
    expect(payload.localStorage['evil-key']).toBeUndefined();
  });

  it('ignores table names it does not recognise', () => {
    const payload = normalizePayload({ version: 2, tables: { words: [], bogus: [{}] } });
    expect(Object.keys(payload.tables)).toEqual(['words']);
  });

  it('rejects input that is not a backup', () => {
    expect(() => normalizePayload(null)).toThrow();
    expect(() => normalizePayload('a string')).toThrow();
    expect(() => normalizePayload({ version: 2 })).toThrow();
  });

  it('defaults the version to the current payload format', () => {
    expect(normalizePayload({ tables: { badges: [] } }).version).toBe(BACKUP_PAYLOAD_VERSION);
  });
});

describe('mergeKey', () => {
  it('identifies a word by language and spelling', () => {
    expect(mergeKey('words', { word: 'ねこ', language: 'ja' })).toBe(
      mergeKey('words', { id: 99, word: 'ねこ', language: 'ja' }),
    );
  });

  it('separates the same spelling in different languages', () => {
    expect(mergeKey('words', { word: 'no', language: 'pt' })).not.toBe(
      mergeKey('words', { word: 'no', language: 'es' }),
    );
  });

  it('identifies a day of activity by its date', () => {
    expect(mergeKey('dailyActivity', { date: '2024-05-01' })).toBe('2024-05-01');
  });

  it('identifies keyed rows by id', () => {
    expect(mergeKey('lessonProgress', { id: 'ja/particles' })).toBe('ja/particles');
    expect(mergeKey('badges', { id: 'streak-7' })).toBe('streak-7');
    expect(
      mergeKey('guidedActivityProgress', {
        id: 'es/sentence:foundations-1',
      }),
    ).toBe('es/sentence:foundations-1');
  });

  it('returns null when a row cannot be identified', () => {
    expect(mergeKey('words', { word: 'ねこ' })).toBeNull();
    expect(mergeKey('reviews', { wordId: 1 })).toBeNull();
  });
});
