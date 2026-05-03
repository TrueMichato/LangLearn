import { describe, it, expect } from 'vitest';
import {
  computeUpcomingNotifications,
  isInQuietHours,
  clampOutOfQuietHours,
  type SchedulerState,
} from '../lib/notification-planner';
import { PRESETS, detectPreset, matchesPreset, type NotificationPrefs } from '../lib/notification-presets';

function basePrefs(overrides: Partial<NotificationPrefs> = {}): NotificationPrefs {
  return {
    notificationsEnabled: true,
    dailyReminderTime: '09:00',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    ...PRESETS.balanced,
    ...overrides,
  };
}

function baseState(overrides: Partial<SchedulerState> = {}): SchedulerState {
  return {
    dueCount: 0,
    currentStreak: 0,
    todayGoalMet: false,
    todayStudySeconds: 0,
    dailyGoalSeconds: 5 * 60,
    weeklyGoalSeconds: 60 * 60,
    weekStudySeconds: 0,
    weekProgress: 0.5,
    lastActiveDate: null,
    celebratedMilestones: [],
    snoozedUntil: {},
    todayFiredCounts: {},
    ...overrides,
  };
}

describe('isInQuietHours', () => {
  it('handles same-day windows', () => {
    const at = new Date('2026-01-01T10:00:00');
    expect(isInQuietHours(at, '08:00', '12:00')).toBe(true);
    expect(isInQuietHours(at, '12:00', '14:00')).toBe(false);
  });
  it('handles overnight windows', () => {
    expect(isInQuietHours(new Date('2026-01-01T23:00:00'), '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(new Date('2026-01-01T03:00:00'), '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(new Date('2026-01-01T08:00:00'), '22:00', '07:00')).toBe(false);
  });
});

describe('clampOutOfQuietHours', () => {
  it('returns same time if not in quiet hours', () => {
    const at = new Date('2026-01-01T10:00:00');
    expect(clampOutOfQuietHours(at, '22:00', '07:00').getTime()).toBe(at.getTime());
  });
  it('pushes forward to end of quiet hours', () => {
    const at = new Date('2026-01-01T03:00:00');
    const clamped = clampOutOfQuietHours(at, '22:00', '07:00');
    expect(clamped.getHours()).toBe(7);
    expect(clamped.getMinutes()).toBe(0);
  });
});

describe('computeUpcomingNotifications', () => {
  const now = new Date('2026-01-05T07:00:00'); // Monday morning before 09:00 cue

  it('returns nothing when notifications are disabled', () => {
    const prefs = basePrefs({ notificationsEnabled: false });
    expect(computeUpcomingNotifications(baseState(), prefs, now)).toEqual([]);
  });

  it('schedules a daily cue for today at the reminder time', () => {
    const result = computeUpcomingNotifications(baseState(), basePrefs(), now);
    const today = result.find((n) => n.category === 'daily-cue');
    expect(today).toBeDefined();
    const at = new Date(today!.whenMs);
    expect(at.getHours()).toBe(9);
    expect(today!.important).toBe(true);
  });

  it('skips today\'s daily cue if it has already passed beyond the grace period', () => {
    const lateNow = new Date('2026-01-05T20:00:00');
    const result = computeUpcomingNotifications(baseState(), basePrefs(), lateNow);
    // First daily-cue should be tomorrow at 09:00
    const cues = result.filter((n) => n.category === 'daily-cue');
    expect(cues.length).toBeGreaterThan(0);
    expect(new Date(cues[0].whenMs).getDate()).toBe(6);
  });

  it('includes today\'s daily cue if it passed within the grace period', () => {
    // 09:00 daily cue, now is 09:07 — within 10 min grace
    const justPast = new Date('2026-01-05T09:07:00');
    const result = computeUpcomingNotifications(baseState(), basePrefs(), justPast);
    const todayCue = result.find(
      (n) => n.category === 'daily-cue' && new Date(n.whenMs).getDate() === 5
    );
    expect(todayCue).toBeDefined();
    expect(todayCue!.whenMs).toBeLessThan(justPast.getTime());
  });

  it('excludes today\'s daily cue if it passed well beyond the grace period', () => {
    // 09:00 daily cue, now is 09:15 — beyond 10 min grace
    const wellPast = new Date('2026-01-05T09:15:00');
    const result = computeUpcomingNotifications(baseState(), basePrefs(), wellPast);
    const todayCue = result.find(
      (n) => n.category === 'daily-cue' && new Date(n.whenMs).getDate() === 5
    );
    expect(todayCue).toBeUndefined();
  });

  it('respects daily notification budget', () => {
    const prefs = basePrefs({
      dailyNotificationBudget: 1,
      dueCardAlerts: true,
      dueCardThreshold: 5,
    });
    const state = baseState({ dueCount: 50 });
    const result = computeUpcomingNotifications(state, prefs, now);
    // Group by day
    const byDay = new Map<string, number>();
    for (const r of result) {
      const k = new Date(r.whenMs).toISOString().slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }
    for (const count of byDay.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  it('does not schedule streak-at-risk under min streak length', () => {
    const prefs = basePrefs({ streakReminders: true, streakReminderMinDays: 3 });
    const state = baseState({ currentStreak: 1 });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'streak-at-risk')).toBeUndefined();
  });

  it('schedules streak-at-risk when streak is long enough', () => {
    const prefs = basePrefs({ streakReminders: true, streakReminderMinDays: 3 });
    const state = baseState({ currentStreak: 10 });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'streak-at-risk')).toBeDefined();
  });

  it('skips today\'s streak-at-risk if today\'s goal already met', () => {
    const prefs = basePrefs({ streakReminders: true, streakReminderMinDays: 3 });
    const state = baseState({ currentStreak: 10, todayGoalMet: true });
    const result = computeUpcomingNotifications(state, prefs, now);
    const today = result
      .filter((n) => n.category === 'streak-at-risk')
      .find((n) => new Date(n.whenMs).getDate() === now.getDate());
    expect(today).toBeUndefined();
  });

  it('honours snoozed categories', () => {
    const prefs = basePrefs();
    const state = baseState({
      snoozedUntil: { 'daily-cue': now.getTime() + 30 * 24 * 60 * 60 * 1000 },
    });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'daily-cue')).toBeUndefined();
  });

  it('schedules cards-due when over threshold', () => {
    const prefs = basePrefs({ dueCardAlerts: true, dueCardThreshold: 10 });
    const state = baseState({ dueCount: 25 });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'cards-due')).toBeDefined();
  });

  it('skips cards-due when below threshold', () => {
    const prefs = basePrefs({ dueCardAlerts: true, dueCardThreshold: 10 });
    const state = baseState({ dueCount: 5 });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'cards-due')).toBeUndefined();
  });

  it('schedules slipping warning on Wednesday when behind', () => {
    const prefs = basePrefs({ slippingWarnings: true });
    const wed = new Date('2026-01-07T08:00:00'); // Wednesday
    const state = baseState({ weeklyGoalSeconds: 3600, weekStudySeconds: 600 });
    const result = computeUpcomingNotifications(state, prefs, wed, 1);
    expect(result.find((n) => n.category === 'slipping')).toBeDefined();
  });

  it('does not schedule slipping warning on Wednesday when on track', () => {
    const prefs = basePrefs({ slippingWarnings: true });
    const wed = new Date('2026-01-07T08:00:00');
    const state = baseState({ weeklyGoalSeconds: 3600, weekStudySeconds: 3000 });
    const result = computeUpcomingNotifications(state, prefs, wed, 1);
    expect(result.find((n) => n.category === 'slipping')).toBeUndefined();
  });

  it('fires streak milestone on reaching one (not yet celebrated)', () => {
    const prefs = basePrefs({ streakMilestoneAlerts: true });
    const state = baseState({ currentStreak: 7, celebratedMilestones: [3] });
    const result = computeUpcomingNotifications(state, prefs, now);
    const m = result.find((n) => n.category === 'streak-milestone');
    expect(m).toBeDefined();
    expect(m!.tag).toContain('-7');
  });

  it('does not re-fire celebrated milestones', () => {
    const prefs = basePrefs({ streakMilestoneAlerts: true });
    const state = baseState({ currentStreak: 7, celebratedMilestones: [3, 7] });
    const result = computeUpcomingNotifications(state, prefs, now);
    expect(result.find((n) => n.category === 'streak-milestone')).toBeUndefined();
  });

  it('clamps daily cue out of quiet hours', () => {
    const prefs = basePrefs({ dailyReminderTime: '03:00', quietHoursStart: '22:00', quietHoursEnd: '07:00' });
    const result = computeUpcomingNotifications(baseState(), prefs, now);
    const today = result.find((n) => n.category === 'daily-cue');
    expect(today).toBeDefined();
    const at = new Date(today!.whenMs);
    expect(at.getHours()).toBe(7);
  });
});

describe('presets', () => {
  it('matchesPreset detects exact balanced match', () => {
    const prefs = basePrefs();
    expect(matchesPreset(prefs, 'balanced')).toBe(true);
    expect(matchesPreset(prefs, 'gentle')).toBe(false);
  });

  it('detectPreset returns custom for off-spec mix', () => {
    const prefs = basePrefs({ dailyNotificationBudget: 99 });
    expect(detectPreset(prefs)).toBe('custom');
  });

  it('detectPreset returns gentle/persistent', () => {
    expect(detectPreset({ ...basePrefs(), ...PRESETS.gentle })).toBe('gentle');
    expect(detectPreset({ ...basePrefs(), ...PRESETS.persistent })).toBe('persistent');
  });
});
