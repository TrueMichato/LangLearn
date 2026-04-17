import { db, type Word, type Review } from '../db/schema';
import { getDueReviews } from '../db/words';
import type { StudySet } from '../stores/studySetsStore';

export async function getWordsForSet(
  set: StudySet
): Promise<Array<{ word: Word; review: Review }>> {
  if (set.type === 'smart') {
    return getSmartSetWords(set);
  }
  return getCustomSetWords(set);
}

async function getCustomSetWords(
  set: StudySet
): Promise<Array<{ word: Word; review: Review }>> {
  if (set.tags.length === 0) return [];

  // Start with the first tag using the multi-entry index, then AND with the rest
  let words = await db.words.where('tags').equals(set.tags[0]).toArray();

  for (let i = 1; i < set.tags.length; i++) {
    const tag = set.tags[i];
    words = words.filter((w) => w.tags.includes(tag));
  }

  if (set.language) {
    words = words.filter((w) => w.language === set.language);
  }

  const results: Array<{ word: Word; review: Review }> = [];
  for (const word of words) {
    const review = await db.reviews.where('wordId').equals(word.id!).first();
    if (review) results.push({ word, review });
  }
  return results;
}

async function getSmartSetWords(
  set: StudySet
): Promise<Array<{ word: Word; review: Review }>> {
  switch (set.smartFilter) {
    case 'due-today':
      return getDueReviews(set.language);

    case 'weakest': {
      const allReviews = await db.reviews.toArray();
      allReviews.sort((a, b) => a.ease - b.ease);
      const bottom = allReviews.slice(0, 20);
      const results: Array<{ word: Word; review: Review }> = [];
      for (const review of bottom) {
        const word = await db.words.get(review.wordId);
        if (word && (!set.language || word.language === set.language)) {
          results.push({ word, review });
        }
      }
      return results;
    }

    case 'from-grammar': {
      let words = await db.words.where('tags').equals('grammar').toArray();
      if (set.language) words = words.filter((w) => w.language === set.language);
      const results: Array<{ word: Word; review: Review }> = [];
      for (const word of words) {
        const review = await db.reviews.where('wordId').equals(word.id!).first();
        if (review) results.push({ word, review });
      }
      return results;
    }

    case 'from-letters': {
      let words = await db.words.where('tags').equals('letter').toArray();
      if (set.language) words = words.filter((w) => w.language === set.language);
      const results: Array<{ word: Word; review: Review }> = [];
      for (const word of words) {
        const review = await db.reviews.where('wordId').equals(word.id!).first();
        if (review) results.push({ word, review });
      }
      return results;
    }

    case 'recent': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let words = await db.words
        .where('createdAt')
        .above(sevenDaysAgo)
        .toArray();
      if (set.language) words = words.filter((w) => w.language === set.language);
      const results: Array<{ word: Word; review: Review }> = [];
      for (const word of words) {
        const review = await db.reviews.where('wordId').equals(word.id!).first();
        if (review) results.push({ word, review });
      }
      return results;
    }

    default:
      return [];
  }
}

/** Get all unique tags from the user's word collection. */
export async function getAllTags(): Promise<string[]> {
  const words = await db.words.toArray();
  const tagSet = new Set<string>();
  for (const w of words) {
    for (const t of w.tags) tagSet.add(t);
  }
  return Array.from(tagSet).sort();
}
