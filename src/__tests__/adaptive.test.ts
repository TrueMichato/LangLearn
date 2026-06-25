import { describe, it, expect } from 'vitest';
import { composeAdaptiveBatch, weaknessWeight, type DueItem } from '../lib/adaptive';
import type { Word, Review } from '../db/schema';

function item(id: number, ease: number, repetitions = 3): DueItem {
  const word = {
    id,
    language: 'ja',
    word: `w${id}`,
    reading: '',
    meaning: `m${id}`,
    contextSentence: '',
    sourceTextId: null,
    tags: [],
    type: 'word',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as Word;
  const review = {
    id,
    wordId: id,
    ease,
    interval: 1,
    repetitions,
    nextReviewDate: '2026-01-01',
  } as Review;
  return { word, review };
}

describe('weaknessWeight', () => {
  it('weighs low-ease cards more than high-ease cards', () => {
    expect(weaknessWeight({ ease: 1.3, repetitions: 3 })).toBeGreaterThan(
      weaknessWeight({ ease: 2.8, repetitions: 3 })
    );
  });

  it('boosts never-repeated cards', () => {
    expect(weaknessWeight({ ease: 2.5, repetitions: 0 })).toBeGreaterThan(
      weaknessWeight({ ease: 2.5, repetitions: 3 })
    );
  });

  it('is always positive', () => {
    expect(weaknessWeight({ ease: 5, repetitions: 9 })).toBeGreaterThan(0);
  });
});

describe('composeAdaptiveBatch', () => {
  it('returns all items (shuffled) when batch >= pool', () => {
    const due = [item(1, 2.5), item(2, 2.5)];
    const out = composeAdaptiveBatch(due, 5, () => 0.5);
    expect(out.map((i) => i.word.id).sort()).toEqual([1, 2]);
  });

  it('returns all items when batchSize is 0 (unlimited)', () => {
    const due = [item(1, 2.5), item(2, 1.5), item(3, 2.0)];
    const out = composeAdaptiveBatch(due, 0, () => 0.5);
    expect(out).toHaveLength(3);
  });

  it('prefers weaker cards with a constant rng', () => {
    // With a constant rng, key = u^(1/w); larger weight -> key closer to 1.
    const due = [
      item(1, 2.8), // strong
      item(2, 2.8), // strong
      item(3, 1.3), // weak
      item(4, 1.3), // weak
    ];
    const out = composeAdaptiveBatch(due, 2, () => 0.5);
    expect(out.map((i) => i.word.id).sort()).toEqual([3, 4]);
  });

  it('never exceeds the batch size', () => {
    const due = Array.from({ length: 10 }, (_, i) => item(i + 1, 2.0));
    const out = composeAdaptiveBatch(due, 4);
    expect(out).toHaveLength(4);
  });
});
