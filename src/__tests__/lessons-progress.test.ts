/**
 * `markLessonsComplete` is the transactional bulk writer behind testing out
 * of a lesson range: either every lesson in the range ends up completed, or
 * (on a mid-batch failure) none of them do. These tests exercise the real
 * IndexedDB transaction via fake-indexeddb, matching the convention in
 * `save-words-dedupe.test.ts`, rather than mocking Dexie.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '../db/schema';
import { getLessonProgress, markLessonComplete, markLessonsComplete } from '../db/lessons';

beforeEach(async () => {
  await db.lessonProgress.clear();
});

afterEach(async () => {
  await db.lessonProgress.clear();
});

describe('markLessonComplete (normal, single-lesson completion)', () => {
  it('tags the row completionMethod: lesson', async () => {
    await markLessonComplete('ja', 'particles', 90);
    const [row] = await getLessonProgress('ja');
    expect(row).toMatchObject({ completed: true, quizScore: 90, completionMethod: 'lesson' });
  });
});

describe('markLessonsComplete (bulk test-out completion)', () => {
  it('marks every lesson in the range completed in one call', async () => {
    await markLessonsComplete('ja', 'grammar', ['l1', 'l2', 'l3'], 90);
    const rows = await getLessonProgress('ja');
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.completed)).toBe(true);
    expect(rows.every((r) => r.quizScore === 90)).toBe(true);
  });

  it('defaults to completionMethod: tested-out', async () => {
    await markLessonsComplete('ja', 'grammar', ['l1'], 85);
    const [row] = await getLessonProgress('ja');
    expect(row.completionMethod).toBe('tested-out');
  });

  it('accepts an explicit completionMethod override', async () => {
    await markLessonsComplete('ja', 'grammar', ['l1'], 85, 'lesson');
    const [row] = await getLessonProgress('ja');
    expect(row.completionMethod).toBe('lesson');
  });

  it('applies the vocab/ progress-id prefix for the vocab track, matching VocabLessonView', async () => {
    await markLessonsComplete('ja', 'vocab', ['days-months'], 100);
    const rows = await getLessonProgress('ja');
    expect(rows).toHaveLength(1);
    expect(rows[0].lessonId).toBe('vocab/days-months');
    expect(rows[0].id).toBe('ja/vocab/days-months');
  });

  it('leaves bare lesson ids untouched for the grammar track', async () => {
    await markLessonsComplete('ja', 'grammar', ['particles'], 100);
    const rows = await getLessonProgress('ja');
    expect(rows[0].lessonId).toBe('particles');
    expect(rows[0].id).toBe('ja/particles');
  });

  it('does nothing for an empty lesson list', async () => {
    await markLessonsComplete('ja', 'grammar', [], 100);
    expect(await db.lessonProgress.count()).toBe(0);
  });

  it('preserves existing attempts counts rather than resetting them', async () => {
    // Simulate a prior failed attempt tracked elsewhere via incrementAttempts.
    await db.lessonProgress.put({
      id: 'ja/l1',
      language: 'ja',
      lessonId: 'l1',
      completed: false,
      quizScore: 0,
      completedAt: '',
      attempts: 4,
    });
    await markLessonsComplete('ja', 'grammar', ['l1'], 90);
    const [row] = await getLessonProgress('ja');
    expect(row.attempts).toBe(4);
    expect(row.completed).toBe(true);
  });

  it('does not touch lessons outside the requested range', async () => {
    await markLessonsComplete('ja', 'grammar', ['l1', 'l2'], 90);
    const rows = await getLessonProgress('ja');
    expect(rows.map((r) => r.lessonId).sort()).toEqual(['l1', 'l2']);
  });

  it('keeps grammar and vocab progress rows for the same bare id independent', async () => {
    await markLessonsComplete('ja', 'grammar', ['days-months'], 90);
    await markLessonsComplete('ja', 'vocab', ['days-months'], 70);
    const rows = await getLessonProgress('ja');
    const grammarRow = rows.find((r) => r.lessonId === 'days-months');
    const vocabRow = rows.find((r) => r.lessonId === 'vocab/days-months');
    expect(grammarRow?.quizScore).toBe(90);
    expect(vocabRow?.quizScore).toBe(70);
  });

  it('rolls back every write in the batch if one of them fails mid-transaction', async () => {
    // A learner testing out of five lessons must never end up with the
    // first few marked complete and the rest silently missing because a
    // write partway through the batch failed. Let the first two writes go
    // through for real, then fail the third, and assert nothing survived.
    const originalPut = db.lessonProgress.put.bind(db.lessonProgress);
    let calls = 0;
    const putSpy = vi.spyOn(db.lessonProgress, 'put').mockImplementation((row) => {
      calls += 1;
      if (calls === 3) throw new Error('simulated write failure');
      return originalPut(row);
    });

    await expect(
      markLessonsComplete('ja', 'grammar', ['l1', 'l2', 'l3', 'l4'], 90),
    ).rejects.toThrow('simulated write failure');

    putSpy.mockRestore();
    expect(await db.lessonProgress.count()).toBe(0);
  });
});

describe('missing completionMethod is treated as normal lesson completion', () => {
  it('a legacy row with no completionMethod field is still present and completed', async () => {
    // Rows written before this field existed have no completionMethod at
    // all — the field must stay unindexed and optional, and any consumer
    // must treat "missing" the same as 'lesson', never as 'tested-out'.
    await db.lessonProgress.put({
      id: 'ja/legacy',
      language: 'ja',
      lessonId: 'legacy',
      completed: true,
      quizScore: 95,
      completedAt: new Date().toISOString(),
      attempts: 1,
    });
    const [row] = await getLessonProgress('ja');
    expect(row.completionMethod).toBeUndefined();
    expect(row.completed).toBe(true);
    const effectiveMethod = row.completionMethod ?? 'lesson';
    expect(effectiveMethod).toBe('lesson');
  });
});
