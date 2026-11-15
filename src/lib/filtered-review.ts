import { useStudySetsStore } from '../stores/studySetsStore';
import { dueCards, getWordsForSet } from './study-sets';
import type { Word, Review } from '../db/schema';
import type { ReviewSessionKind } from '../stores/reviewStore';

/**
 * Legacy set links are due-only. Only explicit practice includes future cards.
 */
export async function getFilteredReviewQueue(
  setId: string,
  kind: ReviewSessionKind = 'scheduled',
  language?: string,
): Promise<Array<{ word: Word; review: Review }>> {
  const set = useStudySetsStore.getState().sets.find((s) => s.id === setId);
  if (!set) throw new Error('This study set no longer exists. Choose another set on Review.');
  const words = await getWordsForSet(set, language);
  return kind === 'practice' ? words : dueCards(words);
}
