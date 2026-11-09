import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/schema';
import { loadKnowledgeSnapshot, observeKnowledgeSnapshot } from '../db/knowledge';
import { markLessonComplete, markLessonsComplete } from '../db/lessons';
import { saveWordsToVocabulary } from '../db/words';
import { processReview } from '../db/reviews';
import { buildWordStatusMap } from '../lib/word-status';
import { analyzeText, getKnownWordSet } from '../lib/text-analysis';
import type { KnowledgeSnapshot } from '../lib/knowledge';
import targets from '../data/lesson-targets.json';

let unsubscribe: (() => void) | undefined;
beforeEach(async () => {
  await Promise.all([db.words.clear(), db.reviews.clear(), db.lessonProgress.clear(), db.reviewLog.clear()]);
});
afterEach(async () => {
  unsubscribe?.();
  unsubscribe = undefined;
  await Promise.all([db.words.clear(), db.reviews.clear(), db.lessonProgress.clear(), db.reviewLog.clear()]);
});
const word = (language = 'es', value = 'gato') => ({
  language, word: value, reading: '', meaning: 'cat', contextSentence: '',
  sourceTextId: null, tags: [],
});

describe('knowledge database APIs', () => {
  it('resolves actual file/index IDs, including normal completion, testout and legacy body ID mismatches', async () => {
    await markLessonComplete('ja', 'verbs', 100); // grammar collision must not count
    expect((await loadKnowledgeSnapshot('ja')).familiarCount).toBe(0);
    await markLessonsComplete('ja', 'vocab', ['verbs'], 90);
    const snapshot = await loadKnowledgeSnapshot('ja');
    expect(snapshot.complete).toBe(true);
    expect(snapshot.familiarCount).toBeGreaterThanOrEqual(new Set(targets.ja.verbs).size);
    for (const target of targets.ja.verbs) expect(snapshot.getEvidence(target).taught).toBe(true);
    await markLessonComplete('es', 'vocab/greetings', 80);
    const spanish = await loadKnowledgeSnapshot('es');
    expect(spanish.getEvidence(targets.es.greetings[0]).taught).toBe(true);
    expect(spanish.getEvidence(targets.ja.verbs[0]).taught).toBe(false);
  });

  it('reacts to saving, successful grading, maturation, lapse, deletion, and bulk imports', async () => {
    let latest: KnowledgeSnapshot | undefined;
    let failure: unknown;
    unsubscribe = observeKnowledgeSnapshot('es', (value) => { latest = value; }, (error) => { failure = error; });
    await vi.waitFor(() => expect(latest?.entries).toHaveLength(0));
    await saveWordsToVocabulary([word()]);
    await vi.waitFor(() => expect(latest?.getEvidence('gato').state).toBe('learning'));
    expect(latest?.getEvidence('gato').familiar).toBe(false);
    const [review] = await db.reviews.toArray();
    await processReview(review.id!, 4);
    await vi.waitFor(() => expect(latest?.getEvidence('gato').state).toBe('familiar'));
    await db.reviews.update(review.id!, { interval: 21 });
    await vi.waitFor(() => expect(latest?.getEvidence('gato').reviewBacked).toBe(true));
    await processReview(review.id!, 1);
    await vi.waitFor(() => expect(latest?.getEvidence('gato').familiar).toBe(false));
    await markLessonComplete('es', 'vocab/greetings', 90);
    await vi.waitFor(() => expect(latest?.getEvidence(targets.es.greetings[0]).taught).toBe(true));
    await db.lessonProgress.clear();
    await vi.waitFor(() => expect(latest?.getEvidence(targets.es.greetings[0]).taught).toBe(false));
    await db.words.clear();
    await vi.waitFor(() => expect(latest?.entries).toHaveLength(0));
    await db.words.bulkPut([{ ...word('es', 'pez'), type: 'word', id: 100, createdAt: '' }]);
    await db.reviews.bulkPut([{ ...review, id: 100, wordId: 100, repetitions: 2, interval: 6 }]);
    await vi.waitFor(() => expect(latest?.getEvidence('pez').familiar).toBe(true));
    expect(failure).toBeUndefined();
  });

  it('does not inflate coverage or legacy highlighting from saved words and nonlexical cards', async () => {
    await saveWordsToVocabulary([word()]);
    await db.words.add({ ...word('es', 'regla'), createdAt: '', type: 'grammar' });
    const saved = await analyzeText('gato regla', 'es');
    expect(saved.knownWords).toBe(0);
    expect(saved.coverage.occurrences.familiar).toBe(0);
    expect((await getKnownWordSet('es')).has('gato')).toBe(false);
    const [review] = await db.reviews.toArray();
    await db.reviews.update(review.id!, { repetitions: 4, interval: 21 });
    const status = await buildWordStatusMap('es');
    expect(status.getStatus('GATO')).toBe('known');
    expect(status.getStatus('regla')).toBe('new');
    const snapshot = await loadKnowledgeSnapshot('es');
    const withSnapshot = await analyzeText('gato gato regla', 'es', snapshot);
    expect(withSnapshot.knownWords).toBe(1);
    expect(withSnapshot.coverage.occurrences.familiar).toBe(2);
    expect((await getKnownWordSet('es')).has('gato')).toBe(true);
  });

  it('isolates languages and reports DB errors rather than returning an empty snapshot', async () => {
    await saveWordsToVocabulary([word('pt')]);
    expect((await loadKnowledgeSnapshot('es')).entries).toHaveLength(0);
    const spy = vi.spyOn(db.words, 'where').mockImplementationOnce(() => { throw new Error('read failed'); });
    await expect(loadKnowledgeSnapshot('es')).rejects.toThrow('read failed');
    spy.mockRestore();
  });
});
