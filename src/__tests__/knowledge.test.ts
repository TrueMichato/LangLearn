import { describe, expect, it } from 'vitest';
import { buildKnowledgeSnapshot, MATURE_REVIEW_INTERVAL } from '../lib/knowledge';
import { lexicalForms, normalizeLexeme } from '../lib/lexical';
import type { LessonProgress, Review, Word } from '../db/schema';

export function lexicalWord(word: string, overrides: Partial<Word> = {}): Word {
  return { id: 1, word, language: 'es', reading: '', meaning: '', contextSentence: '',
    sourceTextId: null, tags: [], type: 'word', createdAt: '', ...overrides };
}
export function currentReview(overrides: Partial<Review> = {}): Review {
  return { id: 1, wordId: 1, ease: 2.5, interval: 0, repetitions: 0,
    nextReviewDate: '', lastReviewDate: '', ...overrides };
}
export function completedLesson(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { id: `es/${lessonId}`, lessonId, language: 'es', completed: true,
    quizScore: 90, completedAt: '', attempts: 1, ...overrides };
}

describe('lexical knowledge evidence', () => {
  it('distinguishes saved, initial review, successful review, and mature review', () => {
    const word = lexicalWord('gato');
    expect(buildKnowledgeSnapshot({ language: 'es', words: [word] }).getEvidence('gato').state).toBe('saved');
    expect(buildKnowledgeSnapshot({ language: 'es', words: [word],
      reviews: [currentReview()] }).getEvidence('gato').state).toBe('learning');
    const successful = buildKnowledgeSnapshot({ language: 'es', words: [word],
      reviews: [currentReview({ interval: 1, repetitions: 1 })] });
    expect(successful.getEvidence('gato')).toMatchObject({
      familiar: true, successfulReview: true, reviewBacked: false,
    });
    const mature = buildKnowledgeSnapshot({ language: 'es', words: [word],
      reviews: [currentReview({ interval: MATURE_REVIEW_INTERVAL })] });
    expect(mature.getEvidence('gato')).toMatchObject({ familiar: true, reviewBacked: true });
    expect(mature.familiarCount).toBe(1);
    expect(mature.reviewBackedCount).toBe(1);
  });

  it('counts exact completed/tested-out vocabulary targets, not bare grammar IDs or exercises', () => {
    const snapshot = buildKnowledgeSnapshot({
      language: 'es',
      lessons: [
        completedLesson('vocab/animals', { completionMethod: 'tested-out' }),
        completedLesson('vocab/food', { completed: false }),
        completedLesson('greetings'), completedLesson('letters/Latin'),
        completedLesson('vocab/missing'), completedLesson('vocab/empty'),
        completedLesson('vocab/foreign', { language: 'ru' }),
      ],
      lessonTargets: { es: { animals: ['Gato', 'buenos días'], food: ['pan'],
        greetings: ['hola'], empty: [] }, ru: { foreign: ['человек'] } },
    });
    expect(snapshot.getEvidence('gato')).toMatchObject({ familiar: true, taught: true, saved: false });
    expect(snapshot.getEvidence('buenos días').familiar).toBe(true);
    for (const word of ['hola', 'pan', 'días', 'человек']) expect(snapshot.getEvidence(word).familiar).toBe(false);
    expect(snapshot.missingLessonIds).toEqual(['vocab/empty', 'vocab/missing']);
    expect(snapshot.complete).toBe(false);
  });

  it('keeps taught evidence after a lapse, but removes mature/current-success evidence', () => {
    const input = {
      language: 'es', words: [lexicalWord('gato')],
      lessons: [completedLesson('vocab/animals')],
      lessonTargets: { es: { animals: ['gato'] } },
    };
    const before = buildKnowledgeSnapshot({ ...input,
      reviews: [currentReview({ interval: 30, repetitions: 5 })] });
    const after = buildKnowledgeSnapshot({ ...input, reviews: [currentReview()] });
    expect(before.getEvidence('gato').state).toBe('review-backed');
    expect(after.getEvidence('gato')).toMatchObject({ state: 'familiar', taught: true,
      reviewBacked: false, successfulReview: false });
    expect(after.revision).not.toBe(before.revision);
    expect(buildKnowledgeSnapshot({ language: 'es', words: input.words,
      reviews: [currentReview()] }).getEvidence('gato').familiar).toBe(false);
  });

  it('excludes letter/grammar cards and cross-language homographs, merging highest evidence', () => {
    const input = {
      language: 'ES',
      words: [lexicalWord('GATO'), lexicalWord('gato', { id: 2 }),
        lexicalWord('no', { id: 3, language: 'pt' }),
        lexicalWord('regla', { id: 4, type: 'grammar' }),
        lexicalWord('a', { id: 5, type: 'letter' })],
      reviews: [currentReview({ wordId: 2, interval: 21 }), currentReview({ wordId: 3, interval: 40 }),
        currentReview({ wordId: 4, interval: 40 }), currentReview({ wordId: 5, interval: 40 })],
    };
    const snapshot = buildKnowledgeSnapshot(input);
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.getEvidence('GATO').reviewBacked).toBe(true);
    expect(snapshot.getEvidence('no').state).toBe('unknown');
    expect(buildKnowledgeSnapshot({ ...input, words: [...input.words].reverse(),
      reviews: [...input.reviews].reverse() }).revision).toBe(snapshot.revision);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.entries[0])).toBe(true);
  });

  it('uses the latest duplicate review state instead of an obsolete mature row', () => {
    const snapshot = buildKnowledgeSnapshot({ language: 'es', words: [lexicalWord('gato')],
      reviews: [currentReview({ id: 1, interval: 25, lastReviewDate: '2026-01-01' }),
        currentReview({ id: 2, lastReviewDate: '2026-02-01' })] });
    expect(snapshot.getEvidence('gato').familiar).toBe(false);
  });
});

describe('defensible normalization', () => {
  it('normalizes Unicode/case/apostrophes, Russian stress, Arabic vocalization and tatweel', () => {
    expect(normalizeLexeme('  ＧＡＴＯ  ', 'es')).toBe('gato');
    expect(normalizeLexeme('ко́шка', 'ru')).toBe('кошка');
    expect(normalizeLexeme('ёлка', 'ru')).toBe('ёлка');
    expect(normalizeLexeme('كِـتَابٌ', 'ar')).toBe('كتاب');
    expect(normalizeLexeme('L’EAU', 'fr')).toBe("l'eau");
    expect(normalizeLexeme('cafe\u0301', 'pt')).toBe('café');
  });
  it('does not conflate meaningful letters, accents, or unsupported inflections', () => {
    for (const [a, b, language] of [['sí', 'si', 'es'], ['ёлка', 'елка', 'ru'],
      ['أب', 'اب', 'ar'], ['ș', 's', 'ro']]) {
      expect(normalizeLexeme(a, language)).not.toBe(normalizeLexeme(b, language));
    }
    const snapshot = buildKnowledgeSnapshot({ language: 'es',
      lessons: [completedLesson('vocab/cat')], lessonTargets: { es: { cat: ['gato'] } } });
    expect(snapshot.getEvidence('gatos').familiar).toBe(false);
    expect(snapshot.getEvidence('gatos', 'gato').familiar).toBe(true);
  });
  it('handles sentence punctuation and explicit complete alternatives without guessing missing nouns/suffixes', () => {
    expect(normalizeLexeme('¿Cómo estás?', 'es')).toBe('cómo estás');
    expect(lexicalForms('делать / сделать', 'ru')).toEqual(['делать / сделать', 'делать', 'сделать']);
    expect(lexicalForms('român/română', 'ro')).toEqual(['român/română', 'român', 'română']);
    expect(lexicalForms('el / la gerente', 'es')).toEqual(['el / la gerente']);
    expect(lexicalForms('jefe(a)', 'es')).toEqual(['jefe(a)']);
    const snapshot = buildKnowledgeSnapshot({ language: 'ru',
      lessons: [completedLesson('vocab/verbs', { language: 'ru' })],
      lessonTargets: { ru: { verbs: ['делать / сделать'] } } });
    expect(snapshot.getEvidence('делать').taught).toBe(true);
    expect(snapshot.getEvidence('сделать').taught).toBe(true);
  });
});
