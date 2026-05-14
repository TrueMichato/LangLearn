import { describe, it, expect } from 'vitest';
import { computeUpcomingNotifications, isInQuietHours, type NotificationPrefs, type SchedulerState } from '../src/planner';

const basePrefs: NotificationPrefs = {
  notificationsEnabled: true,
  dailyReminderTime: '09:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  dailyNotificationBudget: 3,
  dueCardAlerts: true,
  dueCardThreshold: 5,
  streakReminders: true,
  streakReminderMinDays: 3,
  weeklyDigest: true,
  comebackNudges: true,
  slippingWarnings: true,
  dailyGoalMetCelebration: true,
  streakMilestoneAlerts: true,
  dailyGoalMinutes: 5,
  weeklyGoalMinutes: 60,
};

const baseState: SchedulerState = {
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
};

describe('worker planner port', () => {
  it('schedules a daily cue at the configured reminder time', () => {
    const now = new Date('2025-01-10T08:00:00');
    const out = computeUpcomingNotifications(baseState, basePrefs, now);
    const cue = out.find((n) => n.category === 'daily-cue');
    expect(cue).toBeDefined();
    const at = new Date(cue!.whenMs);
    expect(at.getHours()).toBe(9);
    expect(at.getMinutes()).toBe(0);
  });

  it('honours daily notification budget for today', () => {
    const state: SchedulerState = {
      ...baseState,
      todayFiredCounts: { 'daily-cue': 1, 'cards-due': 1, 'streak-at-risk': 1 },
    };
    const now = new Date('2025-01-10T20:00:00');
    const out = computeUpcomingNotifications(state, basePrefs, now);
    const today = now.toISOString().slice(0, 10);
    const todayPlanned = out.filter((n) => new Date(n.whenMs).toISOString().slice(0, 10) === today);
    expect(todayPlanned.length).toBe(0);
  });

  it('detects quiet hours that wrap midnight', () => {
    expect(isInQuietHours(new Date('2025-01-10T23:30:00'), '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(new Date('2025-01-10T03:00:00'), '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(new Date('2025-01-10T12:00:00'), '22:00', '07:00')).toBe(false);
  });

  it('does not re-schedule a milestone already celebrated', () => {
    const state: SchedulerState = {
      ...baseState,
      currentStreak: 7,
      celebratedMilestones: [3, 7],
    };
    const now = new Date('2025-01-10T19:00:00');
    const out = computeUpcomingNotifications(state, basePrefs, now);
    expect(out.find((n) => n.category === 'streak-milestone')).toBeUndefined();
  });

  // ───── TZ-aware scheduling (the bug fix) ─────

  it('schedules daily cue at the configured local time when timezone is set', () => {
    // Israel is UTC+2 in January (no DST). 09:00 local = 07:00 UTC.
    const prefs = { ...basePrefs, timezone: 'Asia/Jerusalem' };
    const now = new Date('2025-01-10T05:00:00Z'); // 07:00 local
    const out = computeUpcomingNotifications(baseState, prefs, now);
    const cue = out.find((n) => n.category === 'daily-cue');
    expect(cue).toBeDefined();
    // 09:00 Asia/Jerusalem on 2025-01-10 = 07:00 UTC
    expect(new Date(cue!.whenMs).toISOString()).toBe('2025-01-10T07:00:00.000Z');
    expect(cue!.tag).toBe('daily-cue-2025-01-10');
  });

  it('schedules daily cue across DST boundary in Asia/Jerusalem', () => {
    // 2025 spring-forward in Israel: Mar 28 02:00 → 03:00 (UTC+2 → UTC+3).
    // A cue at 09:00 local on Mar 29 → 06:00 UTC (not 07:00).
    const prefs = { ...basePrefs, timezone: 'Asia/Jerusalem' };
    const now = new Date('2025-03-29T05:30:00Z'); // 08:30 local
    const out = computeUpcomingNotifications(baseState, prefs, now);
    const cue = out.find((n) => n.category === 'daily-cue');
    expect(cue).toBeDefined();
    expect(new Date(cue!.whenMs).toISOString()).toBe('2025-03-29T06:00:00.000Z');
  });

  it('quiet-hours clamp respects the user TZ, not UTC', () => {
    // User in Israel (UTC+2 in winter), quiet 22:00–07:00.
    // 19:00 local Sun is *not* in quiet hours, so weekly digest is unaffected.
    const prefs = { ...basePrefs, timezone: 'Asia/Jerusalem' };
    // 2025-01-12 is a Sunday. 19:00 local = 17:00 UTC.
    const now = new Date('2025-01-12T16:30:00Z'); // 18:30 local Sunday
    const out = computeUpcomingNotifications(baseState, prefs, now);
    const digest = out.find((n) => n.category === 'weekly-digest');
    expect(digest).toBeDefined();
    expect(new Date(digest!.whenMs).toISOString()).toBe('2025-01-12T17:00:00.000Z');
    expect(digest!.tag).toBe('weekly-digest-2025-01-12');
  });

  it('daily-cue tag rolls over at the user-local midnight, not UTC midnight', () => {
    // Israel UTC+2 in January. 23:30 local = 21:30 UTC.
    // Worker tick at 22:30 UTC = 00:30 next day local → tag should reflect the *next* day.
    const prefs = { ...basePrefs, timezone: 'Asia/Jerusalem' };
    const now = new Date('2025-01-10T22:30:00Z'); // 2025-01-11 00:30 local
    const out = computeUpcomingNotifications(baseState, prefs, now);
    const todayCue = out.find((n) => n.category === 'daily-cue');
    expect(todayCue).toBeDefined();
    // The cue for d=0 should be 09:00 local on 2025-01-11 = 07:00 UTC
    expect(todayCue!.tag).toBe('daily-cue-2025-01-11');
    expect(new Date(todayCue!.whenMs).toISOString()).toBe('2025-01-11T07:00:00.000Z');
  });
});
