import { describe, expect, it } from 'vitest';
import { buildKnowledgeSnapshot, type KnowledgeSnapshot } from '../lib/knowledge';
import { selectPracticeItems, type PracticeCandidate } from '../lib/practice-selector';

const session = { minItems: 1, targetItems: 2, maxItems: 3 };
const options = { language: 'es', seed: 'attempt-1', session, difficulties: ['intermediate'] };
function snapshot(words: string[]): KnowledgeSnapshot {
  return buildKnowledgeSnapshot({ language: 'es',
    lessons: [{ id: 'es/vocab/example', lessonId: 'vocab/example', language: 'es',
      completed: true, quizScore: 90, completedAt: '', attempts: 1 }],
    lessonTargets: { es: { example: words } } });
}
function item(id: string, known: number, overrides: Partial<PracticeCandidate> = {}): PracticeCandidate {
  return { id, language: 'es', difficulty: 'intermediate',
    vocabulary: Array.from({ length: 10 }, (_, n) => n < known ? 'gato' : 'pez'), ...overrides };
}

describe('shared practice selector', () => {
  it('softly prefers 80–90% familiar occurrences without excluding other candidates', () => {
    const selection = selectPracticeItems(
      [item('unknown', 0), item('all', 10), item('stretch', 8), item('mostly', 9)],
      snapshot(['gato']), options);
    expect(new Set(selection.itemIds)).toEqual(new Set(['stretch', 'mostly']));
    expect(selection.items.every((candidate) =>
      (candidate.coverage?.occurrences.familiarPercentage ?? 0) >= 80)).toBe(true);
    expect(selection.limitedMatch).toBe(false);
    expect(selection.eligibleCount).toBe(4);
  });

  it('honors manual difficulty/language and caller pool, including zero-data learners', () => {
    const empty = buildKnowledgeSnapshot({ language: 'es' });
    const candidates = [
      item('advanced', 0, { difficulty: 'advanced' }),
      item('beginner', 0, { difficulty: 'beginner' }),
      item('foreign', 0, { language: 'pt', difficulty: 'beginner' }),
    ];
    const beginner = selectPracticeItems(candidates, empty,
      { language: 'es', seed: 'x', session: { ...session, targetItems: 1 } });
    expect(beginner.itemIds).toEqual(['beginner']);
    const advanced = selectPracticeItems(candidates, empty,
      { ...options, difficulties: ['advanced'] });
    expect(advanced.itemIds).toEqual(['advanced']);
    expect(advanced.reasons.join()).toContain('filters');
    expect(advanced.meetsMinimum).toBe(true);
  });

  it('treats missing/empty metadata as unknown and continues through small pools', () => {
    const selected = selectPracticeItems(
      [item('metadata-missing', 0, { vocabulary: undefined })], snapshot(['gato']), options);
    expect(selected.itemIds).toEqual(['metadata-missing']);
    expect(selected.items[0].coverage).toBeNull();
    expect(selected.limitedMatch).toBe(true);
    expect(selected.reasons.join()).toContain('unknown');
    expect(selected.meetsMinimum).toBe(true);
    const empty = selectPracticeItems([], snapshot([]), options);
    expect(empty.itemIds).toEqual([]);
    expect(empty.meetsMinimum).toBe(false);
  });

  it('provides useful reinforcement without pretending saved/initial cards are familiar', () => {
    const knowledge = buildKnowledgeSnapshot({ language: 'es', words: [{
      id: 1, language: 'es', word: 'gato', type: 'word', reading: '', meaning: '',
      contextSentence: '', tags: [], sourceTextId: null, createdAt: '',
    }], reviews: [{ wordId: 1, interval: 0, repetitions: 0, ease: 2.5,
      nextReviewDate: '', lastReviewDate: '' }] });
    const selected = selectPracticeItems([item('unknown', 0), item('weak', 10)], knowledge,
      { ...options, session: { ...session, targetItems: 1 } });
    expect(selected.itemIds).toEqual(['weak']);
    expect(selected.items[0].coverage?.occurrences.familiar).toBe(0);
    expect(selected.items[0].coverage?.occurrences.learning).toBe(10);
  });

  it('keeps selection and evidence frozen until a new explicit attempt', () => {
    const candidates = [item('cat', 9), item('fish', 1)];
    const original = snapshot(['gato']);
    const active = selectPracticeItems(candidates, original,
      { ...options, session: { ...session, targetItems: 1 } });
    expect(active.itemIds).toEqual(['cat']);
    const updated = snapshot(['pez']);
    const retry = selectPracticeItems(candidates, updated,
      { ...options, session: { ...session, targetItems: 1 } });
    expect(retry.itemIds).toEqual(['fish']);
    expect(active.itemIds).toEqual(['cat']);
    expect(active.snapshot).toBe(original);
    expect(active.snapshot.revision).not.toBe(retry.snapshot.revision);
    expect(Object.isFrozen(active.itemIds)).toBe(true);
    expect(Object.isFrozen(active.items[0])).toBe(true);
  });

  it('is deterministic independent of pool order and retains all-known practice', () => {
    const candidates = Array.from({ length: 10 }, (_, n) => item(`item-${n}`, 10));
    const a = selectPracticeItems(candidates, snapshot(['gato', 'pez']), options);
    const b = selectPracticeItems([...candidates].reverse(), snapshot(['gato', 'pez']), options);
    expect(a.itemIds).toEqual(b.itemIds);
    expect(a.itemIds).toHaveLength(2);
    expect(a.items[0].coverage?.occurrences.familiarPercentage).toBe(100);
    expect(a.limitedMatch).toBe(true);
    const changedSeed = selectPracticeItems(candidates, snapshot(['gato', 'pez']),
      { ...options, seed: 'different-attempt' });
    expect(changedSeed.itemIds).not.toEqual(a.itemIds);
  });

  it('uses relevant lesson prerequisites as a soft preference, not new gating', () => {
    const selected = selectPracticeItems([
      item('untaught', 8, { prerequisites: ['present-tense'] }),
      item('taught', 8, { prerequisites: ['vocab/example'] }),
    ], snapshot(['gato']), { ...options, session: { ...session, targetItems: 1 } });
    expect(selected.itemIds).toEqual(['taught']);
    const fallback = selectPracticeItems([item('untaught', 8, { prerequisites: ['present-tense'] })],
      snapshot(['gato']), options);
    expect(fallback.itemIds).toEqual(['untaught']);
    expect(fallback.reasons.join()).toContain('lessons');
  });

  it('rejects invalid bounds, mixed-language metadata and ambiguous IDs', () => {
    expect(() => selectPracticeItems([], snapshot([]), { ...options,
      session: { minItems: 3, targetItems: 2, maxItems: 4 } })).toThrow(/bounds/);
    expect(() => selectPracticeItems([], snapshot([]), { ...options, language: 'pt' })).toThrow(/languages/);
    expect(() => selectPracticeItems([item('a', 8), item('a', 9)], snapshot([]), options)).toThrow(/ID/);
    expect(() => selectPracticeItems([item('a', 8, { document: {
      language: 'pt', mode: 'surface', tokens: [], limitations: [],
    } })], snapshot([]), options)).toThrow(/metadata/);
  });
});
