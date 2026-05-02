import { db } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { calculateCurrentStreak, todayStr } from './streaks';
import {
  cancelNotificationsByTag,
  showNotification,
  isNotificationSupported,
  registerPeriodicSync,
  supportsPeriodicSync,
} from './notifications';
import {
  computeUpcomingNotifications,
  STREAK_MILESTONES,
  type NotificationCategory,
  type SchedulerState,
  type ScheduledNotification,
} from './notification-planner';
import type { NotificationPrefs } from './notification-presets';
import { useNudgeStore } from '../stores/nudgeStore';

const PLAN_KEY = 'langlearn-notification-plan-v2';
const FIRED_KEY = 'langlearn-notification-fired';
const SNOOZE_KEY = 'langlearn-notification-snooze';
const MILESTONES_KEY = 'langlearn-celebrated-milestones';
const DISMISS_KEY = 'langlearn-notification-dismiss-stats';
const SHOWN_NUDGES_KEY = 'langlearn-shown-nudges';

interface PersistedPlan {
  scheduledAtMs: number;
  notifications: ScheduledNotification[];
}

interface FiredRecord {
  date: string; // YYYY-MM-DD
  counts: Partial<Record<NotificationCategory, number>>;
  tags: string[]; // tags fired today (used to detect "missed")
}

interface DismissStats {
  /** category -> { dismisses, opens, windowStartMs } over a 14-day rolling window */
  [cat: string]: { dismisses: number; opens: number; windowStartMs: number };
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function getFired(): FiredRecord {
  const today = todayStr();
  const existing = readJSON<FiredRecord | null>(FIRED_KEY, null);
  if (!existing || existing.date !== today) {
    return { date: today, counts: {}, tags: [] };
  }
  return existing;
}

function recordFired(notif: ScheduledNotification) {
  const fired = getFired();
  fired.counts[notif.category] = (fired.counts[notif.category] ?? 0) + 1;
  if (!fired.tags.includes(notif.tag)) fired.tags.push(notif.tag);
  writeJSON(FIRED_KEY, fired);
}

function getSnoozes(): Partial<Record<NotificationCategory, number>> {
  return readJSON(SNOOZE_KEY, {} as Partial<Record<NotificationCategory, number>>);
}

function setSnooze(cat: NotificationCategory, untilMs: number) {
  const s = getSnoozes();
  s[cat] = untilMs;
  writeJSON(SNOOZE_KEY, s);
}

function getCelebratedMilestones(): number[] {
  return readJSON(MILESTONES_KEY, []);
}

function addCelebratedMilestone(m: number) {
  const list = getCelebratedMilestones();
  if (!list.includes(m)) {
    list.push(m);
    writeJSON(MILESTONES_KEY, list);
  }
}

interface ShownNudgesRecord {
  date: string;
  ids: string[];
}

function hasNudgeBeenShown(id: string): boolean {
  const record = readJSON<ShownNudgesRecord | null>(SHOWN_NUDGES_KEY, null);
  if (!record || record.date !== todayStr()) return false;
  return record.ids.includes(id);
}

function markNudgeShown(id: string): void {
  const today = todayStr();
  const record = readJSON<ShownNudgesRecord | null>(SHOWN_NUDGES_KEY, null);
  if (!record || record.date !== today) {
    writeJSON(SHOWN_NUDGES_KEY, { date: today, ids: [id] });
  } else if (!record.ids.includes(id)) {
    record.ids.push(id);
    writeJSON(SHOWN_NUDGES_KEY, record);
  }
}

function getDismissStats(): DismissStats {
  return readJSON(DISMISS_KEY, {});
}

export function recordCategoryDismiss(cat: NotificationCategory) {
  const stats = getDismissStats();
  const now = Date.now();
  const windowMs = 14 * 24 * 60 * 60 * 1000;
  const entry = stats[cat] ?? { dismisses: 0, opens: 0, windowStartMs: now };
  if (now - entry.windowStartMs > windowMs) {
    entry.dismisses = 0;
    entry.opens = 0;
    entry.windowStartMs = now;
  }
  entry.dismisses += 1;
  stats[cat] = entry;
  writeJSON(DISMISS_KEY, stats);
  // Auto-snooze a category after 3 dismisses with 0 opens in 7 days.
  if (entry.dismisses >= 3 && entry.opens === 0) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    setSnooze(cat, now + sevenDays);
    useNudgeStore.getState().push({
      title: `Snoozed ${friendlyCategory(cat)} for 7 days`,
      body: 'You dismissed these a few times — taking a break. Re-enable any time in Settings → Notifications.',
      tone: 'info',
    });
  }
}

export function recordCategoryOpen(cat: NotificationCategory) {
  const stats = getDismissStats();
  const entry = stats[cat] ?? { dismisses: 0, opens: 0, windowStartMs: Date.now() };
  entry.opens += 1;
  stats[cat] = entry;
  writeJSON(DISMISS_KEY, stats);
}

function friendlyCategory(cat: NotificationCategory): string {
  switch (cat) {
    case 'daily-cue': return 'daily reminders';
    case 'cards-due': return 'due-card alerts';
    case 'streak-at-risk': return 'streak reminders';
    case 'comeback': return 'comeback nudges';
    case 'slipping': return 'slipping warnings';
    case 'daily-goal-met': return 'goal celebrations';
    case 'weekly-digest': return 'weekly summaries';
    case 'streak-milestone': return 'milestone alerts';
  }
}

async function gatherState(prefs: NotificationPrefs): Promise<SchedulerState> {
  const dueCount = await getDueCount().catch(() => 0);
  const activities = await db.dailyActivity.toArray().catch(() => []);
  const currentStreak = calculateCurrentStreak(activities);

  const today = todayStr();
  const todayActivity = activities.find((a) => a.date === today);
  const todayStudySeconds = todayActivity?.studySeconds ?? 0;
  const dailyGoalSeconds = (prefs as unknown as { dailyGoalMinutes?: number }).dailyGoalMinutes != null
    ? ((prefs as unknown as { dailyGoalMinutes: number }).dailyGoalMinutes) * 60
    : 5 * 60;
  const todayGoalMet = todayActivity?.goalMet ?? false;

  // Week window: Monday-Sunday in local time
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  const weekStudySeconds = activities
    .filter((a) => {
      const d = new Date(a.date + 'T00:00:00');
      return d >= monday;
    })
    .reduce((sum, a) => sum + (a.studySeconds ?? 0), 0);

  const lastActiveSorted = activities
    .filter((a) => (a.studySeconds ?? 0) > 0)
    .map((a) => a.date)
    .sort();
  const lastActiveDate = lastActiveSorted[lastActiveSorted.length - 1] ?? null;

  const fired = getFired();
  const snoozes = getSnoozes();
  const celebratedMilestones = getCelebratedMilestones();

  // weeklyGoalMinutes lives elsewhere; we accept either source via the prefs blob's caller
  const weeklyGoalMinutes = (prefs as unknown as { weeklyGoalMinutes?: number }).weeklyGoalMinutes ?? 0;

  const weekProgress = (now.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000);

  return {
    dueCount,
    currentStreak,
    todayGoalMet,
    todayStudySeconds,
    dailyGoalSeconds,
    weeklyGoalSeconds: weeklyGoalMinutes * 60,
    weekStudySeconds,
    weekProgress,
    lastActiveDate,
    celebratedMilestones,
    snoozedUntil: snoozes,
    todayFiredCounts: fired.counts,
  };
}

/**
 * The richer prefs object passed in includes daily/weekly goal minutes too,
 * so the planner can compute targets directly.
 */
export interface FullPrefs extends NotificationPrefs {
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
}

let inFlight = false;

export async function refreshNotifications(prefs: FullPrefs): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    if (!isNotificationSupported() || !prefs.notificationsEnabled) {
      // Cancel anything we previously scheduled.
      const prev = readJSON<PersistedPlan | null>(PLAN_KEY, null);
      if (prev) {
        for (const n of prev.notifications) {
          await cancelNotificationsByTag(n.tag);
        }
        localStorage.removeItem(PLAN_KEY);
      }
      return;
    }

    // Register periodic background sync for background notifications (Chromium + installed PWA)
    if (supportsPeriodicSync()) {
      const registered = await registerPeriodicSync();
      if (!registered) {
        console.info('[LangLearn] Periodic sync registration failed — background notifications unavailable');
      }
    }

    // Mirror prefs to IndexedDB so SW can read them
    await mirrorPrefsToIDB(prefs);

    const state = await gatherState(prefs);
    const now = new Date();
    const planned = computeUpcomingNotifications(state, prefs, now);

    // Cancel previously-scheduled notifications we own.
    const prev = readJSON<PersistedPlan | null>(PLAN_KEY, null);
    if (prev) {
      for (const n of prev.notifications) {
        await cancelNotificationsByTag(n.tag);
      }
    }

    const scheduled: ScheduledNotification[] = [];

    for (const n of planned) {
      // Don't track things further than 7 days out
      const tooFar = n.whenMs - now.getTime() > 7 * 24 * 60 * 60 * 1000;
      if (tooFar) continue;

      // Streak milestones and goal-met are essentially "now" — show immediately.
      const dueNow = n.whenMs - now.getTime() < 30_000;
      if (dueNow) {
        showNotification(n.title, { body: n.body, tag: n.tag });
        recordFired(n);
        if (n.category === 'streak-milestone') {
          const m = Number(n.tag.split('-').pop());
          if (Number.isFinite(m)) addCelebratedMilestone(m);
        }
        continue;
      }

      // Keep in plan for in-app fallback tick (periodic sync handles background)
      scheduled.push(n);
    }

    writeJSON(PLAN_KEY, {
      scheduledAtMs: now.getTime(),
      notifications: scheduled,
    } satisfies PersistedPlan);
  } finally {
    inFlight = false;
  }
}

/** Mirror notification prefs to IndexedDB so the service worker can access them.
 *  Exported so it can be called from the visibility-change handler and settings subscriber. */
export async function mirrorPrefsToIDB(prefs: FullPrefs): Promise<void> {
  try {
    await db.settings.put({
      key: 'notification-prefs',
      value: JSON.stringify({
        notificationsEnabled: prefs.notificationsEnabled,
        dailyReminderTime: prefs.dailyReminderTime,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        dailyNotificationBudget: prefs.dailyNotificationBudget,
        streakReminders: prefs.streakReminders,
        streakReminderMinDays: prefs.streakReminderMinDays,
        dailyGoalMinutes: prefs.dailyGoalMinutes,
        dueCardAlerts: prefs.dueCardAlerts,
        dueCardThreshold: prefs.dueCardThreshold,
        slippingWarnings: prefs.slippingWarnings,
        weeklyDigest: prefs.weeklyDigest,
        dailyGoalMetCelebration: prefs.dailyGoalMetCelebration,
        streakMilestoneAlerts: prefs.streakMilestoneAlerts,
        weeklyGoalMinutes: prefs.weeklyGoalMinutes,
      }),
    });
  } catch {
    // Non-critical — SW just won't have fresh prefs
  }
}

/**
 * In-app fallback tick: fire any planned notification whose time has come and
 * which we haven't fired today yet. Also surfaces missed *important*
 * notifications as in-app nudges (catch-up).
 */
export async function tickInApp(prefs: FullPrefs): Promise<void> {
  if (!prefs.notificationsEnabled) return;
  const plan = readJSON<PersistedPlan | null>(PLAN_KEY, null);
  if (!plan) return;
  const now = Date.now();
  const fired = getFired();

  for (const n of plan.notifications) {
    if (fired.tags.includes(n.tag)) continue;
    if (n.whenMs > now) continue;

    const overdueMs = now - n.whenMs;
    const veryOverdue = overdueMs > 4 * 60 * 60 * 1000; // > 4h late

    if (!veryOverdue) {
      // Fire as a real notification (browser is open right now).
      showNotification(n.title, { body: n.body, tag: n.tag });
      recordFired(n);
    } else if (n.important) {
      // Catch-up: surface as an in-app nudge instead of a stale notification.
      useNudgeStore.getState().push({
        id: `catchup-${n.tag}`,
        title: n.title,
        body: n.body,
        tone: n.category === 'comeback' || n.category === 'daily-cue' ? 'warm' : 'info',
      });
      recordFired(n);
    }
  }

  // Comeback nudge: if user has been gone ≥2 days, surface in-app on first open.
  if (prefs.comebackNudges) {
    const comebackId = `comeback-${todayStr()}`;
    // Only show once per day — persist across dismissals
    if (!hasNudgeBeenShown(comebackId)) {
      const activities = await db.dailyActivity.toArray().catch(() => []);
      const lastActive = activities
        .filter((a) => (a.studySeconds ?? 0) > 0)
        .map((a) => a.date)
        .sort()
        .pop();
      if (lastActive) {
        const last = new Date(lastActive + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = Math.floor((today.getTime() - last.getTime()) / 86400000);
        if (days >= 2 && days <= 14) {
          markNudgeShown(comebackId);
          useNudgeStore.getState().push({
            id: comebackId,
            title: 'Welcome back 🌱',
            body: `It's been ${days} days. Even 2 minutes today restarts the habit.`,
            tone: 'warm',
          });
        }
      }
    }
  }
}

/** Fire a test notification immediately (Settings UI). */
export async function fireTestNotification(): Promise<void> {
  showNotification('LangLearn test 🌱', {
    body: 'Notifications are working. You\'re all set.',
    tag: 'langlearn-test',
  });
}

export { STREAK_MILESTONES };

// ─── Auto-mirror prefs to IDB whenever notification settings change ───
import { useSettingsStore } from '../stores/settingsStore';

const NOTIFICATION_KEYS: (keyof ReturnType<typeof useSettingsStore.getState>)[] = [
  'notificationsEnabled', 'dailyReminderTime', 'quietHoursStart', 'quietHoursEnd',
  'dailyNotificationBudget', 'dueCardAlerts', 'dueCardThreshold', 'streakReminders',
  'streakReminderMinDays', 'weeklyDigest', 'comebackNudges', 'slippingWarnings',
  'dailyGoalMetCelebration', 'streakMilestoneAlerts', 'dailyGoalMinutes', 'weeklyGoalMinutes',
];

useSettingsStore.subscribe((state, prevState) => {
  const changed = NOTIFICATION_KEYS.some((k) => state[k] !== prevState[k]);
  if (!changed) return;
  void mirrorPrefsToIDB({
    notificationsEnabled: state.notificationsEnabled,
    dailyReminderTime: state.dailyReminderTime,
    quietHoursStart: state.quietHoursStart,
    quietHoursEnd: state.quietHoursEnd,
    dailyNotificationBudget: state.dailyNotificationBudget,
    dueCardAlerts: state.dueCardAlerts,
    dueCardThreshold: state.dueCardThreshold,
    streakReminders: state.streakReminders,
    streakReminderMinDays: state.streakReminderMinDays,
    weeklyDigest: state.weeklyDigest,
    comebackNudges: state.comebackNudges,
    slippingWarnings: state.slippingWarnings,
    dailyGoalMetCelebration: state.dailyGoalMetCelebration,
    streakMilestoneAlerts: state.streakMilestoneAlerts,
    dailyGoalMinutes: state.dailyGoalMinutes,
    weeklyGoalMinutes: state.weeklyGoalMinutes,
  });
});
