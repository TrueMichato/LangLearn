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
});
