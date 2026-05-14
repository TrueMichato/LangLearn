// Ported from src/lib/notification-planner.ts in the main app.
// Pure function — no DOM, no IDB. The worker calls this on every cron tick
// to decide which notifications to deliver to each subscription.
//
// The only adaptation vs. the in-app copy is the inlined NotificationPrefs
// interface (so the worker doesn't need to import notification-presets).
//
// IMPORTANT: keep this file in sync with src/lib/notification-planner.ts.
// Same applies to ./tz.ts (mirror of src/lib/tz.ts).

import {
  partsInTz,
  wallClockToUtcMs,
  localDateKey,
  daysBetweenIso,
  defaultTz,
} from './tz';

export interface NotificationPrefs {
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyNotificationBudget: number;

  dueCardAlerts: boolean;
  dueCardThreshold: number;

  streakReminders: boolean;
  streakReminderMinDays: number;

  weeklyDigest: boolean;
  comebackNudges: boolean;
  slippingWarnings: boolean;
  dailyGoalMetCelebration: boolean;
  streakMilestoneAlerts: boolean;

  // IANA timezone name (e.g. "Asia/Jerusalem"). Optional for backwards
  // compat with subscriptions that pre-date the field; planner falls back
  // to the runtime's TZ (which is "UTC" in Cloudflare Workers).
  timezone?: string;

  // Worker-side only — included in FullPrefs payload from client.
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
}

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
  important: boolean;
}

export interface SchedulerState {
  dueCount: number;
  currentStreak: number;
  todayGoalMet: boolean;
  todayStudySeconds: number;
  dailyGoalSeconds: number;
  weeklyGoalSeconds: number;
  weekStudySeconds: number;
  weekProgress: number;
  lastActiveDate: string | null;
  celebratedMilestones: number[];
  snoozedUntil: Partial<Record<NotificationCategory, number>>;
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

function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isInQuietHours(now: Date, start: string, end: string, tz?: string): boolean {
  const z = tz ?? defaultTz();
  const p = partsInTz(now.getTime(), z);
  const cur = p.hour * 60 + p.minute;
  const s = parseHM(start);
  const e = parseHM(end);
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

export function clampOutOfQuietHours(when: Date, start: string, end: string, tz?: string): Date {
  const z = tz ?? defaultTz();
  if (!isInQuietHours(when, start, end, z)) return when;
  const wp = partsInTz(when.getTime(), z);
  const [eh, em] = end.split(':').map(Number);
  let endMs = wallClockToUtcMs(wp.year, wp.month, wp.day, eh, em, z);
  if (endMs <= when.getTime()) {
    const next = new Date(when.getTime() + 86_400_000);
    const np = partsInTz(next.getTime(), z);
    endMs = wallClockToUtcMs(np.year, np.month, np.day, eh, em, z);
  }
  return new Date(endMs);
}

const GRACE_MS = 10 * 60 * 1000;

function atTime(dayMs: number, hm: string, tz: string): number {
  const [h, m] = hm.split(':').map(Number);
  const p = partsInTz(dayMs, tz);
  return wallClockToUtcMs(p.year, p.month, p.day, h, m, tz);
}

function daysBetween(aIso: string, b: Date, tz: string): number {
  return daysBetweenIso(aIso, localDateKey(b.getTime(), tz));
}

function addDaysLocal(baseMs: number, n: number, tz: string): number {
  const p = partsInTz(baseMs, tz);
  return wallClockToUtcMs(p.year, p.month, p.day + n, 0, 0, tz);
}

export function computeUpcomingNotifications(
  state: SchedulerState,
  prefs: NotificationPrefs,
  now: Date,
  horizonDays = 7,
  tz?: string
): ScheduledNotification[] {
  if (!prefs.notificationsEnabled) return [];

  const z = tz ?? prefs.timezone ?? defaultTz();
  const out: ScheduledNotification[] = [];
  const seed = partsInTz(now.getTime(), z).day;

  const isSnoozed = (cat: NotificationCategory, whenMs: number) => {
    const until = state.snoozedUntil[cat];
    return until != null && whenMs < until;
  };

  // Daily cue
  for (let d = 0; d < horizonDays; d++) {
    const dayMs = addDaysLocal(now.getTime(), d, z);
    const cueAt = clampOutOfQuietHours(
      new Date(atTime(dayMs, prefs.dailyReminderTime, z)),
      prefs.quietHoursStart,
      prefs.quietHoursEnd,
      z
    );
    if (cueAt.getTime() < now.getTime() - GRACE_MS) continue;
    if (isSnoozed('daily-cue', cueAt.getTime())) continue;

    const isToday = d === 0;
    const skippedYesterday =
      state.lastActiveDate != null && daysBetween(state.lastActiveDate, now, z) >= 2;

    const title = pick(DAILY_TITLES, seed + d);
    const body = isToday && state.dueCount > 0
      ? `You have ${state.dueCount} cards waiting — even 5 minutes counts.`
      : skippedYesterday
        ? 'Welcome back. A tiny session beats none — start small.'
        : 'A few minutes today keeps the habit alive.';

    out.push({
      category: 'daily-cue',
      tag: `daily-cue-${localDateKey(dayMs, z)}`,
      whenMs: cueAt.getTime(),
      title,
      body,
      important: true,
    });
  }

  // Streak at risk
  if (prefs.streakReminders && state.currentStreak >= prefs.streakReminderMinDays) {
    for (let d = 0; d < horizonDays; d++) {
      const dayMs = addDaysLocal(now.getTime(), d, z);
      const quietStartMin = parseHM(prefs.quietHoursStart);
      const targetMin = Math.max(19 * 60, quietStartMin - 120);
      const hh = Math.floor(targetMin / 60);
      const mm = targetMin % 60;
      const at = new Date(atTime(dayMs, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, z));
      if (at.getTime() < now.getTime() - GRACE_MS) continue;
      if (d === 0 && state.todayGoalMet) continue;
      if (isSnoozed('streak-at-risk', at.getTime())) continue;
      out.push({
        category: 'streak-at-risk',
        tag: `streak-at-risk-${localDateKey(dayMs, z)}`,
        whenMs: at.getTime(),
        title: pick(STREAK_AT_RISK_TITLES, seed + d),
        body: `${state.currentStreak}-day streak — a 5-minute session protects it.`,
        important: true,
      });
    }
  }

  // Cards due
  if (prefs.dueCardAlerts && state.dueCount >= prefs.dueCardThreshold) {
    for (let d = 0; d < Math.min(horizonDays, 3); d++) {
      const dayMs = addDaysLocal(now.getTime(), d, z);
      const cueMin = parseHM(prefs.dailyReminderTime);
      const targetMin = (cueMin + 6 * 60) % (24 * 60);
      const hh = Math.floor(targetMin / 60);
      const mm = targetMin % 60;
      let at = new Date(atTime(dayMs, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, z));
      at = clampOutOfQuietHours(at, prefs.quietHoursStart, prefs.quietHoursEnd, z);
      if (at.getTime() < now.getTime() - GRACE_MS) continue;
      if (isSnoozed('cards-due', at.getTime())) continue;
      out.push({
        category: 'cards-due',
        tag: `cards-due-${localDateKey(dayMs, z)}`,
        whenMs: at.getTime(),
        title: pick(DUE_TITLES, seed + d),
        body: `${state.dueCount} cards ready — a few minutes clears the queue.`,
        important: false,
      });
    }
  }

  // Slipping
  if (prefs.slippingWarnings && state.weeklyGoalSeconds > 0) {
    for (let d = 0; d < horizonDays; d++) {
      const dayMs = addDaysLocal(now.getTime(), d, z);
      if (partsInTz(dayMs, z).weekday !== 3) continue;
      const at = clampOutOfQuietHours(
        new Date(atTime(dayMs, '19:30', z)),
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        z
      );
      if (at.getTime() < now.getTime() - GRACE_MS) continue;
      if (d === 0) {
        const ratio = state.weekStudySeconds / state.weeklyGoalSeconds;
        if (ratio >= 0.3) continue;
      }
      if (isSnoozed('slipping', at.getTime())) continue;
      out.push({
        category: 'slipping',
        tag: `slipping-${localDateKey(dayMs, z)}`,
        whenMs: at.getTime(),
        title: 'Half-week check-in 📊',
        body: 'Light week so far — a short session today gets you back on pace.',
        important: false,
      });
    }
  }

  // Weekly digest
  if (prefs.weeklyDigest) {
    for (let d = 0; d < horizonDays; d++) {
      const dayMs = addDaysLocal(now.getTime(), d, z);
      if (partsInTz(dayMs, z).weekday !== 0) continue;
      const at = clampOutOfQuietHours(
        new Date(atTime(dayMs, '19:00', z)),
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        z
      );
      if (at.getTime() < now.getTime() - GRACE_MS) continue;
      if (isSnoozed('weekly-digest', at.getTime())) continue;
      const minutes = Math.round(state.weekStudySeconds / 60);
      out.push({
        category: 'weekly-digest',
        tag: `weekly-digest-${localDateKey(dayMs, z)}`,
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

  // Streak milestone
  if (prefs.streakMilestoneAlerts) {
    const milestone = STREAK_MILESTONES.find(
      (m) => state.currentStreak >= m && !state.celebratedMilestones.includes(m)
    );
    if (milestone) {
      const at = new Date(now.getTime() + 5_000);
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

  // Daily goal met
  if (
    prefs.dailyGoalMetCelebration &&
    state.todayGoalMet &&
    (state.todayFiredCounts['daily-goal-met'] ?? 0) === 0
  ) {
    const at = new Date(now.getTime() + 5_000);
    if (!isSnoozed('daily-goal-met', at.getTime())) {
      out.push({
        category: 'daily-goal-met',
        tag: `daily-goal-met-${localDateKey(now.getTime(), z)}`,
        whenMs: at.getTime(),
        title: 'Daily goal met! ✅',
        body: 'Nice work — every day counts.',
        important: false,
      });
    }
  }

  out.sort((a, b) => a.whenMs - b.whenMs);

  const perDay = new Map<string, number>();
  perDay.set(
    localDateKey(now.getTime(), z),
    Object.values(state.todayFiredCounts).reduce<number>((a, b) => a + (b ?? 0), 0)
  );

  const filtered: ScheduledNotification[] = [];
  for (const n of out) {
    const key = localDateKey(n.whenMs, z);
    const count = perDay.get(key) ?? 0;
    if (count >= prefs.dailyNotificationBudget) continue;
    perDay.set(key, count + 1);
    filtered.push(n);
  }

  return filtered;
}

export { STREAK_MILESTONES };
