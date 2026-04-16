import { describe, it, expect } from 'vitest';
import {
  todayStr,
  calculateCurrentStreak,
  calculateLongestStreak,
} from '../lib/streaks';
import type { DailyActivity } from '../db/schema';

function makeActivity(
  date: string,
  goalMet: boolean,
  studySeconds = 600
): DailyActivity {
  return { date, studySeconds, cardsReviewed: 5, wordsAdded: 2, goalMet };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

describe('todayStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(todayStr()).toBe(expected);
  });
});

describe('calculateCurrentStreak', () => {
  it('returns 0 for empty activities', () => {
    expect(calculateCurrentStreak([])).toBe(0);
  });

  it('counts consecutive days with goalMet', () => {
    const activities = [
      makeActivity(daysAgo(0), true),
      makeActivity(daysAgo(1), true),
      makeActivity(daysAgo(2), true),
    ];
    expect(calculateCurrentStreak(activities)).toBe(3);
  });

  it('streak broken by missed day', () => {
    const activities = [
      makeActivity(daysAgo(0), true),
      makeActivity(daysAgo(1), false),
      makeActivity(daysAgo(2), true),
      makeActivity(daysAgo(3), true),
    ];
    // Day 1 ago is not met, and there aren't 6 surrounding met days, so streak breaks
    expect(calculateCurrentStreak(activities)).toBe(1);
  });

  it('returns streak starting from yesterday if today has no activity', () => {
    const activities = [
      makeActivity(daysAgo(1), true),
      makeActivity(daysAgo(2), true),
    ];
    expect(calculateCurrentStreak(activities)).toBe(2);
  });

  it('returns 0 when today and yesterday both have no activity', () => {
    const activities = [
      makeActivity(daysAgo(2), true),
      makeActivity(daysAgo(3), true),
    ];
    expect(calculateCurrentStreak(activities)).toBe(0);
  });

  it('freeze-day forgiveness: 1 missed day in a 7-day window with 6+ met', () => {
    // 7 consecutive days, 6 met + 1 missed in position 3 days ago
    const activities = [
      makeActivity(daysAgo(0), true),
      makeActivity(daysAgo(1), true),
      makeActivity(daysAgo(2), true),
      makeActivity(daysAgo(3), false), // freeze candidate
      makeActivity(daysAgo(4), true),
      makeActivity(daysAgo(5), true),
      makeActivity(daysAgo(6), true),
    ];
    // With freeze, streak should continue through the missed day
    const streak = calculateCurrentStreak(activities);
    expect(streak).toBe(6); // 6 met days (missed day doesn't count toward streak)
  });
});

describe('calculateLongestStreak', () => {
  it('returns 0 for empty activities', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it('finds longest consecutive goalMet run', () => {
    const activities = [
      makeActivity('2024-01-01', true),
      makeActivity('2024-01-02', true),
      makeActivity('2024-01-03', true),
      makeActivity('2024-01-04', false),
      makeActivity('2024-01-05', true),
      makeActivity('2024-01-06', true),
      makeActivity('2024-01-07', true),
      makeActivity('2024-01-08', true),
      makeActivity('2024-01-09', true),
      makeActivity('2024-01-10', false),
    ];
    expect(calculateLongestStreak(activities)).toBe(5);
  });

  it('handles all goalMet', () => {
    const activities = [
      makeActivity('2024-01-01', true),
      makeActivity('2024-01-02', true),
      makeActivity('2024-01-03', true),
    ];
    expect(calculateLongestStreak(activities)).toBe(3);
  });

  it('handles no goalMet', () => {
    const activities = [
      makeActivity('2024-01-01', false),
      makeActivity('2024-01-02', false),
    ];
    expect(calculateLongestStreak(activities)).toBe(0);
  });
});
