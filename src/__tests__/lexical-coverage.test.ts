import { describe, expect, it } from 'vitest';
import { buildKnowledgeSnapshot } from '../lib/knowledge';
import { analyzeLexicalCoverage } from '../lib/lexical-coverage';
import { segmentSurfaceText } from '../lib/lexical';
import { japaneseLexicalDocument } from '../lib/lexical-tokenizer';
import type { Token } from '../lib/tokenizer';
import type { Word, Review, LessonProgress } from '../db/schema';

function knowledge() {
  const words: Word[] = [{ id: 1, word: 'gato', language: 'es', type: 'word', reading: '',
    meaning: '', contextSentence: '', tags: [], sourceTextId: null, createdAt: '' }];
  const reviews: Review[] = [{ wordId: 1, interval: 21, repetitions: 4, ease: 2.5,
    lastReviewDate: '', nextReviewDate: '' }];
  const lessons: LessonProgress[] = [{ id: 'es/vocab/food', language: 'es', lessonId: 'vocab/food',
    completed: true, attempts: 1, quizScore: 90, completedAt: '' }];
  return buildKnowledgeSnapshot({ language: 'es', words, reviews, lessons,
    lessonTargets: { es: { food: ['pan'] } } });
}

describe('full-text lexical coverage', () => {
  it('counts occurrence and distinct denominators separately, with the mature subset included once', () => {
    const coverage = analyzeLexicalCoverage(segmentSurfaceText(
      'gato gato gato gato gato pan pan pan pez ave', 'es'), knowledge());
    expect(coverage.occurrences).toMatchObject({
      total: 10, familiar: 8, reviewBacked: 5, familiarPercentage: 80, reviewBackedPercentage: 50,
    });
    expect(coverage.distinct).toMatchObject({
      total: 4, familiar: 2, reviewBacked: 1, familiarPercentage: 50, reviewBackedPercentage: 25,
    });
    const other = analyzeLexicalCoverage(segmentSurfaceText('gato pan pez ave', 'es'), knowledge());
    expect(other.distinct).toEqual(coverage.distinct);
    expect(other.occurrences.familiarPercentage).toBe(50);
  });

  it('uses all content rather than truncating to an excerpt', () => {
    const coverage = analyzeLexicalCoverage(segmentSurfaceText(
      `${'gato '.repeat(1000)}pez`, 'es'), knowledge());
    expect(coverage.occurrences.total).toBe(1001);
    expect(coverage.occurrences.unknown).toBe(1);
  });

  it('does not return failure-shaped or false-perfect percentages for empty input', () => {
    const coverage = analyzeLexicalCoverage(segmentSurfaceText('123 … !', 'es'), knowledge());
    expect(coverage.status).toBe('empty');
    expect(coverage.occurrences.familiarPercentage).toBeNull();
    expect(coverage.distinct.reviewBackedPercentage).toBeNull();
    expect(() => analyzeLexicalCoverage(segmentSurfaceText('gato', 'pt'), knowledge())).toThrow(/languages/);
  });

  it('supports all script letters, not just Latin/Cyrillic, while disclosing surface limits', () => {
    const snapshot = buildKnowledgeSnapshot({ language: 'ar', lessonTargets: { ar: { book: ['كتاب'] } },
      lessons: [{ id: 'ar/vocab/book', lessonId: 'vocab/book', language: 'ar', completed: true,
        attempts: 1, quizScore: 90, completedAt: '' }] });
    const coverage = analyzeLexicalCoverage(segmentSurfaceText('كِتَابٌ كتاب جديد ١٢', 'ar'), snapshot);
    expect(coverage.occurrences).toMatchObject({ total: 3, familiar: 2 });
    expect(coverage.distinct.total).toBe(2);
    expect(coverage.mode).toBe('surface');
    expect(coverage.limitations.join()).toContain('inflections');
  });

  it('recognizes complete authored phrases only in context, never unrelated component words', () => {
    const snapshot = buildKnowledgeSnapshot({ language: 'es',
      lessons: [{ id: 'es/vocab/hello', language: 'es', lessonId: 'vocab/hello',
        completed: true, attempts: 1, quizScore: 90, completedAt: '' }],
      lessonTargets: { es: { hello: ['buenos días'] } } });
    const coverage = analyzeLexicalCoverage(segmentSurfaceText('buenos días días', 'es'), snapshot);
    expect(coverage.occurrences).toMatchObject({ total: 3, familiar: 2 });
    expect(coverage.distinct).toMatchObject({ total: 2, familiar: 1 });
    expect(analyzeLexicalCoverage(segmentSurfaceText('buenos. días', 'es'), snapshot)
      .occurrences.familiar).toBe(0);
    expect(snapshot.getEvidence('días').familiar).toBe(false);
  });

  it('reuses Japanese dictionary lemmas, keeps unknown names, excludes punctuation/numbers', () => {
    const token = (surface: string, other: Partial<Token> = {}): Token =>
      ({ surface, reading: '', isKanji: false, ...other });
    const document = japaneseLexicalDocument([
      token('食べました', { lemma: '食べる', partOfSpeech: '動詞' }),
      token('、', { partOfSpeech: '記号' }), token('田中', { wordType: 'UNKNOWN' }),
      token('一', { partOfSpeechDetail: '数' }), token(' '),
    ]);
    const snapshot = buildKnowledgeSnapshot({ language: 'ja',
      words: [{ id: 1, word: '食べる', language: 'ja', type: 'word', reading: '',
        meaning: '', contextSentence: '', tags: [], sourceTextId: null, createdAt: '' }],
      reviews: [{ wordId: 1, interval: 1, repetitions: 1, ease: 2.5,
        lastReviewDate: '', nextReviewDate: '' }] });
    const coverage = analyzeLexicalCoverage(document, snapshot);
    expect(coverage.mode).toBe('japanese-lemmas');
    expect(coverage.occurrences).toMatchObject({ total: 2, familiar: 1, reviewBacked: 0 });
    expect(coverage.unknownWords).toEqual(['田中']);
  });

  it('makes unresolved completed content explicit without erasing other evidence', () => {
    const snapshot = buildKnowledgeSnapshot({ language: 'es',
      lessons: [{ id: 'es/vocab/missing', language: 'es', lessonId: 'vocab/missing',
        completed: true, attempts: 1, quizScore: 90, completedAt: '' }] });
    const coverage = analyzeLexicalCoverage(segmentSurfaceText('gato', 'es'), snapshot);
    expect(coverage.complete).toBe(false);
    expect(coverage.limitations.join()).toContain('vocab/missing');
  });

  it('discloses unverified segmentation and normalizes compatibility forms before fallback splitting', () => {
    expect(segmentSurfaceText('中文段落', 'zh').limitations.join()).toContain('not verified');
    expect(segmentSurfaceText('ｶﾞﾗｽ', 'ja').tokens).toEqual([
      { surface: 'ガラス', boundaryBefore: false },
    ]);
  });
});
