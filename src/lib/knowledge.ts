import type { LessonProgress, Review, Word } from '../db/schema';
import { isLexical, lexicalForms, normalizeLanguage, normalizeLexeme } from './lexical';

export const MATURE_REVIEW_INTERVAL = 21;
export type KnowledgeState = 'unknown' | 'saved' | 'learning' | 'familiar' | 'review-backed';

export interface KnowledgeEvidence {
  readonly key: string;
  readonly state: KnowledgeState;
  readonly familiar: boolean;
  /** A subset of familiar, not an additional count. */
  readonly reviewBacked: boolean;
  readonly taught: boolean;
  readonly successfulReview: boolean;
  readonly saved: boolean;
  readonly learning: boolean;
  readonly lessonIds: readonly string[];
}

export type LessonTargetIndex = Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;

export interface KnowledgeSnapshot {
  readonly language: string;
  /** Deterministic evidence identity; suitable for analysis caches and attempt records. */
  readonly revision: string;
  readonly entries: readonly KnowledgeEvidence[];
  readonly completedLessonIds: readonly string[];
  readonly missingLessonIds: readonly string[];
  readonly complete: boolean;
  readonly familiarCount: number;
  readonly reviewBackedCount: number;
  getEvidence(word: string, lemma?: string): KnowledgeEvidence;
}

const STATE_RANK: Record<KnowledgeState, number> = {
  unknown: 0, saved: 1, learning: 2, familiar: 3, 'review-backed': 4,
};

export function strongerEvidence(a: KnowledgeEvidence, b: KnowledgeEvidence): KnowledgeEvidence {
  return STATE_RANK[a.state] >= STATE_RANK[b.state] ? a : b;
}

/** Not a security hash; stable across input order and browser sessions. */
export function evidenceHash(value: string): string {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) {
    result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  }
  result ^= result >>> 16;
  result = Math.imul(result, 0x85ebca6b);
  result ^= result >>> 13;
  result = Math.imul(result, 0xc2b2ae35);
  result ^= result >>> 16;
  return (result >>> 0).toString(36);
}

export interface KnowledgeInput {
  language: string;
  words?: readonly Word[];
  reviews?: readonly Review[];
  lessons?: readonly LessonProgress[];
  lessonTargets?: LessonTargetIndex;
}

export function buildKnowledgeSnapshot({
  language, words = [], reviews = [], lessons = [], lessonTargets = {},
}: KnowledgeInput): KnowledgeSnapshot {
  const lang = normalizeLanguage(language);
  type MutableEvidence = {
    key: string; taught: boolean; successfulReview: boolean; saved: boolean;
    learning: boolean; reviewBacked: boolean; lessonIds: Set<string>;
  };
  const records = new Map<string, MutableEvidence>();
  const recordFor = (word: string) => {
    const key = normalizeLexeme(word, lang);
    if (!isLexical(key)) return undefined;
    let record = records.get(key);
    if (!record) {
      record = { key, taught: false, successfulReview: false, saved: false,
        learning: false, reviewBacked: false, lessonIds: new Set() };
      records.set(key, record);
    }
    return record;
  };
  // In malformed/legacy data with multiple reviews, use the latest current state
  // for a card, not an obsolete mature record preceding a lapse.
  const reviewByWord = new Map<number, Review>();
  for (const review of reviews) {
    const previous = reviewByWord.get(review.wordId);
    if (!previous || review.lastReviewDate > previous.lastReviewDate ||
      (review.lastReviewDate === previous.lastReviewDate && (review.id ?? 0) > (previous.id ?? 0))) {
      reviewByWord.set(review.wordId, review);
    }
  }
  for (const word of words) {
    if (normalizeLanguage(word.language) !== lang || (word.type && word.type !== 'word')) continue;
    const review = word.id === undefined ? undefined : reviewByWord.get(word.id);
    for (const form of lexicalForms(word.word, lang)) {
      const record = recordFor(form);
      if (!record) continue;
      record.saved = true;
      if (!review) continue;
      const mature = review.interval >= MATURE_REVIEW_INTERVAL;
      record.learning = true;
      record.reviewBacked ||= mature;
      // Positive repetitions are current successful grading evidence for both
      // schedulers. Initial cards and lapses both have zero.
      record.successfulReview ||= review.repetitions > 0 || mature;
    }
  }
  const completed = lessons.filter((lesson) =>
    normalizeLanguage(lesson.language) === lang && lesson.completed);
  const completedLessonIds = [...new Set(completed.map((lesson) => lesson.lessonId))].sort();
  const missingLessonIds: string[] = [];
  for (const id of completedLessonIds) {
    if (!id.startsWith('vocab/')) continue;
    const targets = lessonTargets[lang]?.[id.slice('vocab/'.length)];
    if (!targets?.length) {
      missingLessonIds.push(id);
      continue;
    }
    for (const target of targets) {
      for (const form of lexicalForms(target, lang)) {
        const record = recordFor(form);
        if (!record) continue;
        record.taught = true;
        record.lessonIds.add(id);
      }
    }
  }
  const entries = Object.freeze([...records.values()].sort((a, b) => a.key.localeCompare(b.key))
    .map((record): KnowledgeEvidence => {
      const familiar = record.taught || record.successfulReview;
      return Object.freeze({
        ...record, familiar,
        state: record.reviewBacked ? 'review-backed' : familiar ? 'familiar'
          : record.learning ? 'learning' : 'saved',
        lessonIds: Object.freeze([...record.lessonIds].sort()),
      });
    }));
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const unknown = (key: string): KnowledgeEvidence => Object.freeze({
    key, state: 'unknown', familiar: false, reviewBacked: false, taught: false,
    successfulReview: false, saved: false, learning: false, lessonIds: Object.freeze([]),
  });
  return Object.freeze({
    language: lang,
    revision: evidenceHash(JSON.stringify([lang, entries, completedLessonIds, missingLessonIds])),
    entries, completedLessonIds: Object.freeze(completedLessonIds),
    missingLessonIds: Object.freeze(missingLessonIds), complete: missingLessonIds.length === 0,
    familiarCount: entries.filter((entry) => entry.familiar).length,
    reviewBackedCount: entries.filter((entry) => entry.reviewBacked).length,
    getEvidence(word: string, lemma?: string) {
      const key = normalizeLexeme(word, lang);
      const surfaceEvidence = byKey.get(key) ?? unknown(key);
      return lemma ? strongerEvidence(surfaceEvidence,
        byKey.get(normalizeLexeme(lemma, lang)) ?? unknown(key)) : surfaceEvidence;
    },
  });
}
