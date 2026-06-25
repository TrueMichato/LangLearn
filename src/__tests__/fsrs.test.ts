import { describe, it, expect } from 'vitest';
import {
  fsrs,
  initCard,
  retrievability,
  intervalFromStability,
  mapGradeToRating,
  DEFAULT_W,
  type FSRSState,
} from '../lib/fsrs';

describe('mapGradeToRating', () => {
  it('maps SM-2 grades to FSRS ratings', () => {
    expect(mapGradeToRating(0)).toBe(1);
    expect(mapGradeToRating(1)).toBe(1);
    expect(mapGradeToRating(2)).toBe(1);
    expect(mapGradeToRating(3)).toBe(2);
    expect(mapGradeToRating(4)).toBe(3);
    expect(mapGradeToRating(5)).toBe(4);
  });
});

describe('retrievability', () => {
  it('is 1 at zero elapsed time and decays monotonically', () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 5);
    const r1 = retrievability(5, 10);
    const r2 = retrievability(20, 10);
    expect(r1).toBeLessThan(1);
    expect(r2).toBeLessThan(r1);
  });

  it('reaches ~request retention after one stability interval', () => {
    // By construction R ≈ 0.9 when elapsed equals the 90%-retention interval.
    const s = 10;
    const ivl = intervalFromStability(s, 0.9);
    expect(retrievability(ivl, s)).toBeGreaterThan(0.85);
    expect(retrievability(ivl, s)).toBeLessThan(0.95);
  });
});

describe('intervalFromStability', () => {
  it('grows with stability and is at least 1 day', () => {
    expect(intervalFromStability(0.1)).toBe(1);
    expect(intervalFromStability(100)).toBeGreaterThan(intervalFromStability(10));
  });

  it('lower request retention yields longer intervals', () => {
    expect(intervalFromStability(10, 0.8)).toBeGreaterThan(
      intervalFromStability(10, 0.95)
    );
  });
});

describe('initCard', () => {
  it('gives higher initial stability for better first ratings', () => {
    expect(initCard(1).stability).toBeLessThan(initCard(4).stability);
  });

  it('keeps difficulty within 1..10', () => {
    for (const rating of [1, 2, 3, 4] as const) {
      const d = initCard(rating).difficulty;
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(10);
    }
  });

  it('gives easier cards lower difficulty', () => {
    expect(initCard(4).difficulty).toBeLessThan(initCard(1).difficulty);
  });
});

describe('fsrs', () => {
  it('initializes a new card when prev is null', () => {
    const res = fsrs(null, 3, 0);
    expect(res.stability).toBeGreaterThan(0);
    expect(res.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('higher ratings produce longer next intervals', () => {
    const prev: FSRSState = { stability: 10, difficulty: 5 };
    const elapsed = 10;
    const hard = fsrs(prev, 2, elapsed).intervalDays;
    const good = fsrs(prev, 3, elapsed).intervalDays;
    const easy = fsrs(prev, 4, elapsed).intervalDays;
    expect(good).toBeGreaterThanOrEqual(hard);
    expect(easy).toBeGreaterThanOrEqual(good);
  });

  it('Again shrinks stability and never increases it', () => {
    const prev: FSRSState = { stability: 20, difficulty: 5 };
    const res = fsrs(prev, 1, 20);
    expect(res.stability).toBeLessThan(prev.stability);
    expect(res.stability).toBeGreaterThan(0);
  });

  it('a successful recall increases stability', () => {
    const prev: FSRSState = { stability: 10, difficulty: 5 };
    const res = fsrs(prev, 3, 10);
    expect(res.stability).toBeGreaterThan(prev.stability);
  });

  it('Again raises difficulty, Easy lowers it', () => {
    const prev: FSRSState = { stability: 10, difficulty: 5 };
    expect(fsrs(prev, 1, 10).difficulty).toBeGreaterThan(prev.difficulty);
    expect(fsrs(prev, 4, 10).difficulty).toBeLessThan(prev.difficulty);
  });

  it('treats a zero-stability prev as a new card', () => {
    const res = fsrs({ stability: 0, difficulty: 5 }, 3, 5);
    expect(res.stability).toBeGreaterThan(0);
  });

  it('uses the provided weights array', () => {
    expect(DEFAULT_W.length).toBe(19);
  });
});
