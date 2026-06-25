import { db, type Review } from './schema';
import { sm2, type SM2Grade } from '../lib/sm2';

export async function processReview(
  reviewId: number,
  grade: SM2Grade
): Promise<Review> {
  const review = await db.reviews.get(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  const result = sm2(
    { ease: review.ease, interval: review.interval, repetitions: review.repetitions },
    grade
  );

  const now = new Date();
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + result.interval);

  const updated: Review = {
    ...review,
    ease: result.ease,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewDate: nextDate.toISOString(),
    lastReviewDate: now.toISOString(),
  };

  await db.reviews.put(updated);

  const word = await db.words.get(review.wordId);
  await db.reviewLog.add({
    reviewId,
    wordId: review.wordId,
    language: word?.language ?? '',
    grade,
    isLapse: grade < 3,
    date: now.toISOString(),
  });

  return updated;
}

export async function getDueCount(language?: string): Promise<number> {
  const now = new Date().toISOString();
  const reviews = await db.reviews
    .where('nextReviewDate')
    .belowOrEqual(now)
    .toArray();

  if (!language) return reviews.length;

  let count = 0;
  for (const r of reviews) {
    const word = await db.words.get(r.wordId);
    if (word?.language === language) count++;
  }
  return count;
}
