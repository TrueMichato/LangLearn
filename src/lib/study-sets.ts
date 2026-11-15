import { db, type Word, type Review } from '../db/schema';
import { getDueReviews } from '../db/words';
import type { StudySet } from '../stores/studySetsStore';

export interface SavedCard {
  word: Word;
  review: Review;
}

async function withReviews(words: Word[]): Promise<SavedCard[]> {
  if (!words.length) return [];
  const reviews = await db.reviews.where('wordId').anyOf(words.map((w) => w.id!)).toArray();
  const byWord = new Map(reviews.map((review) => [review.wordId, review]));
  return words.flatMap((word) => {
    const review = byWord.get(word.id!);
    return review ? [{ word, review }] : [];
  });
}

/** Unlike the vocabulary browser, Review also includes grammar and letter cards. */
export async function getSavedCards(language?: string): Promise<SavedCard[]> {
  const words = language
    ? await db.words.where('language').equals(language).toArray()
    : await db.words.toArray();
  return withReviews(words);
}

/** Scope is intersected with a set's own language before ranking or limiting. */
export async function getWordsForSet(set: StudySet, scopeLanguage?: string): Promise<SavedCard[]> {
  if (set.language && scopeLanguage && set.language !== scopeLanguage) return [];
  const language = set.language || scopeLanguage;

  if (set.type === 'custom') {
    let words: Word[];
    if (set.selectionMode === 'manual') {
      const ids = [...new Set((set.wordIds ?? []).filter((id) => Number.isSafeInteger(id) && id > 0))];
      words = (await db.words.bulkGet(ids)).filter((word): word is Word => !!word);
    } else {
      // Legacy custom sets are tag rules, with ALL selected tags required.
      if (!set.tags.length) return [];
      words = await db.words.where('tags').equals(set.tags[0]).toArray();
      words = words.filter((word) => set.tags.every((tag) => word.tags.includes(tag)));
    }
    return withReviews(words.filter((word) => !language || word.language === language));
  }

  switch (set.smartFilter) {
    case 'due-today':
      // Intrinsically due-only, even for an optional practice attempt.
      return getDueReviews(language);
    case 'weakest': {
      const cards = await getSavedCards(language);
      return cards.sort((a, b) => a.review.ease - b.review.ease).slice(0, 20);
    }
    case 'from-grammar':
    case 'from-letters': {
      const tag = set.smartFilter === 'from-grammar' ? 'grammar' : 'letter';
      const words = await db.words.where('tags').equals(tag).toArray();
      return withReviews(words.filter((word) => !language || word.language === language));
    }
    case 'recent': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const words = await db.words.where('createdAt').above(sevenDaysAgo).toArray();
      return withReviews(words.filter((word) => !language || word.language === language));
    }
    default:
      return [];
  }
}

export function dueCards(cards: SavedCard[]): SavedCard[] {
  const now = new Date().toISOString();
  return cards.filter(({ review }) => review.nextReviewDate <= now);
}

/** Get all unique tags from the user's saved cards. */
export async function getAllTags(): Promise<string[]> {
  const words = await db.words.toArray();
  return [...new Set(words.flatMap((word) => word.tags))].sort();
}
