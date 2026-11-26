import 'fake-indexeddb/auto';
import { afterEach, expect, it } from 'vitest';
import { db, type TestHistory } from '../db/schema';
import { normalizePayload } from '../db/backup';
import { readIndependentPayload, validateIndependentPayload } from '../db/independent-backup-payload';
import { PRACTICE_RESULT_MARKER } from '../lib/test-scoring';

afterEach(async () => { await db.testHistory.clear(); });

it('preserves legacy estimates and new scoped records across database reopen and backup validation', async () => {
  const rows: TestHistory[] = [
    { id: 1, language: 'es', type: 'vocabulary', score: 20, level: 'beginner',
      totalQuestions: 20, correctAnswers: 4, durationSeconds: 30, date: '2026-11-01T00:00:00.000Z' },
    { id: 2, language: 'ja', type: 'mixed', score: 50, level: PRACTICE_RESULT_MARKER,
      totalQuestions: 20, correctAnswers: 10, durationSeconds: 90, date: '2026-11-02T00:00:00.000Z' },
  ];
  await db.testHistory.bulkAdd(rows);
  db.close();
  await db.open();
  expect(await db.testHistory.toArray()).toEqual(rows);

  const storage: Storage = {
    length: 0, key: () => null, getItem: () => null,
    setItem: () => {}, removeItem: () => {}, clear: () => {},
  };
  const checkpoint = validateIndependentPayload(JSON.parse(JSON.stringify(await readIndependentPayload(storage))));
  expect(checkpoint.tables.testHistory).toEqual(rows);
  const portable = normalizePayload({
    version: 2, exportedAt: checkpoint.capturedAt,
    schemaVersion: checkpoint.schemaVersion, tables: checkpoint.tables, localStorage: checkpoint.localStorage,
  });
  expect(portable.tables.testHistory).toEqual(rows);
});
