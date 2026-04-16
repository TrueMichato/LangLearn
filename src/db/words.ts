import { db, type Word, type Review } from './schema';

export async function addWord(
  word: Omit<Word, 'id' | 'createdAt'>
): Promise<number> {
  const id = await db.words.add({
    ...word,
    createdAt: new Date().toISOString(),
  }) as number;

  await db.reviews.add({
    wordId: id,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewDate: new Date().toISOString(),
  });

  return id;
}

export async function getWordsByLanguage(language: string): Promise<Word[]> {
  return db.words.where('language').equals(language).toArray();
}

export async function getWordWithReview(
  wordId: number
): Promise<{ word: Word; review: Review } | undefined> {
  const word = await db.words.get(wordId);
  if (!word) return undefined;
  const review = await db.reviews.where('wordId').equals(wordId).first();
  if (!review) return undefined;
  return { word, review };
}

export async function getDueReviews(language?: string): Promise<
  Array<{ word: Word; review: Review }>
> {
  const now = new Date().toISOString();
  const reviews = await db.reviews
    .where('nextReviewDate')
    .belowOrEqual(now)
    .toArray();

  const results: Array<{ word: Word; review: Review }> = [];
  for (const review of reviews) {
    const word = await db.words.get(review.wordId);
    if (word && (!language || word.language === language)) {
      results.push({ word, review });
    }
  }
  return results;
}

export async function deleteWord(wordId: number): Promise<void> {
  await db.reviews.where('wordId').equals(wordId).delete();
  await db.words.delete(wordId);
}

export async function getTotalWordCount(language?: string): Promise<number> {
  if (language) {
    return db.words.where('language').equals(language).count();
  }
  return db.words.count();
}

export async function wordExists(word: string, language: string): Promise<boolean> {
  const match = await db.words.where({ word, language }).first();
  return !!match;
}
