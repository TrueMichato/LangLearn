import type { Word, Review } from '../db/schema';

export interface DueItem {
  word: Word;
  review: Review;
}

/**
 * Weakness weight for a review: weaker cards (low ease, never repeated) weigh
 * more so they're more likely to be drawn into a limited review batch.
 * Always positive.
 */
export function weaknessWeight(review: Pick<Review, 'ease' | 'repetitions'>): number {
  const ease = Math.min(3.0, Math.max(1.3, review.ease));
  const base = 2.8 - ease; // 0 (strong) .. 1.5 (weak)
  const newcomerBoost = review.repetitions === 0 ? 0.5 : 0;
  return Math.max(0.1, base + newcomerBoost);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Compose a review batch weighted toward weaker cards, then shuffle the
 * selection for presentation. Due cards remain the only source — this only
 * influences which subset is seen when the batch is smaller than the due pool.
 *
 * Uses Efraimidis–Spirakis weighted sampling without replacement
 * (key = rng^(1/weight); highest keys win), keeping it stochastic and testable.
 */
export function composeAdaptiveBatch<T extends DueItem>(
  due: T[],
  batchSize: number,
  rng: () => number = Math.random
): T[] {
  if (batchSize <= 0 || due.length <= batchSize) {
    return shuffle(due, rng);
  }

  const keyed = due.map((item) => {
    const w = weaknessWeight(item.review);
    const u = Math.max(1e-9, rng());
    return { item, key: Math.pow(u, 1 / w) };
  });

  keyed.sort((a, b) => b.key - a.key);
  const selected = keyed.slice(0, batchSize).map((k) => k.item);
  return shuffle(selected, rng);
}
