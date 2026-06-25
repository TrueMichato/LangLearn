import { db, type Review } from './schema';
import { sm2, type SM2Grade } from '../lib/sm2';
import { fsrs, mapGradeToRating, type FSRSState } from '../lib/fsrs';

export interface ProcessReviewOptions {
  scheduler?: 'sm2' | 'fsrs';
  requestRetention?: number;
}

/**
 * Bridge SM-2 ease (~1.3 hard .. ~3.0 easy) to an FSRS difficulty (10..1) so a
 * card switched into FSRS mid-collection keeps a sensible difficulty.
 */
function difficultyFromEase(ease: number): number {
  const d = 11 - ((ease - 1.3) / (3.0 - 1.3)) * 9;
  return Math.min(10, Math.max(1, d));
}

export async function processReview(
  reviewId: number,
  grade: SM2Grade,
  opts: ProcessReviewOptions = {}
): Promise<Review> {
  const review = await db.reviews.get(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);

  const now = new Date();
  let updated: Review;

  if (opts.scheduler === 'fsrs') {
    const elapsedDays = review.lastReviewDate
      ? Math.max(
          0,
          (now.getTime() - new Date(review.lastReviewDate).getTime()) / 86_400_000
        )
      : 0;

    let prev: FSRSState | null = null;
    if (review.stability != null) {
      prev = {
        stability: review.stability,
        difficulty: review.difficulty ?? difficultyFromEase(review.ease),
      };
    } else if (review.repetitions > 0) {
      // Warm-start from SM-2 history so switching schedulers doesn't reset the card.
      prev = {
        stability: Math.max(0.1, review.interval || 1),
        difficulty: difficultyFromEase(review.ease),
      };
    }

    const result = fsrs(prev, mapGradeToRating(grade), elapsedDays, opts.requestRetention);
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + result.intervalDays);

    updated = {
      ...review,
      interval: result.intervalDays,
      // Keep repetitions advancing so card-type unlocks still work; reset on lapse.
      repetitions: grade < 3 ? 0 : review.repetitions + 1,
      stability: result.stability,
      difficulty: result.difficulty,
      nextReviewDate: nextDate.toISOString(),
      lastReviewDate: now.toISOString(),
    };
  } else {
    const result = sm2(
      { ease: review.ease, interval: review.interval, repetitions: review.repetitions },
      grade
    );

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + result.interval);

    updated = {
      ...review,
      ease: result.ease,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewDate: nextDate.toISOString(),
      lastReviewDate: now.toISOString(),
    };
  }

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
