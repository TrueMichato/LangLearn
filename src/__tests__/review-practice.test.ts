import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, type Review, type Word } from '../db/schema';
import { addWord, deleteWord, getWordWithReview } from '../db/words';
import { buildBackupPayload, importAllData } from '../db/backup';
import { getWordsForSet } from '../lib/study-sets';
import { getFilteredReviewQueue } from '../lib/filtered-review';
import { buildReviewSession, getReviewCandidates, prepareReviewCards, type ReviewAttempt } from '../lib/review-session';
import { useReviewStore } from '../stores/reviewStore';
import { useStudySetsStore, type StudySet } from '../stores/studySetsStore';
import { useTimerStore } from '../stores/timerStore';

const storage = vi.hoisted(() => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const data = new Map<string, string>();
  const value = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    clear: () => { data.clear(); },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value });
  return { data, original };
});

afterAll(() => {
  if (storage.original) Object.defineProperty(globalThis, 'localStorage', storage.original);
  else delete (globalThis as { localStorage?: Storage }).localStorage;
});

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  storage.data.clear();
  useStudySetsStore.setState({ sets: [], _initialized: false });
  useReviewStore.getState().reset();
  useTimerStore.setState({ isRunning: false, elapsed: 0, sessionId: null, lastFlushedSeconds: 0 });
});

async function seed(
  value: string,
  language = 'es',
  due = false,
  options: { tags?: string[]; type?: Word['type']; review?: Partial<Review> } = {},
) {
  const id = await addWord({
    word: value, language, reading: `${value}-reading`, meaning: `${value}-meaning`,
    contextSentence: '', sourceTextId: null, tags: options.tags ?? [], type: options.type,
  });
  const card = (await getWordWithReview(id))!;
  await db.reviews.update(card.review.id!, {
    nextReviewDate: due ? '2000-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z',
    ...options.review,
  });
  return (await getWordWithReview(id))!;
}

function custom(updates: Partial<StudySet> = {}): StudySet {
  return {
    id: 'my-set', name: 'My set', description: 'Keep me', type: 'custom',
    selectionMode: 'manual', wordIds: [], tags: [], createdAt: '2026-01-01', ...updates,
  };
}

describe('set membership and practice queues', () => {
  it('includes future cards only for explicit practice and keeps Due Today intrinsically due-only', async () => {
    const due = await seed('uno', 'es', true);
    const future = await seed('dos');
    const set = custom({ wordIds: [due.word.id!, future.word.id!] });
    const smart: StudySet = { ...custom(), id: 'due', type: 'smart', smartFilter: 'due-today' };
    useStudySetsStore.setState({ sets: [set, smart] });
    expect((await getFilteredReviewQueue(set.id)).map(({ word }) => word.id)).toEqual([due.word.id]);
    expect((await getFilteredReviewQueue(set.id, 'practice')).map(({ word }) => word.id)).toEqual([due.word.id, future.word.id]);
    expect((await getFilteredReviewQueue(smart.id, 'practice')).map(({ word }) => word.id)).toEqual([due.word.id]);
    await db.reviews.update(due.review.id!, { nextReviewDate: '2099-01-01T00:00:00.000Z' });
    expect(await getFilteredReviewQueue(smart.id, 'practice')).toEqual([]);
    await expect(getFilteredReviewQueue('deleted-set', 'practice')).rejects.toThrow('no longer exists');
  });

  it('deduplicates manual IDs, ignores deleted/unreviewable words, and never fills from outside the set', async () => {
    const kept = await seed('uno');
    const deleted = await seed('dos');
    const noReview = await seed('tres');
    const otherLanguage = await seed('один', 'ru');
    await seed('unrelated');
    await deleteWord(deleted.word.id!);
    await db.reviews.delete(noReview.review.id!);
    const set = custom({ wordIds: [kept.word.id!, kept.word.id!, deleted.word.id!, noReview.word.id!, otherLanguage.word.id!, 9999] });
    expect((await getWordsForSet(set)).map(({ word }) => word.id)).toEqual([kept.word.id, otherLanguage.word.id]);
    expect((await getWordsForSet(set, 'es')).map(({ word }) => word.id)).toEqual([kept.word.id]);
    expect(await getWordsForSet({ ...set, language: 'es' }, 'ru')).toEqual([]);
    expect(await getWordsForSet(custom({ wordIds: [deleted.word.id!] }))).toEqual([]);
  });

  it('retains AND tag rules and intersects the language scope without reinterpreting legacy sets', async () => {
    const matching = await seed('uno', 'es', false, { tags: ['food', 'verbs'] });
    await seed('dos', 'es', false, { tags: ['food'] });
    await seed('три', 'ru', false, { tags: ['food', 'verbs'] });
    const legacy = custom({ selectionMode: undefined, wordIds: [999], tags: ['food', 'verbs'], language: 'es' });
    expect((await getWordsForSet(legacy)).map(({ word }) => word.id)).toEqual([matching.word.id]);
    expect(await getWordsForSet({ ...legacy, tags: [] })).toEqual([]);
  });

  it('scopes weakest cards before the twenty-card limit', async () => {
    for (let index = 0; index < 21; index++) await seed(`ru-${index}`, 'ru', false, { review: { ease: 1.3 } });
    const spanish = await seed('uno', 'es', false, { review: { ease: 2.5 } });
    const smart: StudySet = { ...custom(), type: 'smart', smartFilter: 'weakest' };
    expect(await getWordsForSet(smart, 'es')).toEqual([spanish]);
    expect(await getWordsForSet({ ...smart, language: 'es' })).toEqual([spanish]);
    expect(await getWordsForSet(smart)).toHaveLength(20);
  });

  it.each([0, -1, 1, 2])('uses the existing batch limit %s for future-inclusive practice, including grammar', async (batchSize) => {
    await seed('uno');
    await seed('regla', 'es', false, { type: 'grammar' });
    await seed('два', 'ru');
    const attempt: ReviewAttempt = { kind: 'practice', source: { type: 'library', language: 'es' }, label: 'Spanish' };
    const built = await buildReviewSession(attempt, { batchSize, adaptive: true, direction: 'both' });
    expect(built.totalEligible).toBe(2);
    expect(built.items).toHaveLength(batchSize > 0 ? Math.min(batchSize, 2) : 2);
    expect(built.items.every(({ word }) => word.language === 'es')).toBe(true);
    for (const item of built.items) expect(item.cardType).toBe(item.word.type === 'grammar' ? 'grammar' : 'study');
    expect((await buildReviewSession({ ...attempt, kind: 'scheduled' }, { batchSize, adaptive: true, direction: null })).items).toEqual([]);
    expect(await getReviewCandidates('practice', { type: 'library' })).toHaveLength(3);
  });

  it('keeps queue membership/order when recall direction changes', async () => {
    const cards = [await seed('uno'), await seed('dos'), await seed('regla', 'es', false, { type: 'grammar' })];
    const before = await prepareReviewCards(cards, 'word-to-meaning');
    const after = await prepareReviewCards(before, 'meaning-to-word');
    expect(after.map(({ word }) => word.id)).toEqual(before.map(({ word }) => word.id));
    expect(after.map(({ cardType }) => cardType)).toEqual(['reverse', 'reverse', 'grammar']);
  });

  it('preserves future-inclusive curated mistake/topic semantics for legacy scheduled links', async () => {
    const card = await seed('regla', 'es', false, { tags: ['grammar', 'topic-one'], type: 'grammar' });
    await db.reviewLog.add({
      wordId: card.word.id!, reviewId: card.review.id!, language: 'es', grade: 0,
      isLapse: true, date: new Date().toISOString(),
    });
    expect(await getReviewCandidates('scheduled', { type: 'topic', topicId: 'topic-one', language: 'es' })).toEqual([card]);
    expect(await getReviewCandidates('scheduled', { type: 'mistakes', language: 'es' })).toEqual([card]);
    expect(await getReviewCandidates('scheduled', { type: 'topic', topicId: 'topic-one', language: 'ru' })).toEqual([]);
  });
});

describe('actual grading dispatch', () => {
  it.each(['sm2', 'fsrs'] as const)('leaves every persisted field and log untouched for practice pass AND failure under %s', async (scheduler) => {
    const card = await seed('gato', 'es', false, {
      review: { ease: 1.8, interval: 10, repetitions: 4, stability: 8.7, difficulty: 7.3, lastReviewDate: '2026-01-01T00:00:00.000Z' },
    });
    const beforeReview = await db.reviews.get(card.review.id!);
    const beforeWords = await db.words.toArray();
    const beforeLogs = await db.reviewLog.toArray();
    // Exercise the same dispatch the page's manual, self-grading and keyboard
    // paths call. Routing practice through processReview makes this test fail.
    useReviewStore.getState().setQueue([{ ...card, cardType: 'classic' }], 'practice');
    await useReviewStore.getState().gradeCurrent(0, { scheduler });
    expect(useReviewStore.getState().queue).toHaveLength(2);
    expect(useReviewStore.getState().currentIndex).toBe(1);
    await useReviewStore.getState().gradeCurrent(4, { scheduler });
    expect(useReviewStore.getState().cardsReviewed).toBe(2);
    expect(await db.reviews.get(card.review.id!)).toEqual(beforeReview);
    expect(await db.words.toArray()).toEqual(beforeWords);
    expect(await db.reviewLog.toArray()).toEqual(beforeLogs);
    expect(await db.studySessions.count()).toBe(0);
    expect(await db.dailyActivity.count()).toBe(0);
  });

  it.each(['sm2', 'fsrs'] as const)('still schedules and logs reviews under %s, rejecting concurrent/obsolete grades', async (scheduler) => {
    const card = await seed('gato', 'es', true);
    const item = { ...card, cardType: 'classic' as const };
    useReviewStore.getState().setQueue([item], 'scheduled');
    const result = await Promise.all([
      useReviewStore.getState().gradeCurrent(4, { scheduler }, item),
      useReviewStore.getState().gradeCurrent(0, { scheduler }, item),
    ]);
    expect(result).toEqual([true, false]);
    const after = (await db.reviews.get(card.review.id!))!;
    expect(after.nextReviewDate).not.toBe(card.review.nextReviewDate);
    expect(after.repetitions).toBe(1);
    if (scheduler === 'fsrs') expect(after.stability).toBeGreaterThan(0);
    else expect(after.interval).toBe(1);
    expect(await db.reviewLog.count()).toBe(1);
    expect((await db.reviewLog.toArray())[0]).toMatchObject({ grade: 4, isLapse: false, wordId: card.word.id });
    expect(await useReviewStore.getState().gradeCurrent(0, { scheduler }, item)).toBe(false);
  });

  it('does not replace a new attempt when an old scheduled answer finishes', async () => {
    const card = await seed('uno', 'es', true);
    const nextCard = await seed('dos');
    useReviewStore.getState().setQueue([{ ...card, cardType: 'classic' }], 'scheduled');
    const pending = useReviewStore.getState().gradeCurrent(4);
    const nextQueue = [{ ...nextCard, cardType: 'reverse' as const }];
    useReviewStore.getState().setQueue(nextQueue, 'practice');
    expect(await pending).toBe(false);
    expect(useReviewStore.getState().queue).toEqual(nextQueue);
    expect(useReviewStore.getState().currentIndex).toBe(0);
    expect(useReviewStore.getState().isGrading).toBe(false);
  });

  it('keeps scheduled grading retryable without a partial schedule write when logging fails', async () => {
    const card = await seed('uno', 'es', true);
    useReviewStore.getState().setQueue([{ ...card, cardType: 'classic' }], 'scheduled');
    const failLog = vi.spyOn(db.reviewLog, 'add').mockRejectedValueOnce(new Error('Storage failed'));
    await expect(useReviewStore.getState().gradeCurrent(4)).rejects.toThrow('Storage failed');
    failLog.mockRestore();
    expect(await db.reviews.get(card.review.id!)).toEqual(card.review);
    expect(useReviewStore.getState().currentIndex).toBe(0);
    expect(useReviewStore.getState().isGrading).toBe(false);
    expect(await useReviewStore.getState().gradeCurrent(4)).toBe(true);
    expect((await db.reviews.get(card.review.id!))?.repetitions).toBe(1);
    expect(await db.reviewLog.count()).toBe(1);
  });

  it('stops a timer even when exiting during its asynchronous creation', async () => {
    const starting = useTimerStore.getState().start('srs');
    await useTimerStore.getState().stop();
    await starting;
    expect(useTimerStore.getState().isRunning).toBe(false);
    expect(useTimerStore.getState().sessionId).toBeNull();
    expect((await db.studySessions.toArray())[0].endTime).not.toBeNull();
  });

  it('joins overlapping timer cleanup without counting the same effort twice', async () => {
    await useTimerStore.getState().start('srs');
    useTimerStore.setState({ elapsed: 10 });
    await Promise.all([useTimerStore.getState().stop(), useTimerStore.getState().stop()]);
    expect((await db.dailyActivity.toArray())[0].studySeconds).toBe(10);
    expect(useTimerStore.getState().isRunning).toBe(false);
  });
});

describe('study-set persistence and backups', () => {
  it('migrates legacy tag sets without losing metadata, IDs or default initialization', async () => {
    const legacy = custom({ selectionMode: undefined, wordIds: undefined, tags: ['verbs'], language: 'es' });
    localStorage.setItem('langlearn-study-sets', JSON.stringify({ version: 1, state: { sets: [legacy], _initialized: false } }));
    await useStudySetsStore.persist.rehydrate();
    expect(useStudySetsStore.getState().sets[0]).toEqual({ ...legacy, selectionMode: 'tags', wordIds: [] });
    useStudySetsStore.getState().ensureDefaults();
    useStudySetsStore.getState().ensureDefaults();
    expect(useStudySetsStore.getState().sets).toHaveLength(6);
    expect(useStudySetsStore.getState()._initialized).toBe(true);
    expect(JSON.parse(localStorage.getItem('langlearn-study-sets')!).version).toBe(2);
  });

  it('round-trips manual membership and replaces a backup with word IDs intact', async () => {
    const card = await seed('uno');
    const set = custom({ wordIds: [card.word.id!] });
    useStudySetsStore.getState().addSet(set);
    await useStudySetsStore.persist.rehydrate();
    expect(useStudySetsStore.getState().sets).toEqual([set]);
    const payload = await buildBackupPayload();
    await deleteWord(card.word.id!);
    useStudySetsStore.setState({ sets: [] });
    const result = await importAllData(JSON.stringify(payload), 'replace');
    await useStudySetsStore.persist.rehydrate();
    expect(result.restoredStorageKeys).toContain('langlearn-study-sets');
    expect(useStudySetsStore.getState().sets).toEqual([set]);
    expect(await getWordsForSet(useStudySetsStore.getState().sets[0])).toEqual([card]);
  });

  it('does not import incoming persisted study sets during a merge', async () => {
    const live = custom({ id: 'live', wordIds: [123] });
    useStudySetsStore.getState().addSet(live);
    const incoming = {
      version: 2, schemaVersion: 12, tables: { words: [] },
      localStorage: { 'langlearn-study-sets': JSON.stringify({ version: 2, state: { sets: [custom({ id: 'incoming' })] } }) },
    };
    const result = await importAllData(JSON.stringify(incoming), 'merge');
    await useStudySetsStore.persist.rehydrate();
    expect(result.restoredStorageKeys).toEqual([]);
    expect(useStudySetsStore.getState().sets).toEqual([live]);
  });
});
