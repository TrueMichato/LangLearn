import { getDueReviews, getRandomWords } from '../db/words';
import { composeAdaptiveBatch } from './adaptive';
import { findClozeSpan } from './cloze-match';
import { assignCardType, selectDistractors, shuffle } from './card-types';
import { getFilteredReviewQueue } from './filtered-review';
import { getTopicDeck } from './grammar-topics';
import { getLeechWordIds, getMistakeDeck } from './mistakes';
import { getSavedCards } from './study-sets';
import { getLanguageLabel } from './languages';
import type { PracticeMode, QueueItem, ReviewSessionKind } from '../stores/reviewStore';

export type ReviewSource =
  | { type: 'library'; language?: string }
  | { type: 'set'; setId: string; language?: string }
  | { type: 'mistakes'; language?: string; languages?: string[] }
  | { type: 'topic'; topicId: string; language?: string };

export interface ReviewAttempt {
  kind: ReviewSessionKind;
  source: ReviewSource;
  label: string;
}

export async function getReviewCandidates(kind: ReviewSessionKind, source: ReviewSource) {
  switch (source.type) {
    case 'set':
      return getFilteredReviewQueue(source.setId, kind, source.language);
    // Legacy curated links deliberately include future cards and update their
    // schedules. Only an explicit practice attempt changes that contract.
    case 'mistakes':
      return getMistakeDeck(source.language ? [source.language] : source.languages);
    case 'topic':
      return getTopicDeck(source.topicId, source.language);
    case 'library':
      return kind === 'practice' ? getSavedCards(source.language) : getDueReviews(source.language);
  }
}

export function reviewScopeLabel(source: ReviewSource): string {
  if (source.language) return getLanguageLabel(source.language);
  if (source.type === 'mistakes' && source.languages?.length) {
    return source.languages.map(getLanguageLabel).join(' · ');
  }
  return 'All saved languages';
}

function directionType(mode: PracticeMode | null, base: QueueItem['cardType']): QueueItem['cardType'] {
  switch (mode) {
    case 'word-to-meaning': return 'classic';
    case 'meaning-to-word': return 'reverse';
    case 'both': return 'study';
    case 'random': return Math.random() < 0.5 ? 'classic' : 'reverse';
    default: return base;
  }
}

/** Reconfigure presentation without rerolling membership, order or progress. */
export async function prepareReviewCards(
  cards: Awaited<ReturnType<typeof getReviewCandidates>>,
  mode: PracticeMode | null,
): Promise<QueueItem[]> {
  const languages = [...new Set(cards.map(({ word }) => word.language))];
  const leeches = cards.length ? await getLeechWordIds(languages) : new Set<number>();
  return Promise.all(cards.map(async (item) => {
    let cardType = directionType(mode, assignCardType(item.review.repetitions, item.word.type));
    if (item.word.type === 'grammar') {
      cardType = 'grammar';
    } else if (leeches.has(item.word.id!) && (cardType === 'classic' || cardType === 'reverse')) {
      cardType = 'multiple-choice';
    }
    // Never show a cloze unless the saved form can actually be blanked.
    if (cardType === 'cloze'
      && (!item.word.contextSentence || !findClozeSpan(item.word.contextSentence, item.word.word, item.word.language))) {
      cardType = 'classic';
    }
    let distractors: string[] | undefined;
    if (cardType === 'multiple-choice') {
      const others = await getRandomWords(item.word.language, [item.word.id!], 6);
      distractors = selectDistractors(item.word.meaning, others);
      if (distractors.length < 3) {
        cardType = 'classic';
        distractors = undefined;
      }
    }
    return { ...item, cardType, distractors };
  }));
}

export async function buildReviewSession(
  attempt: ReviewAttempt,
  options: { batchSize: number; adaptive: boolean; direction: PracticeMode | null },
) {
  const candidates = await getReviewCandidates(attempt.kind, attempt.source);
  const batch = options.adaptive && attempt.kind === 'scheduled' && attempt.source.type === 'library'
    ? composeAdaptiveBatch(candidates, options.batchSize)
    : shuffle(candidates).slice(0, options.batchSize > 0 ? options.batchSize : undefined);
  return {
    items: await prepareReviewCards(batch, options.direction),
    totalEligible: candidates.length,
  };
}
