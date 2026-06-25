/**
 * FSRS (Free Spaced Repetition Scheduler), FSRS-5 formulation.
 *
 * Pure, dependency-free implementation used as an optional scheduler alongside
 * SM-2. It tracks two per-card values — stability (S, days until retrievability
 * decays to the request retention) and difficulty (D, 1..10) — and produces the
 * next interval in days.
 *
 * Ratings use the FSRS 1..4 scale (Again/Hard/Good/Easy). The app grades on the
 * SM-2 0..5 scale, so `mapGradeToRating` bridges the two.
 */

export type FSRSRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface FSRSState {
  stability: number;
  difficulty: number;
}

/** Default FSRS-5 weights (w0..w18) from the reference parameters. */
export const DEFAULT_W: readonly number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
  1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567,
];

export const DEFAULT_RETENTION = 0.9;
const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // 19/81

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

/** Retrievability after `elapsedDays` given stability. R in (0, 1]. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

/** Days until retrievability decays to the requested retention. */
export function intervalFromStability(
  stability: number,
  requestRetention = DEFAULT_RETENTION
): number {
  const ivl = (stability / FACTOR) * (Math.pow(requestRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.round(ivl));
}

/** Initial difficulty for a brand-new card given its first rating. */
function initDifficulty(rating: FSRSRating, w: readonly number[]): number {
  return clampDifficulty(w[4] - Math.exp(w[5] * (rating - 1)) + 1);
}

/** Initial stability for a brand-new card given its first rating. */
function initStability(rating: FSRSRating, w: readonly number[]): number {
  return Math.max(0.1, w[rating - 1]);
}

/** Build the initial FSRS state for a card's very first review. */
export function initCard(rating: FSRSRating, w: readonly number[] = DEFAULT_W): FSRSState {
  return {
    stability: initStability(rating, w),
    difficulty: initDifficulty(rating, w),
  };
}

function nextDifficulty(
  difficulty: number,
  rating: FSRSRating,
  w: readonly number[]
): number {
  const deltaD = -w[6] * (rating - 3);
  const dampened = difficulty + deltaD * ((10 - difficulty) / 9);
  // Mean reversion toward the "Good"-anchored difficulty.
  const target = initDifficulty(4, w);
  return clampDifficulty(w[7] * target + (1 - w[7]) * dampened);
}

function nextStabilityOnRecall(
  state: FSRSState,
  rating: FSRSRating,
  r: number,
  w: readonly number[]
): number {
  const { stability, difficulty } = state;
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  const inc =
    Math.exp(w[8]) *
    (11 - difficulty) *
    Math.pow(stability, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;
  return stability * (1 + inc);
}

function nextStabilityOnForget(
  state: FSRSState,
  r: number,
  w: readonly number[]
): number {
  const { stability, difficulty } = state;
  const sMin =
    w[11] *
    Math.pow(difficulty, -w[12]) *
    (Math.pow(stability + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r));
  // Post-lapse stability never exceeds prior stability.
  return Math.min(stability, Math.max(0.1, sMin));
}

export interface FSRSResult extends FSRSState {
  intervalDays: number;
}

/**
 * Advance a card's FSRS state.
 *
 * @param prev          existing state, or null for a card's first FSRS review
 * @param rating        FSRS 1..4
 * @param elapsedDays   days since the card was last reviewed (0 for new cards)
 * @param requestRetention desired retention (default 0.9)
 * @param w             weights (default FSRS-5)
 */
export function fsrs(
  prev: FSRSState | null,
  rating: FSRSRating,
  elapsedDays: number,
  requestRetention = DEFAULT_RETENTION,
  w: readonly number[] = DEFAULT_W
): FSRSResult {
  if (!prev || prev.stability <= 0) {
    const init = initCard(rating, w);
    return { ...init, intervalDays: intervalFromStability(init.stability, requestRetention) };
  }

  const r = retrievability(Math.max(0, elapsedDays), prev.stability);
  const difficulty = nextDifficulty(prev.difficulty, rating, w);
  const stability =
    rating === 1
      ? nextStabilityOnForget(prev, r, w)
      : nextStabilityOnRecall(prev, rating, r, w);

  return {
    stability,
    difficulty,
    intervalDays: intervalFromStability(stability, requestRetention),
  };
}

/**
 * Map the app's SM-2 grade (0..5) to an FSRS rating (1..4).
 * The review UI emits {0,3,4,5}; auto-graded cards may emit others.
 */
export function mapGradeToRating(grade: number): FSRSRating {
  if (grade <= 2) return 1; // Again
  if (grade === 3) return 2; // Hard
  if (grade === 4) return 3; // Good
  return 4; // Easy (5)
}
