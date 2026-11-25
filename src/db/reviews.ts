import { db, type Review, type Word } from './schema';
import { sm2, type SM2Grade } from '../lib/sm2';
import { fsrs, mapGradeToRating, type FSRSState } from '../lib/fsrs';
import { isRuleRecallCard } from '../lib/grammar-review-scope';

/**
 * After a successful recall, rule-recall cards wait this many times longer than
 * the scheduler's interval. A design choice, not a study-backed number: knowing a
 * rule is only weakly linked to using it, so rule recall gets less review time
 * than practice. LessonCaptureModal describes it as "about half as often".
 */
export const RULE_CARD_INTERVAL_MULTIPLIER = 2;

function daysUntilNextReview(intervalDays: number, grade: SM2Grade, word: Word | undefined): number {
  // Failures relearn at normal speed.
  if (grade < 3 || !word || !isRuleRecallCard(word)) return intervalDays;
  return Math.round(intervalDays * RULE_CARD_INTERVAL_MULTIPLIER);
}

/** Days between the last review and the next one, as actually scheduled. */
export function scheduledGapDays(review: Review): number {
  // Reset or never-graded cards keep an old/creation lastReviewDate; trust interval there.
  if (review.interval <= 0 || !review.lastReviewDate) return review.interval;
  const gap = Math.round((Date.parse(review.nextReviewDate) - Date.parse(review.lastReviewDate)) / 86_400_000);
  return Number.isFinite(gap) ? Math.max(0, gap) : review.interval;
}

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
  const word = await db.words.get(review.wordId);

  const now = new Date();
  // Rule-card stretching touches only nextReviewDate. `interval` (and FSRS
  // stability/difficulty) stay the scheduler's own values: SM-2 multiplies the
  // stored interval and FSRS warm-starts from it, so storing the stretched gap
  // would compound every pass. FSRS reads real elapsed days, so it accounts for the later review.
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
    nextDate.setDate(nextDate.getDate() + daysUntilNextReview(result.intervalDays, grade, word));

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
    nextDate.setDate(nextDate.getDate() + daysUntilNextReview(result.interval, grade, word));

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
