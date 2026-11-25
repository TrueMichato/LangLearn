import { describe, expect, it } from 'vitest';
import type { Word } from '../db/schema';
import { isReviewedGrammarLesson, isRuleRecallCard, reviewedGrammarLessonId } from '../lib/grammar-review-scope';

const card = (overrides: Partial<Word>): Word => ({
  language: 'ru', word: 'машины', reading: '', meaning: '', contextSentence: 'У меня нет ___.',
  type: 'grammar', tags: ['grammar', 'lesson:genitive'], createdAt: '2026-11-25T10:00:00.000Z', sourceTextId: null,
  ...overrides,
});

describe('reviewed grammar scope is per language', () => {
  it('does not treat a reviewed Russian lesson id as reviewed in another language', () => {
    expect(isReviewedGrammarLesson('ru', 'genitive')).toBe(true);
    expect(isReviewedGrammarLesson('ja', 'genitive')).toBe(false);
    expect(isReviewedGrammarLesson('ru', undefined)).toBe(false);
    expect(isReviewedGrammarLesson('constructor', 'genitive')).toBe(false);
    const lessonSource = { lessonId: 'genitive', itemId: 'absent-car', provenance: 'authored' as const };
    expect(reviewedGrammarLessonId(card({ lessonSource }))).toBe('genitive');
    expect(reviewedGrammarLessonId(card({ language: 'ja', lessonSource }))).toBeUndefined();
    expect(reviewedGrammarLessonId(card({ language: 'ja' }))).toBeUndefined();
  });

  it('still infers legacy Russian lesson membership from tags, but only when unambiguous', () => {
    expect(reviewedGrammarLessonId(card({}))).toBe('genitive');
    expect(reviewedGrammarLessonId(card({ tags: ['grammar', 'stress'] }))).toBe('stress');
    expect(reviewedGrammarLessonId(card({ tags: ['grammar', 'stress', 'my-topic'] }))).toBeUndefined();
    expect(reviewedGrammarLessonId(card({ tags: ['lesson:genitive', 'lesson:dative'] }))).toBeUndefined();
    expect(reviewedGrammarLessonId(card({ type: 'word' }))).toBeUndefined();
    // A recorded source wins over tags, even when it names an unreviewed lesson.
    expect(reviewedGrammarLessonId(card({ lessonSource: { lessonId: 'imperative', itemId: 'x', provenance: 'authored' } }))).toBeUndefined();
  });

  it('treats only concept cards from reviewed lessons in that language as rule recall', () => {
    expect(isRuleRecallCard(card({ grammarKind: 'concept' }))).toBe(true);
    expect(isRuleRecallCard(card({ grammarKind: 'rule' }))).toBe(false);
    expect(isRuleRecallCard(card({}))).toBe(false);
    expect(isRuleRecallCard(card({ grammarKind: 'concept', language: 'ja' }))).toBe(false);
    expect(isRuleRecallCard(card({ grammarKind: 'concept', tags: ['grammar', 'lesson:imperative'] }))).toBe(false);
    expect(isRuleRecallCard(card({ grammarKind: 'concept', type: 'word' }))).toBe(false);
  });
});
