import { useStudySetsStore } from '../stores/studySetsStore';
import { getWordsForSet } from './study-sets';
import type { Word, Review } from '../db/schema';

/**
 * Get a review queue filtered to words from a specific study set
 * that are also currently due for review.
 */
export async function getFilteredReviewQueue(
  setId: string
): Promise<Array<{ word: Word; review: Review }>> {
  const set = useStudySetsStore.getState().sets.find((s) => s.id === setId);
  if (!set) return [];

  // For "due-today" smart sets, all returned words are already due
  if (set.type === 'smart' && set.smartFilter === 'due-today') {
    return getWordsForSet(set);
  }

  const words = await getWordsForSet(set);
  const now = new Date().toISOString();
  return words.filter((item) => item.review.nextReviewDate <= now);
}
