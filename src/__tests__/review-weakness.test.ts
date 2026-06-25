import { describe, it, expect } from 'vitest';
import { reviewWeakness } from '../lib/analytics';

describe('reviewWeakness', () => {
  it('uses FSRS difficulty directly when present', () => {
    expect(reviewWeakness({ ease: 2.5, difficulty: 8 })).toBe(8);
    expect(reviewWeakness({ ease: 2.5, difficulty: 2 })).toBe(2);
  });

  it('maps SM-2 ease so lower ease is weaker', () => {
    const hard = reviewWeakness({ ease: 1.3 });
    const easy = reviewWeakness({ ease: 3.0 });
    expect(hard).toBeGreaterThan(easy);
    expect(hard).toBeCloseTo(11, 1);
    expect(easy).toBeCloseTo(2, 1);
  });

  it('orders an FSRS-hard card above an SM-2 default card', () => {
    const fsrsHard = reviewWeakness({ ease: 2.5, difficulty: 9 });
    const sm2Default = reviewWeakness({ ease: 2.5 });
    expect(fsrsHard).toBeGreaterThan(sm2Default);
  });
});
