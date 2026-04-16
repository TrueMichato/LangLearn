import { describe, it, expect } from 'vitest';
import { calculateTimeXP, calculateReviewXP, formatStudyTime } from '../lib/xp';

describe('XP calculations', () => {
  it('gives 10 XP per 5-minute block', () => {
    expect(calculateTimeXP(300)).toBe(10);
    expect(calculateTimeXP(600)).toBe(20);
    expect(calculateTimeXP(299)).toBe(0);
    expect(calculateTimeXP(900)).toBe(30);
  });

  it('gives 2 XP per reviewed card', () => {
    expect(calculateReviewXP(5)).toBe(10);
    expect(calculateReviewXP(0)).toBe(0);
  });
});

describe('formatStudyTime', () => {
  it('formats seconds under an hour as minutes', () => {
    expect(formatStudyTime(300)).toBe('5m');
    expect(formatStudyTime(59)).toBe('0m');
    expect(formatStudyTime(60)).toBe('1m');
  });

  it('formats over an hour with hours and minutes', () => {
    expect(formatStudyTime(3600)).toBe('1h 0m');
    expect(formatStudyTime(3900)).toBe('1h 5m');
  });
});
