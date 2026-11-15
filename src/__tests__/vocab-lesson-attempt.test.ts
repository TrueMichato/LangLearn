import 'fake-indexeddb/auto';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const target = {
    values, writes: 0, failWriteAt: 0,
    get length() { return values.size; },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      this.writes++;
      if (this.failWriteAt === this.writes) throw new Error('Storage quota');
      values.set(key, value);
    },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: target });
  return target;
});

import { db } from '../db/schema';
import { buildBackupPayload, importAllData } from '../db/backup';
import { buildRecoveryCapsule, parseRecoveryCapsule, storeRecoveryCapsule } from '../db/recovery-capsule';
import { findSuspectedDataLoss, restoreRecoveryPoint, snapshotProgressRows, takeSnapshot } from '../db/recovery';
import { useXPStore, XP_STORAGE_KEY } from '../stores/xpStore';
import {
  completeVocabAttempt, createVocabAttempt, fetchVocabLesson, isVocabAttempt,
  loadLatestVocabAttemptSummary, parseVocabAttempt, readVocabAttempt,
  restartVocabAttempt, saveVocabAttempt, vocabAttemptKey, vocabAttemptScore,
  vocabReceiptKey, VocabAttemptConflict, type VocabLessonAttempt,
} from '../lib/vocab-lesson-attempt';
import { VocabLessonSession } from '../lib/vocab-lesson-session';
import { nextVocabItem, submitVocabItem } from '../lib/vocab-lesson-state';
import type { VocabLesson } from '../types/vocab';

const lesson: VocabLesson = {
  id: 'legacy-body-id',
  words: Array.from({ length: 5 }, (_, i) => ({
    word: `語${i}`, reading: `reading${i}`, meaning: `meaning${i}`,
    example: `Example ${i}`, exampleMeaning: `Translation ${i}`,
  })),
  exercises: [
    { type: 'match', pairs: 3 },
    { type: 'fill-blank', items: [{ sentence: '___ please', answer: '語0', hint: 'hint' }] },
    { type: 'multiple-choice', items: [
      { question: 'Choose', options: ['語0', '語1'], answer: 0 },
      { question: 'Choose again', options: ['語2', '語3'], answer: 1 },
    ] },
  ],
};

function finished(attempt: VocabLessonAttempt): VocabLessonAttempt {
  return {
    ...attempt, step: 'summary', wordIndex: attempt.lesson.words.length - 1,
    exerciseIndex: Math.max(0, attempt.exercises.length - 1),
    states: attempt.exercises.map((exercise) => exercise.type === 'match'
      ? { kind: 'match', matched: exercise.words.map((_, i) => i), selectedWord: null, wrongMeaning: null }
      : {
        kind: 'items', index: exercise.items.length - 1, input: 'answer', showHint: true,
        selected: exercise.type === 'multiple-choice' || exercise.type === 'listening'
          ? exercise.items.at(-1)!.answer : null,
        answers: exercise.items.map(() => true),
      }),
  };
}

async function savedFinished(language = 'ja') {
  const attempt = finished(createVocabAttempt(language, 'intro', lesson, 'First words'));
  return saveVocabAttempt(attempt, null);
}

async function storedAttempt(language = 'ja') {
  const read = await readVocabAttempt(language, 'intro');
  if (read.kind !== 'saved') throw new Error('Expected saved attempt');
  return read.attempt;
}

beforeEach(async () => {
  vi.restoreAllMocks();
  storage.failWriteAt = 0;
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
  storage.clear();
  useXPStore.setState({ bonusXP: 0, creditedVocabAttempts: {} });
  storage.writes = 0;
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => structuredClone(lesson) })));
});
afterEach(() => {
  storage.failWriteAt = 0;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterAll(() => { delete (globalThis as { localStorage?: Storage }).localStorage; });

describe('vocabulary checkpoints', () => {
  it('recovers word 4, title and frozen generated/matching order without hydration writes', async () => {
    const first = new VocabLessonSession('ja', 'intro', 'First words');
    await first.load();
    await first.settled();
    first.checkpoint({ wordIndex: 3 });
    await first.settled();
    const original = first.getSnapshot().attempt!;
    db.close();
    await db.open();
    const write = vi.spyOn(db.settings, 'put');
    const resumed = new VocabLessonSession('ja', 'intro', 'First words');
    await resumed.load();
    await resumed.settled();
    expect(resumed.getSnapshot()).toMatchObject({ resumed: true, phase: 'ready', attempt: { wordIndex: 3 } });
    expect(resumed.getSnapshot().attempt).toEqual(original);
    expect(write).not.toHaveBeenCalled();
    expect(await loadLatestVocabAttemptSummary('ja')).toMatchObject({
      language: 'ja', lessonId: 'intro', title: 'First words', stage: 'Words', position: 4,
      itemCount: 5, route: '/vocab-lessons?lesson=intro', attemptId: original.attemptId,
    });
    expect(original.exercises.map((exercise) => exercise.type)).toEqual([
      'match', 'fill-blank', 'multiple-choice', 'typing', 'listening',
    ]);
  });

  it('lets immediate Home/remount reads wait for this tab’s queued meaningful changes', async () => {
    const first = new VocabLessonSession('ja', 'intro');
    await first.load(); await first.settled();
    first.checkpoint({ wordIndex: 1 });
    first.checkpoint({ wordIndex: 2 });
    first.checkpoint({ wordIndex: 3 });
    const reopened = new VocabLessonSession('ja', 'intro');
    const [summary] = await Promise.all([loadLatestVocabAttemptSummary('ja'), reopened.load()]);
    expect(summary!.position).toBe(4);
    expect(reopened.getSnapshot().attempt!.wordIndex).toBe(3);
    expect(reopened.getSnapshot().saveStatus).toBe('saved');
  });

  it('adopts a late-arriving catalog title without resetting the saved position or frozen payload', async () => {
    const saved = await saveVocabAttempt({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 3 }, null);
    const session = new VocabLessonSession('ja', 'intro', 'First words');
    await session.load(); await session.settled();
    expect(await loadLatestVocabAttemptSummary('ja')).toMatchObject({ title: 'First words', position: 4 });
    expect(session.getSnapshot().attempt!.attemptId).toBe(saved.attemptId);
    expect(session.getSnapshot().attempt!.exercises).toEqual(saved.exercises);
  });

  it.each([true, false])('keeps unsaved input and question order on a late title update (initial save failure: %s)', async (initialFailure) => {
    const put = vi.spyOn(db.settings, 'put');
    if (initialFailure) put.mockRejectedValueOnce(new Error('Disk full'));
    const session = new VocabLessonSession('ja', 'intro');
    await session.load(); await session.settled();
    if (!initialFailure) put.mockRejectedValueOnce(new Error('Disk full'));
    const original = session.getSnapshot().attempt!;
    const states = [...original.states];
    states[0] = { kind: 'match', matched: [0, 1, 2], selectedWord: null, wrongMeaning: null };
    states[1] = {
      kind: 'items', index: 0, input: 'unfinished answer', showHint: true, selected: null, answers: [],
    };
    session.checkpoint({ wordIndex: 3, step: 'exercise', exerciseIndex: 1, states });
    await session.settled();
    expect(session.getSnapshot().saveStatus).toBe('unsaved');
    const fetches = vi.mocked(fetch).mock.calls.length;
    session.setTitle('Late catalog title');
    const current = session.getSnapshot();
    expect(current).toMatchObject({
      phase: 'ready', saveStatus: 'unsaved',
      attempt: { title: 'Late catalog title', wordIndex: 3, exerciseIndex: 1, states },
    });
    expect(current.attempt!.attemptId).toBe(original.attemptId);
    expect(current.attempt!.exercises).toBe(original.exercises);
    expect(vi.mocked(fetch).mock.calls).toHaveLength(fetches);
    expect(await readVocabAttempt('ja', 'intro')).toMatchObject(initialFailure
      ? { kind: 'empty' } : { kind: 'saved', attempt: { wordIndex: 0, step: 'words' } });
    session.retrySave(); await session.settled();
    expect((await storedAttempt()).states[1]).toMatchObject({ input: 'unfinished answer', showHint: true });
    expect((await storedAttempt()).title).toBe('Late catalog title');
  });

  it('preserves stage, hint, input, submitted answers and accumulated scores', async () => {
    const attempt = createVocabAttempt('ar', 'intro', lesson);
    attempt.step = 'exercise';
    attempt.exerciseIndex = 1;
    attempt.states[0] = { kind: 'match', matched: [0, 1, 2], selectedWord: null, wrongMeaning: null };
    attempt.states[1] = {
      kind: 'items', index: 0, input: 'جزء من الإجابة', showHint: true, selected: null, answers: [],
    };
    const first = await saveVocabAttempt(attempt, null);
    expect((await storedAttempt('ar')).states[1]).toEqual(attempt.states[1]);
    const state = first.states[1];
    if (state.kind !== 'items') throw new Error('Expected item state');
    first.states[1] = submitVocabItem({ ...state, input: '語0' }, true);
    const submitted = await saveVocabAttempt(first, first);
    expect((await storedAttempt('ar')).states[1]).toMatchObject({ input: '語0', answers: [true], showHint: true });
    expect(vocabAttemptScore(submitted).correct).toBe(4);
    const completeState = finished(submitted);
    const saved = await saveVocabAttempt(completeState, submitted);
    expect(isVocabAttempt(saved)).toBe(true);
    expect((await storedAttempt('ar')).states).toEqual(completeState.states);
  });

  it('preserves selected match tiles and revealed choice answers; repeated submit is harmless', async () => {
    const attempt = createVocabAttempt('ja', 'intro', lesson);
    attempt.step = 'exercise';
    attempt.states[0] = { kind: 'match', matched: [2], selectedWord: 1, wrongMeaning: 0 };
    const saved = await saveVocabAttempt(attempt, null);
    expect((await storedAttempt()).states[0]).toEqual(saved.states[0]);
    const state = { kind: 'items' as const, index: 0, input: '', showHint: false, selected: null, answers: [] };
    const answered = submitVocabItem(state, false, 1);
    expect(submitVocabItem(answered, true, 0)).toBe(answered);
    expect(nextVocabItem(answered)).toMatchObject({ index: 1, answers: [false], selected: null });
  });

  it('isolates languages/lessons and restarts only the intentional attempt with a new identity', async () => {
    const first = await saveVocabAttempt({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 3 }, null);
    const russian = await saveVocabAttempt(createVocabAttempt('ru', 'intro', lesson), null);
    await saveVocabAttempt(createVocabAttempt('ja', 'other', lesson), null);
    const row = await db.settings.get(vocabAttemptKey('ja', 'intro'));
    const restarted = await restartVocabAttempt(createVocabAttempt('ja', 'intro', lesson), row!.value);
    expect(restarted.attemptId).not.toBe(first.attemptId);
    expect(restarted.wordIndex).toBe(0);
    expect(await storedAttempt('ru')).toEqual(russian);
    expect(await readVocabAttempt('ja', 'other')).toMatchObject({ kind: 'saved' });
    expect((await db.settings.toArray()).filter((item) => item.key.startsWith('vocab-attempt-recovery:'))).toHaveLength(1);
  });

  it('retains malformed/incompatible records and archives evidence only on explicit restart', async () => {
    const key = vocabAttemptKey('ja', 'intro');
    for (const raw of ['{broken', JSON.stringify({ ...createVocabAttempt('ja', 'intro', lesson), version: 99 }),
      JSON.stringify({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 999 })]) {
      await db.settings.put({ key, value: raw });
      expect(await readVocabAttempt('ja', 'intro')).toMatchObject({ kind: 'recovery', raw });
      const session = new VocabLessonSession('ja', 'intro');
      await session.load();
      expect(session.getSnapshot().phase).toBe('recovery');
      expect((await db.settings.get(key))!.value).toBe(raw);
      expect(session.recoveryData()).toBe(raw);
    }
    const session = new VocabLessonSession('ja', 'intro');
    await session.load();
    await session.restart();
    expect(session.getSnapshot().phase).toBe('ready');
    expect(await readVocabAttempt('ja', 'intro')).toMatchObject({ kind: 'saved' });
  });

  it('rejects invalid frozen orders, score states and content revisions', () => {
    const attempt = createVocabAttempt('ja', 'intro', lesson);
    const badOrder = structuredClone(attempt);
    const match = badOrder.exercises[0];
    if (match.type !== 'match') throw new Error('Expected match');
    match.wordOrder = [0, 0, 0];
    expect(isVocabAttempt(badOrder)).toBe(false);
    expect(isVocabAttempt({ ...attempt, contentRevision: 'changed' })).toBe(false);
    expect(isVocabAttempt({ ...attempt, step: 'summary' })).toBe(false);
    expect(parseVocabAttempt(JSON.stringify(attempt), 'ru', 'intro').kind).toBe('recovery');
    const corrupt = structuredClone(attempt);
    corrupt.states[0] = { kind: 'match', matched: [4], selectedWord: null, wrongMeaning: null };
    expect(isVocabAttempt(corrupt)).toBe(false);
  });

  it('detects stale revisions and identities, including a stale tab trying to restart', async () => {
    const first = new VocabLessonSession('ja', 'intro');
    await first.load(); await first.settled();
    const stale = first.getSnapshot().attempt!;
    const other = new VocabLessonSession('ja', 'intro');
    await other.load();
    first.checkpoint({ wordIndex: 3 }); await first.settled();
    other.checkpoint({ wordIndex: 1 }); await other.settled();
    expect(other.getSnapshot().saveStatus).toBe('conflict');
    await other.restart();
    expect(other.getSnapshot().saveStatus).toBe('conflict');
    expect((await storedAttempt()).wordIndex).toBe(3);
    await expect(saveVocabAttempt(stale, stale)).rejects.toBeInstanceOf(VocabAttemptConflict);
    await expect(saveVocabAttempt(createVocabAttempt('ja', 'intro', lesson), await storedAttempt()))
      .rejects.toBeInstanceOf(VocabAttemptConflict);
  });

  it('keeps in-memory work usable after failed writes and retries the latest checkpoint', async () => {
    const session = new VocabLessonSession('ja', 'intro');
    await session.load(); await session.settled();
    vi.spyOn(db.settings, 'put').mockRejectedValueOnce(new Error('Disk full'));
    session.checkpoint({ wordIndex: 2 }); await session.settled();
    expect(session.getSnapshot().saveStatus).toBe('unsaved');
    session.checkpoint({ wordIndex: 3 }); await session.settled();
    expect(session.getSnapshot().attempt!.wordIndex).toBe(3);
    expect((await storedAttempt()).wordIndex).toBe(0);
    session.retrySave(); await session.settled();
    expect(session.getSnapshot().saveStatus).toBe('saved');
    expect((await storedAttempt()).wordIndex).toBe(3);
  });

  it('keeps a new unsaved attempt usable when its very first checkpoint fails', async () => {
    vi.spyOn(db.settings, 'put').mockRejectedValueOnce(new Error('Disk full'));
    const session = new VocabLessonSession('ja', 'intro');
    await session.load(); await session.settled();
    const frozen = session.getSnapshot().attempt!.exercises;
    expect(session.getSnapshot()).toMatchObject({ phase: 'ready', saveStatus: 'unsaved' });
    expect(await readVocabAttempt('ja', 'intro')).toMatchObject({ kind: 'empty' });
    session.checkpoint({ wordIndex: 3 });
    await session.load(); await session.settled();
    expect((await storedAttempt()).wordIndex).toBe(3);
    expect((await storedAttempt()).exercises).toEqual(frozen);
  });

  it('never overwrites existing work after a read failure', async () => {
    const original = await saveVocabAttempt({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 3 }, null);
    vi.spyOn(db.settings, 'get').mockRejectedValueOnce(new Error('Read failed'));
    const write = vi.spyOn(db.settings, 'put');
    const session = new VocabLessonSession('ja', 'intro');
    await session.load();
    expect(session.getSnapshot().phase).toBe('error');
    expect(write).not.toHaveBeenCalled();
    await session.load();
    expect(session.getSnapshot().attempt).toEqual(original);
  });

  it('does not make a frozen resume wait for a stalled network check or overwrite progress made during it', async () => {
    await saveVocabAttempt(createVocabAttempt('ja', 'intro', lesson), null);
    let respond!: (response: Response) => void;
    vi.mocked(globalThis.fetch).mockImplementation(() => new Promise((resolve) => { respond = resolve; }));
    const session = new VocabLessonSession('ja', 'intro');
    const loading = session.load();
    await vi.waitFor(() => expect(session.getSnapshot().phase).toBe('ready'));
    session.checkpoint({ wordIndex: 3 });
    await session.settled();
    respond({ ok: true, json: async () => structuredClone(lesson) } as Response);
    await loading;
    expect(session.getSnapshot().attempt!.wordIndex).toBe(3);
    expect((await storedAttempt()).wordIndex).toBe(3);
  });

  it('accepts distinct authored senses sharing a spelling and freezes matching by tile identity', () => {
    const homonyms: VocabLesson = {
      ...lesson,
      words: [lesson.words[0], { ...lesson.words[0], meaning: 'another sense' }],
      exercises: [{ type: 'match', pairs: 2 }],
    };
    const attempt = createVocabAttempt('es', 'intro', homonyms);
    expect(isVocabAttempt(attempt)).toBe(true);
    const match = attempt.exercises[0];
    if (match.type !== 'match') throw new Error('Expected match');
    expect(match.words.map((word) => word.word)).toEqual(['語0', '語0']);
    expect(new Set(match.wordOrder).size).toBe(2);
  });

  it('resumes frozen material offline; changed or missing content gets explicit recovery and real retry', async () => {
    const original = await saveVocabAttempt(createVocabAttempt('ja', 'intro', lesson), null);
    const fetch = vi.mocked(globalThis.fetch);
    fetch.mockRejectedValue(new Error('Offline'));
    const session = new VocabLessonSession('ja', 'intro');
    await session.load();
    expect(session.getSnapshot()).toMatchObject({ phase: 'ready', attempt: original, resumed: true });
    expect(session.getSnapshot().message).toContain('saved lesson copy');
    fetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await session.load();
    expect(session.getSnapshot()).toMatchObject({ phase: 'recovery', attempt: original });
    expect(session.getSnapshot().message).toContain('no longer available');
    session.continueSaved();
    expect(session.getSnapshot().phase).toBe('ready');
    fetch.mockResolvedValue({ ok: true, json: async () => ({ ...lesson, id: 'changed' }) } as Response);
    await session.load();
    expect(session.getSnapshot().phase).toBe('recovery');
    expect(session.getSnapshot().message).toContain('changed');
    expect(await storedAttempt()).toEqual(original);
    await session.restart();
    expect(session.getSnapshot().attempt!.lesson.id).toBe('changed');
    expect(session.getSnapshot().attempt!.attemptId).not.toBe(original.attemptId);
  });

  it('distinguishes missing content, transient failures and invalid content without freezing a fallback', async () => {
    const fetch = vi.mocked(globalThis.fetch);
    fetch.mockResolvedValue({ ok: false, status: 503 } as Response);
    await expect(fetchVocabLesson('ja', 'intro')).rejects.toMatchObject({ kind: 'unavailable' });
    fetch.mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(fetchVocabLesson('ja', 'intro')).rejects.toMatchObject({ kind: 'missing' });
    fetch.mockResolvedValue({ ok: true, json: async () => ({ words: [] }) } as Response);
    await expect(fetchVocabLesson('ja', 'intro')).rejects.toMatchObject({ kind: 'invalid' });
    expect(await readVocabAttempt('ja', 'intro')).toMatchObject({ kind: 'empty' });
  });
});

describe('retry-safe completion across IndexedDB and XP storage', () => {
  it('completes once per attempt, preserving attempts and explicit vocabulary-save boundaries', async () => {
    await db.lessonProgress.put({
      id: 'ja/vocab/intro', language: 'ja', lessonId: 'vocab/intro', completed: false,
      attempts: 4, quizScore: 0, completedAt: '',
    });
    const attempt = await savedFinished();
    const put = vi.spyOn(db.lessonProgress, 'put');
    const [credited] = await Promise.all([completeVocabAttempt(attempt), completeVocabAttempt(attempt)]);
    await completeVocabAttempt(credited);
    expect(put).toHaveBeenCalledTimes(1);
    expect(await db.lessonProgress.get('ja/vocab/intro')).toMatchObject({ completed: true, attempts: 4, completionMethod: 'lesson' });
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(attempt).xp);
    expect(await loadLatestVocabAttemptSummary('ja')).toBeNull();
    expect(await db.words.count()).toBe(0);
    expect(await db.reviews.count()).toBe(0);
  });

  it('retains a pending receipt after DB completion when XP fails, and resumes it without another progress write', async () => {
    const attempt = await savedFinished();
    storage.failWriteAt = 1;
    const put = vi.spyOn(db.lessonProgress, 'put');
    await expect(completeVocabAttempt(attempt)).rejects.toThrow('Storage quota');
    expect(await db.lessonProgress.get('ja/vocab/intro')).toMatchObject({ completed: true });
    expect((await storedAttempt()).completion).toBe('pending');
    expect(useXPStore.getState().bonusXP).toBe(0);
    const session = new VocabLessonSession('ja', 'intro');
    await session.load(); await session.settled();
    expect(session.getSnapshot().attempt!.completion).toBe('credited');
    expect(put).toHaveBeenCalledTimes(1);
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(attempt).xp);
  });

  it('does not re-award if XP persisted but the store acknowledgement write failed', async () => {
    const attempt = await savedFinished();
    storage.failWriteAt = 2;
    await expect(completeVocabAttempt(attempt)).rejects.toThrow('Storage quota');
    const durable = JSON.parse(storage.getItem(XP_STORAGE_KEY)!);
    expect(durable.state.creditedVocabAttempts[attempt.attemptId]).toBe(vocabAttemptScore(attempt).xp);
    expect((await storedAttempt()).completion).toBe('pending');
    await useXPStore.persist.rehydrate();
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(attempt).xp);
  });

  it('does not re-award if receipt finalization fails after durable XP success', async () => {
    const attempt = await savedFinished();
    const original = db.settings.put.bind(db.settings);
    vi.spyOn(db.settings, 'put').mockImplementation((row) => {
      if (row.key === vocabReceiptKey(attempt.attemptId) && JSON.parse(row.value).status === 'credited') {
        throw new Error('Final receipt write failed');
      }
      return original(row);
    });
    await expect(completeVocabAttempt(attempt)).rejects.toThrow('Final receipt write failed');
    expect((await storedAttempt()).completion).toBe('pending');
    const xp = useXPStore.getState().bonusXP;
    vi.restoreAllMocks();
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(xp);
  });

  it('rolls back lesson progress if committing the pending receipt fails', async () => {
    const attempt = await savedFinished();
    const original = db.settings.put.bind(db.settings);
    vi.spyOn(db.settings, 'put').mockImplementation((row) => {
      if (row.key === vocabReceiptKey(attempt.attemptId)) throw new Error('Receipt write failed');
      return original(row);
    });
    await expect(completeVocabAttempt(attempt)).rejects.toThrow('Receipt write failed');
    expect(await db.lessonProgress.count()).toBe(0);
    expect(useXPStore.getState().bonusXP).toBe(0);
    expect((await storedAttempt()).completion).toBe('active');
  });

  it('allows legitimate new retake rewards, but rejects completion from a replaced stale attempt', async () => {
    const first = await completeVocabAttempt(await savedFinished());
    const raw = (await db.settings.get(vocabAttemptKey('ja', 'intro')))!.value;
    const retake = await restartVocabAttempt(createVocabAttempt('ja', 'intro', lesson), raw);
    await expect(completeVocabAttempt(first)).rejects.toBeInstanceOf(VocabAttemptConflict);
    const ready = await saveVocabAttempt(finished(retake), retake);
    await completeVocabAttempt(ready);
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(first).xp * 2);
    expect(Object.keys(useXPStore.getState().creditedVocabAttempts)).toHaveLength(2);
    expect((await db.lessonProgress.get('ja/vocab/intro'))!.attempts).toBe(1);
  });

  it('migrates version 1/unversioned totals and preserves other activities addXP', async () => {
    for (const version of [undefined, 0, 1]) {
      storage.setItem(XP_STORAGE_KEY, JSON.stringify({ version, state: { bonusXP: 140 } }));
      await useXPStore.persist.rehydrate();
      expect(useXPStore.getState().bonusXP).toBe(140);
      expect(useXPStore.getState().creditedVocabAttempts).toEqual({});
    }
    useXPStore.getState().addXP(7);
    const attempt = await savedFinished();
    await completeVocabAttempt(attempt);
    useXPStore.getState().addXP(3);
    const raw = JSON.parse(storage.getItem(XP_STORAGE_KEY)!);
    expect(raw.version).toBe(2);
    expect(raw.state.bonusXP).toBe(150 + vocabAttemptScore(attempt).xp);
    expect(raw.state.creditedVocabAttempts[attempt.attemptId]).toBe(vocabAttemptScore(attempt).xp);
  });

  it('does not silently replace corrupt XP storage with a zero total', async () => {
    const attempt = await savedFinished();
    storage.setItem(XP_STORAGE_KEY, '{"version":2,"state":{"bonusXP":"broken"}}');
    await expect(completeVocabAttempt(attempt)).rejects.toThrow('XP storage needs recovery');
    expect(storage.getItem(XP_STORAGE_KEY)).toContain('"broken"');
    expect((await storedAttempt()).completion).toBe('pending');
  });

  it('retains a mismatched reward receipt for recovery rather than crediting a corrupted amount', async () => {
    const attempt = await savedFinished();
    storage.failWriteAt = 1;
    await expect(completeVocabAttempt(attempt)).rejects.toThrow();
    storage.failWriteAt = 0;
    const row = (await db.settings.get(vocabReceiptKey(attempt.attemptId)))!;
    const corrupt = JSON.stringify({ ...JSON.parse(row.value), xp: 9999 });
    await db.settings.put({ ...row, value: corrupt });
    await expect(completeVocabAttempt(await storedAttempt())).rejects.toThrow('needs recovery');
    expect((await db.settings.get(row.key))!.value).toBe(corrupt);
    expect(useXPStore.getState().bonusXP).toBe(0);
  });

  it('keeps completion visibly unconfirmed in the live session until retry succeeds', async () => {
    await savedFinished();
    storage.failWriteAt = 1;
    const session = new VocabLessonSession('ja', 'intro');
    await session.load(); await session.settled();
    expect(session.getSnapshot().saveStatus).toBe('unsaved');
    expect(session.getSnapshot().attempt!.completion).not.toBe('credited');
    expect(session.getSnapshot().message).toContain('XP is not confirmed');
    session.retrySave(); await session.settled();
    expect(session.getSnapshot().saveStatus).toBe('saved');
    expect(session.getSnapshot().attempt!.completion).toBe('credited');
  });

  it('serializes simultaneous vocabulary awards and preserves their tokens through a stale-tab ordinary award', async () => {
    const japanese = await savedFinished('ja');
    const russian = await savedFinished('ru');
    await Promise.all([completeVocabAttempt(japanese), completeVocabAttempt(russian)]);
    const earned = vocabAttemptScore(japanese).xp + vocabAttemptScore(russian).xp;
    expect(useXPStore.getState().bonusXP).toBe(earned);
    const durable = storage.getItem(XP_STORAGE_KEY)!;
    useXPStore.setState({ bonusXP: 0, creditedVocabAttempts: {} });
    storage.setItem(XP_STORAGE_KEY, durable);
    useXPStore.getState().addXP(2);
    expect(useXPStore.getState().bonusXP).toBe(earned + 2);
    expect(Object.keys(JSON.parse(storage.getItem(XP_STORAGE_KEY)!).state.creditedVocabAttempts)).toHaveLength(2);
  });
});

describe('attempt and reward backup/recovery', () => {
  async function pendingAfterAward() {
    const attempt = await savedFinished();
    storage.failWriteAt = 2;
    await expect(completeVocabAttempt(attempt)).rejects.toThrow();
    storage.failWriteAt = 0;
    return attempt;
  }

  it('round-trips frozen attempts and pending reward tokens through full replacement backups', async () => {
    const attempt = await pendingAfterAward();
    const payload = await buildBackupPayload();
    expect(payload.tables.settings).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: vocabReceiptKey(attempt.attemptId) }),
      expect.objectContaining({ key: vocabAttemptKey('ja', 'intro') }),
    ]));
    await db.settings.clear(); await db.lessonProgress.clear();
    useXPStore.setState({ bonusXP: 0, creditedVocabAttempts: {} });
    storage.clear();
    await importAllData(JSON.stringify(payload), 'replace');
    await useXPStore.persist.rehydrate();
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(attempt).xp);
    expect((await storedAttempt()).exercises).toEqual(attempt.exercises);
  });

  it('keeps live XP in merge mode and transfers source token evidence to pending receipts', async () => {
    const attempt = await pendingAfterAward();
    const payload = await buildBackupPayload();
    await db.settings.clear(); await db.lessonProgress.clear();
    useXPStore.setState({ bonusXP: 17, creditedVocabAttempts: {} });
    const receipt = payload.tables.settings!.find((row) =>
      (row as { key: string }).key === vocabReceiptKey(attempt.attemptId));
    await db.settings.put(receipt as { key: string; value: string });
    await importAllData(JSON.stringify(payload), 'merge');
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(17);
    expect(JSON.parse((await db.settings.get(vocabReceiptKey(attempt.attemptId)))!.value).status).toBe('credited');
    expect((await storedAttempt()).exercises).toEqual(attempt.exercises);
  });

  it('carries attempts, receipts and XP tokens in recovery capsules and still accepts old backups', async () => {
    const attempt = await pendingAfterAward();
    const capsule = await buildRecoveryCapsule();
    expect(capsule.payload.localStorage[XP_STORAGE_KEY]).toContain(attempt.attemptId);
    expect(parseRecoveryCapsule(JSON.stringify(capsule))).toEqual(capsule);
    await db.settings.clear(); await db.lessonProgress.clear();
    useXPStore.setState({ bonusXP: 0, creditedVocabAttempts: {} });
    await importAllData(JSON.stringify(capsule.payload));
    await useXPStore.persist.rehydrate();
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(vocabAttemptScore(attempt).xp);
    await importAllData(JSON.stringify({ version: 1, words: [] }));
    expect((await storedAttempt()).attemptId).toBe(attempt.attemptId);
  });

  it('creates recovery capsules for an unfinished lesson even before any other progress exists', async () => {
    await saveVocabAttempt(createVocabAttempt('ja', 'intro', lesson), null);
    const capsule = await buildRecoveryCapsule();
    expect(storeRecoveryCapsule(capsule, storage).kind).toBe('saved');
  });

  it('offers and restores an attempt-only capsule after total IndexedDB loss, but not while that attempt is live', async () => {
    const saved = await saveVocabAttempt({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 3 }, null);
    const capsule = await buildRecoveryCapsule();
    expect(snapshotProgressRows(JSON.stringify(capsule.payload))).toBe(1);
    expect(storeRecoveryCapsule(capsule, storage).kind).toBe('saved');
    expect(await findSuspectedDataLoss()).toBeNull();
    db.close(); await db.delete(); await db.open();
    const recovery = await findSuspectedDataLoss();
    expect(recovery).toMatchObject({ kind: 'capsule', capsule: { createdAt: capsule.createdAt } });
    await restoreRecoveryPoint(recovery!);
    expect(await storedAttempt()).toEqual(saved);
    expect(await findSuspectedDataLoss()).toBeNull();
  });

  it('protects and discovers an attempt-only in-database snapshot as well as a capsule', async () => {
    const saved = await saveVocabAttempt({ ...createVocabAttempt('ja', 'intro', lesson), wordIndex: 3 }, null);
    const snapshot = await takeSnapshot('unfinished lesson');
    expect(snapshot).not.toBeNull();
    await db.settings.clear();
    const recovery = await findSuspectedDataLoss();
    expect(recovery).toMatchObject({ kind: 'snapshot', snapshot: { id: snapshot!.id } });
    await restoreRecoveryPoint(recovery!);
    expect(await storedAttempt()).toEqual(saved);
    expect(await findSuspectedDataLoss()).toBeNull();
  });

  it('keeps 130 live XP and newer credited tokens when restoring a 100-XP capsule after IDB-only loss', async () => {
    const attempt = await pendingAfterAward();
    useXPStore.getState().addXP(100 - useXPStore.getState().bonusXP);
    const capsule = await buildRecoveryCapsule();
    expect(JSON.parse(capsule.payload.localStorage[XP_STORAGE_KEY]).state.bonusXP).toBe(100);
    expect(storeRecoveryCapsule(capsule, storage).kind).toBe('saved');
    const later = await saveVocabAttempt(finished(createVocabAttempt('ru', 'later', {
      id: 'later', words: [lesson.words[0]], exercises: [],
    })), null);
    await completeVocabAttempt(later);
    useXPStore.getState().addXP(5);
    expect(useXPStore.getState().bonusXP).toBe(130);
    db.close(); await db.delete(); await db.open();
    const recovery = await findSuspectedDataLoss();
    expect(recovery?.kind).toBe('capsule');
    await restoreRecoveryPoint(recovery!);
    await useXPStore.persist.rehydrate();
    const durable = JSON.parse(storage.getItem(XP_STORAGE_KEY)!).state;
    expect(durable.bonusXP).toBe(130);
    expect(durable.creditedVocabAttempts).toMatchObject({
      [attempt.attemptId]: vocabAttemptScore(attempt).xp,
      [later.attemptId]: 25,
    });
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(130);
    expect(JSON.parse((await db.settings.get(vocabReceiptKey(attempt.attemptId)))!.value).status).toBe('credited');
  });

  it('uses surviving live tokens to settle a capsule receipt whose reward was credited after capture', async () => {
    const attempt = await savedFinished();
    storage.failWriteAt = 1;
    await expect(completeVocabAttempt(attempt)).rejects.toThrow();
    storage.failWriteAt = 0;
    const capsule = await buildRecoveryCapsule();
    expect(JSON.parse(capsule.payload.localStorage[XP_STORAGE_KEY]).state.creditedVocabAttempts).toEqual({});
    await completeVocabAttempt(await storedAttempt());
    useXPStore.getState().addXP(30);
    const xp = useXPStore.getState().bonusXP;
    db.close(); await db.delete(); await db.open();
    await restoreRecoveryPoint({ kind: 'capsule', capsule });
    expect(useXPStore.getState().bonusXP).toBe(xp);
    await completeVocabAttempt(await storedAttempt());
    expect(useXPStore.getState().bonusXP).toBe(xp);
    expect(JSON.parse(storage.getItem(XP_STORAGE_KEY)!).state.bonusXP).toBe(xp);
  });

  it('still intentionally replaces XP when explicitly importing a full backup', async () => {
    await saveVocabAttempt(createVocabAttempt('ja', 'intro', lesson), null);
    useXPStore.getState().addXP(100);
    const backup = await buildBackupPayload();
    useXPStore.getState().addXP(30);
    await importAllData(JSON.stringify(backup), 'replace');
    await useXPStore.persist.rehydrate();
    expect(useXPStore.getState().bonusXP).toBe(100);
  });

  it('keeps older valid attempts indefinitely instead of adopting assessment expiry or caps', async () => {
    for (let index = 0; index < 5; index++) {
      const attempt = createVocabAttempt('ja', `lesson-${index}`, lesson);
      attempt.savedAt = 1;
      await db.settings.put({ key: vocabAttemptKey('ja', attempt.lessonId), value: JSON.stringify(attempt) });
    }
    expect(await readVocabAttempt('ja', 'lesson-0')).toMatchObject({ kind: 'saved' });
    expect(await loadLatestVocabAttemptSummary('ja')).not.toBeNull();
    expect(await db.settings.count()).toBe(5);
  });
});
