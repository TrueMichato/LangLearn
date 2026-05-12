import { db } from '../db/schema';
import { getDueCount } from '../db/reviews';
import { calculateCurrentStreak, todayStr } from './streaks';
import {
  cancelNotificationsByTag,
  showNotification,
  isNotificationSupported,
  registerPeriodicSync,
  supportsPeriodicSync,
  supportsNotificationTriggers,
  scheduleTriggeredNotification,
  listPendingTriggeredTags,
} from './notifications';
import {
  computeUpcomingNotifications,
  isInQuietHours,
  STREAK_MILESTONES,
  type NotificationCategory,
  type SchedulerState,
  type ScheduledNotification,
} from './notification-planner';
import type { NotificationPrefs } from './notification-presets';
import { useNudgeStore } from '../stores/nudgeStore';

async function hasCloudPushEndpoint(): Promise<boolean> {
  try {
    const row = await db.settings.get('push-endpoint');
    return !!row?.value;
  } catch {
    return false;
  }
}

const PLAN_KEY = 'langlearn-notification-plan-v2';
const FIRED_KEY = 'langlearn-notification-fired';
const SNOOZE_KEY = 'langlearn-notification-snooze';
const MILESTONES_KEY = 'langlearn-celebrated-milestones';
const DISMISS_KEY = 'langlearn-notification-dismiss-stats';
const SHOWN_NUDGES_KEY = 'langlearn-shown-nudges';
const TRIGGERED_TAGS_KEY = 'langlearn-triggered-tags';

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

export async function gatherState(prefs: NotificationPrefs): Promise<SchedulerState> {
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

function getTriggeredTags(): string[] {
  return readJSON<string[]>(TRIGGERED_TAGS_KEY, []);
}

function setTriggeredTags(tags: string[]) {
  writeJSON(TRIGGERED_TAGS_KEY, tags);
}

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
      // Cancel any pending triggered notifications.
      const triggered = getTriggeredTags();
      for (const tag of triggered) {
        await cancelNotificationsByTag(tag);
      }
      setTriggeredTags([]);
      return;
    }

    // Register periodic background sync as a fallback (no-op when triggers
    // are supported, but harmless and useful on devices that lose Trigger
    // support across browser updates).
    if (supportsPeriodicSync()) {
      const registered = await registerPeriodicSync();
      if (!registered) {
        console.info('[LangLearn] Periodic sync registration failed — background notifications fall back to in-app only');
      }
    }

    // Mirror prefs to IndexedDB so SW can read them
    await mirrorPrefsToIDB(prefs);

    const state = await gatherState(prefs);
    const now = new Date();
    const planned = computeUpcomingNotifications(state, prefs, now);
    const fired = getFired();

    // Cancel previously-scheduled notifications we own (skip already-fired tags
    // so we don't dismiss a notification the user is still looking at).
    const prev = readJSON<PersistedPlan | null>(PLAN_KEY, null);
    if (prev) {
      for (const n of prev.notifications) {
        if (fired.tags.includes(n.tag)) continue;
        await cancelNotificationsByTag(n.tag);
      }
    }

    const useTriggers = supportsNotificationTriggers() && !(await hasCloudPushEndpoint());

    // When triggers are supported we register notifications with the browser
    // up front and let it fire them while closed. We track which tags we
    // triggered so `tickInApp` doesn't double-fire.
    const triggeredTagsBefore = getTriggeredTags();
    const newTriggeredTags: string[] = [];
    const scheduled: ScheduledNotification[] = [];

    for (const n of planned) {
      // Already fired today — skip
      if (fired.tags.includes(n.tag)) continue;

      // Don't track things further than 7 days out
      const tooFar = n.whenMs - now.getTime() > 7 * 24 * 60 * 60 * 1000;
      if (tooFar) continue;

      // Skip anything that lands inside the quiet-hours window — triggers
      // can't be cancelled mid-flight and would buzz at a bad time.
      const whenDate = new Date(n.whenMs);
      if (isInQuietHours(whenDate, prefs.quietHoursStart, prefs.quietHoursEnd)) {
        continue;
      }

      // Due now (or recently past within the grace period) — fire immediately.
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

      // Future — try to register a TimestampTrigger so it fires while closed.
      if (useTriggers) {
        const ok = await scheduleTriggeredNotification(n.title, n.whenMs, {
          body: n.body,
          tag: n.tag,
          data: { url: deepLinkForCategory(n.category) },
        });
        if (ok) {
          newTriggeredTags.push(n.tag);
          // Still keep it in the plan so tickInApp can record it as fired
          // when the trigger arrives (we listen via getNotifications later)
          // — but mark it as triggered so we don't double-fire.
          scheduled.push(n);
          continue;
        }
      }

      // Fallback: keep in plan for in-app fallback tick (periodic sync /
      // visibility tick handles delivery when app reopens).
      scheduled.push(n);
    }

    // Cancel any previously-triggered tags that are no longer in the new plan.
    const newTagSet = new Set(newTriggeredTags);
    for (const oldTag of triggeredTagsBefore) {
      if (!newTagSet.has(oldTag) && !fired.tags.includes(oldTag)) {
        await cancelNotificationsByTag(oldTag);
      }
    }

    // Reconcile against what the browser actually has pending — handles cases
    // where the browser dropped a trigger (e.g. quota/eviction).
    if (useTriggers) {
      const livePending = await listPendingTriggeredTags('langlearn-');
      const liveSet = new Set(livePending);
      // Drop tags we thought were triggered but the browser no longer has.
      const reconciled = newTriggeredTags.filter((t) => liveSet.has(t));
      // Also pick up any langlearn-* triggers we don't recognise (e.g. from
      // an older version) and cancel them.
      for (const t of livePending) {
        if (!newTagSet.has(t) && !fired.tags.includes(t)) {
          await cancelNotificationsByTag(t);
        }
      }
      setTriggeredTags(reconciled);
    } else {
      setTriggeredTags([]);
    }

    writeJSON(PLAN_KEY, {
      scheduledAtMs: now.getTime(),
      notifications: scheduled,
    } satisfies PersistedPlan);
  } finally {
    inFlight = false;
  }
}

function deepLinkForCategory(cat: NotificationCategory): string {
  switch (cat) {
    case 'cards-due':
    case 'daily-cue':
      return '/LangLearn/#/review';
    case 'weekly-digest':
    case 'slipping':
      return '/LangLearn/#/analytics';
    default:
      return '/LangLearn/';
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
 *
 * Tags already scheduled via TimestampTrigger are skipped here — the browser
 * fires those on its own. We instead reconcile them against the browser's
 * notification list to mark them as fired.
 */
export async function tickInApp(prefs: FullPrefs): Promise<void> {
  if (!prefs.notificationsEnabled) return;
  const plan = readJSON<PersistedPlan | null>(PLAN_KEY, null);
  if (!plan) return;
  const now = Date.now();
  const fired = getFired();
  const triggeredTags = new Set(getTriggeredTags());

  // Reconcile triggered tags: if the trigger has fired (no longer pending)
  // record it as fired so we don't try to re-display it.
  if (triggeredTags.size > 0 && supportsNotificationTriggers()) {
    const stillPending = new Set(await listPendingTriggeredTags('langlearn-'));
    for (const tag of triggeredTags) {
      if (!stillPending.has(tag) && !fired.tags.includes(tag)) {
        const planned = plan.notifications.find((n) => n.tag === tag);
        if (planned) recordFired(planned);
      }
    }
  }

  const refreshedFired = getFired();

  for (const n of plan.notifications) {
    if (refreshedFired.tags.includes(n.tag)) continue;
    if (n.whenMs > now) continue;

    // If this tag is currently registered as a trigger, the browser is
    // responsible for firing it — don't double-fire.
    if (triggeredTags.has(n.tag)) continue;

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

/**
 * Schedule a test notification for ~60 seconds from now using TimestampTrigger
 * if available, so the user can verify "while-closed" delivery. Returns:
 *  - 'triggered' if a real TimestampTrigger was registered (close the tab, it'll fire)
 *  - 'fallback' if we fell back to setTimeout (only fires while app stays open)
 *  - 'unsupported' if neither path works.
 */
export async function fireDelayedTestNotification(): Promise<'triggered' | 'fallback' | 'unsupported'> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return 'unsupported';
  }
  const when = Date.now() + 60_000;
  if (supportsNotificationTriggers()) {
    const ok = await scheduleTriggeredNotification(
      'LangLearn background test ⏱',
      when,
      {
        body: 'If you can read this with the tab/app closed, background notifications are working.',
        tag: `langlearn-test-${when}`,
      },
    );
    if (ok) return 'triggered';
  }
  // Fallback: in-page timer — only fires if the page stays open.
  setTimeout(() => {
    showNotification('LangLearn test ⏱ (open-app only)', {
      body: 'This browser fired the test from the open page. Real "while-closed" notifications need Chromium with Notification Triggers or a Web Push backend.',
      tag: `langlearn-test-${when}`,
    });
  }, 60_000);
  return 'fallback';
}

export { STREAK_MILESTONES };
