import type { NotificationPrefs } from './notification-presets';

/**
 * Categories of habit-supporting notifications. Each has a stable `tag`
 * so we can replace/cancel pending instances without spamming.
 */
export type NotificationCategory =
  | 'daily-cue'
  | 'cards-due'
  | 'streak-at-risk'
  | 'comeback'
  | 'slipping'
  | 'daily-goal-met'
  | 'weekly-digest'
  | 'streak-milestone';

export interface ScheduledNotification {
  category: NotificationCategory;
  tag: string;
  whenMs: number;
  title: string;
  body: string;
  /** True when this notification represents a significant moment we should
   * show as an in-app catch-up nudge if it was missed. */
  important: boolean;
}

export interface SchedulerState {
  /** Current SRS cards due now. */
  dueCount: number;
  /** Current consecutive-day streak. */
  currentStreak: number;
  /** Did the user already meet today's goal? */
  todayGoalMet: boolean;
  /** Seconds studied today. */
  todayStudySeconds: number;
  /** Daily target in seconds (from dailyGoalMinutes). */
  dailyGoalSeconds: number;
  /** Weekly target in seconds. */
  weeklyGoalSeconds: number;
  /** Sum of studySeconds for the current ISO week (Mon-Sun). */
  weekStudySeconds: number;
  /** Day-of-week index for the start of the current week, used for slipping. */
  weekProgress: number; // 0..1, how far through the week we are time-wise
  /** YYYY-MM-DD of the last day with any study activity (null if none ever). */
  lastActiveDate: string | null;
  /** Streak milestones already celebrated (so we don't fire twice). */
  celebratedMilestones: number[];
  /** Categories currently auto-snoozed by back-off, with their snooze-until ms. */
  snoozedUntil: Partial<Record<NotificationCategory, number>>;
  /** Per-category counters for the current local day. */
  todayFiredCounts: Partial<Record<NotificationCategory, number>>;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

const DAILY_TITLES = [
  'Time to study! 📚',
  'A small bite of practice 🌱',
  'Your daily 5 awaits ✨',
  'Stay on the path 🚶',
];

const DUE_TITLES = ['Cards waiting 🃏', 'Quick review?', 'Catch up on reviews'];

const STREAK_AT_RISK_TITLES = [
  "Don't lose your streak 🔥",
  'Your streak is at risk',
  'Keep the fire alive 🔥',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

/**
 * Parses HH:MM into total minutes since 00:00.
 */
function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isInQuietHours(now: Date, start: string, end: string): boolean {
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = parseHM(start);
  const e = parseHM(end);
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  // overnight wrap (e.g. 22:00..07:00)
  return cur >= s || cur < e;
}

/** Round forward to the end of the quiet window if `when` falls inside it. */
export function clampOutOfQuietHours(when: Date, start: string, end: string): Date {
  if (!isInQuietHours(when, start, end)) return when;
  const result = new Date(when);
  const [eh, em] = end.split(':').map(Number);
  result.setHours(eh, em, 0, 0);
  // If the end time is earlier in the day than `when`, push to next day
  if (result.getTime() <= when.getTime()) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function dateOnly(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function atTime(day: Date, hm: string): Date {
  const [h, m] = hm.split(':').map(Number);
  const x = new Date(day);
  x.setHours(h, m, 0, 0);
  return x;
}

function daysBetween(aIso: string, b: Date): number {
  const a = new Date(aIso + 'T00:00:00');
  return Math.floor((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000);
}

/**
 * Pure planner: given current state + prefs + a "now", returns the list of
 * notifications that should be delivered going forward (next ~7 days),
 * already filtered by quiet hours, daily budget, cooldowns, and back-off.
 */
export function computeUpcomingNotifications(
  state: SchedulerState,
  prefs: NotificationPrefs,
  now: Date,
  horizonDays = 7
): ScheduledNotification[] {
  if (!prefs.notificationsEnabled) return [];

  const out: ScheduledNotification[] = [];
  const seed = now.getDate(); // stable per-day variety

  // helper: skip if category is snoozed at `whenMs`
  const isSnoozed = (cat: NotificationCategory, whenMs: number) => {
    const until = state.snoozedUntil[cat];
    return until != null && whenMs < until;
  };

  // -------- Daily cue --------
  for (let d = 0; d < horizonDays; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const cueAt = clampOutOfQuietHours(
      atTime(day, prefs.dailyReminderTime),
      prefs.quietHoursStart,
      prefs.quietHoursEnd
    );
    if (cueAt.getTime() <= now.getTime()) continue; // already passed today

    if (isSnoozed('daily-cue', cueAt.getTime())) continue;

    const isToday = d === 0;
    const skippedYesterday =
      state.lastActiveDate != null &&
      daysBetween(state.lastActiveDate, now) >= 2;

    const title = pick(DAILY_TITLES, seed + d);
    const body = isToday && state.dueCount > 0
      ? `You have ${state.dueCount} cards waiting — even 5 minutes counts.`
      : skippedYesterday
        ? 'Welcome back. A tiny session beats none — start small.'
        : 'A few minutes today keeps the habit alive.';

    out.push({
      category: 'daily-cue',
      tag: `daily-cue-${day.toISOString().slice(0, 10)}`,
      whenMs: cueAt.getTime(),
      title,
      body,
      important: true,
    });
  }

  // -------- Streak at risk --------
  if (
    prefs.streakReminders &&
    state.currentStreak >= prefs.streakReminderMinDays
  ) {
    for (let d = 0; d < horizonDays; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      // Fire 2 hours before quiet hours start, but not before 19:00
      const quietStartMin = parseHM(prefs.quietHoursStart);
      const targetMin = Math.max(19 * 60, quietStartMin - 120);
      const hh = Math.floor(targetMin / 60);
      const mm = targetMin % 60;
      const at = atTime(day, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      if (at.getTime() <= now.getTime()) continue;
      // Only worth scheduling if today's goal isn't already met (for d === 0)
      if (d === 0 && state.todayGoalMet) continue;
      if (isSnoozed('streak-at-risk', at.getTime())) continue;
      out.push({
        category: 'streak-at-risk',
        tag: `streak-at-risk-${day.toISOString().slice(0, 10)}`,
        whenMs: at.getTime(),
        title: pick(STREAK_AT_RISK_TITLES, seed + d),
        body: `${state.currentStreak}-day streak — a 5-minute session protects it.`,
        important: true,
      });
    }
  }

  // -------- Cards due --------
  if (prefs.dueCardAlerts && state.dueCount >= prefs.dueCardThreshold) {
    // Schedule one mid-day pulse, far enough from the daily cue to not double-up.
    for (let d = 0; d < Math.min(horizonDays, 3); d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      const cueMin = parseHM(prefs.dailyReminderTime);
      const targetMin = (cueMin + 6 * 60) % (24 * 60); // ~6h after daily cue
      const hh = Math.floor(targetMin / 60);
      const mm = targetMin % 60;
      let at = atTime(day, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      at = clampOutOfQuietHours(at, prefs.quietHoursStart, prefs.quietHoursEnd);
      if (at.getTime() <= now.getTime()) continue;
      if (isSnoozed('cards-due', at.getTime())) continue;
      out.push({
        category: 'cards-due',
        tag: `cards-due-${day.toISOString().slice(0, 10)}`,
        whenMs: at.getTime(),
        title: pick(DUE_TITLES, seed + d),
        body: `${state.dueCount} cards ready — a few minutes clears the queue.`,
        important: false,
      });
    }
  }

  // -------- Slipping warning (Wednesday evening if <30% of weekly goal) --------
  if (prefs.slippingWarnings && state.weeklyGoalSeconds > 0) {
    for (let d = 0; d < horizonDays; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      // 3 = Wednesday in JS Date (Sun=0)
      if (day.getDay() !== 3) continue;
      const at = clampOutOfQuietHours(
        atTime(day, '19:30'),
        prefs.quietHoursStart,
        prefs.quietHoursEnd
      );
      if (at.getTime() <= now.getTime()) continue;
      // For "today" decision, check current weekly progress.
      // For future Wednesdays we still schedule (it'll be re-evaluated on refresh).
      if (d === 0) {
        const ratio = state.weekStudySeconds / state.weeklyGoalSeconds;
        if (ratio >= 0.3) continue;
      }
      if (isSnoozed('slipping', at.getTime())) continue;
      out.push({
        category: 'slipping',
        tag: `slipping-${day.toISOString().slice(0, 10)}`,
        whenMs: at.getTime(),
        title: 'Half-week check-in 📊',
        body: 'Light week so far — a short session today gets you back on pace.',
        important: false,
      });
    }
  }

  // -------- Weekly digest (Sunday 19:00) --------
  if (prefs.weeklyDigest) {
    for (let d = 0; d < horizonDays; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      if (day.getDay() !== 0) continue;
      const at = clampOutOfQuietHours(
        atTime(day, '19:00'),
        prefs.quietHoursStart,
        prefs.quietHoursEnd
      );
      if (at.getTime() <= now.getTime()) continue;
      if (isSnoozed('weekly-digest', at.getTime())) continue;
      const minutes = Math.round(state.weekStudySeconds / 60);
      out.push({
        category: 'weekly-digest',
        tag: `weekly-digest-${day.toISOString().slice(0, 10)}`,
        whenMs: at.getTime(),
        title: 'Weekly summary 📊',
        body:
          state.weekStudySeconds >= state.weeklyGoalSeconds
            ? `You hit your weekly goal — ${minutes} minutes! 🎉`
            : `${minutes} minutes this week. New week, fresh start.`,
        important: false,
      });
    }
  }

  // -------- Streak milestone (today only — fired immediately on reach) --------
  if (prefs.streakMilestoneAlerts) {
    const milestone = STREAK_MILESTONES.find(
      (m) => state.currentStreak >= m && !state.celebratedMilestones.includes(m)
    );
    if (milestone) {
      const at = new Date(now.getTime() + 5_000); // ~immediate
      if (!isSnoozed('streak-milestone', at.getTime())) {
        out.push({
          category: 'streak-milestone',
          tag: `streak-milestone-${milestone}`,
          whenMs: at.getTime(),
          title: `${milestone}-day streak! 🔥`,
          body: 'Consistency is the whole game. Take a bow.',
          important: false,
        });
      }
    }
  }

  // -------- Daily goal met celebration --------
  if (
    prefs.dailyGoalMetCelebration &&
    state.todayGoalMet &&
    (state.todayFiredCounts['daily-goal-met'] ?? 0) === 0
  ) {
    const at = new Date(now.getTime() + 5_000);
    if (!isSnoozed('daily-goal-met', at.getTime())) {
      out.push({
        category: 'daily-goal-met',
        tag: `daily-goal-met-${now.toISOString().slice(0, 10)}`,
        whenMs: at.getTime(),
        title: 'Daily goal met! ✅',
        body: 'Nice work — every day counts.',
        important: false,
      });
    }
  }

  // Sort chronologically, then enforce daily budget.
  out.sort((a, b) => a.whenMs - b.whenMs);

  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const perDay = new Map<string, number>();
  // Seed today's count with already-fired notifications
  perDay.set(
    fmt(now.getTime()),
    Object.values(state.todayFiredCounts).reduce<number>((a, b) => a + (b ?? 0), 0)
  );

  const filtered: ScheduledNotification[] = [];
  for (const n of out) {
    const key = fmt(n.whenMs);
    const count = perDay.get(key) ?? 0;
    if (count >= prefs.dailyNotificationBudget) continue;
    perDay.set(key, count + 1);
    filtered.push(n);
  }

  return filtered;
}

export { STREAK_MILESTONES };
