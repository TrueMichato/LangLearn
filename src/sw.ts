/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Workbox precaching — injected by vite-plugin-pwa at build time
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ─── IndexedDB access (lightweight, no full schema needed) ───

const DB_NAME = 'LangLearnDB';
const DB_VERSION = 8;

interface NotificationPrefsBlob {
  notificationsEnabled: boolean;
  dailyReminderTime: string; // "HH:MM"
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyNotificationBudget: number;
  streakReminders: boolean;
  streakReminderMinDays: number;
  dailyGoalMinutes: number;
  dueCardAlerts: boolean;
  dueCardThreshold: number;
  slippingWarnings: boolean;
  weeklyDigest: boolean;
  dailyGoalMetCelebration: boolean;
  streakMilestoneAlerts: boolean;
  weeklyGoalMinutes: number;
}

interface DailyActivityRow {
  date: string;
  studySeconds: number;
  goalMet: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // If upgrade is needed, just close — we don't create stores here
    req.onupgradeneeded = () => {
      req.transaction?.abort();
      reject(new Error('DB upgrade needed — skip'));
    };
  });
}

async function getSettingValue(db: IDBDatabase, key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function putSettingValue(db: IDBDatabase, key: string, value: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getNotificationPrefs(db: IDBDatabase): Promise<NotificationPrefsBlob | null> {
  const raw = await getSettingValue(db, 'notification-prefs');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NotificationPrefsBlob;
  } catch {
    return null;
  }
}

async function getTodayActivity(db: IDBDatabase): Promise<DailyActivityRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('dailyActivity', 'readonly');
      const store = tx.objectStore('dailyActivity');
      const req = store.get(today);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getRecentActivity(db: IDBDatabase, days: number): Promise<DailyActivityRow[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('dailyActivity', 'readonly');
      const store = tx.objectStore('dailyActivity');
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result ?? []) as DailyActivityRow[];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        resolve(all.filter((a) => a.date >= cutoffStr));
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function getDueReviewCount(db: IDBDatabase): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('reviews', 'readonly');
      const store = tx.objectStore('reviews');
      const index = store.index('nextReviewDate');
      const range = IDBKeyRange.upperBound(today);
      const req = index.count(range);
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

function getWeekStudySeconds(activities: DailyActivityRow[]): number {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().slice(0, 10);
  return activities
    .filter((a) => a.date >= mondayStr)
    .reduce((sum, a) => sum + (a.studySeconds ?? 0), 0);
}

const CELEBRATED_KEY = 'sw-celebrated-milestones';
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

async function getCelebratedMilestones(db: IDBDatabase): Promise<number[]> {
  const raw = await getSettingValue(db, CELEBRATED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

async function addCelebratedMilestone(db: IDBDatabase, milestone: number): Promise<void> {
  const list = await getCelebratedMilestones(db);
  if (list.includes(milestone)) return;
  list.push(milestone);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: CELEBRATED_KEY, value: JSON.stringify(list) });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function calculateStreak(activities: DailyActivityRow[]): number {
  const studied = new Set(
    activities
      .filter((a) => a.studySeconds > 0)
      .map((a) => a.date)
  );
  let streak = 0;
  const d = new Date();
  // Check today first
  const todayStr = d.toISOString().slice(0, 10);
  if (!studied.has(todayStr)) {
    // If haven't studied today, check if yesterday was studied (streak not broken yet today)
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (studied.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Notification fired tracking (use IDB settings table) ───

const SW_FIRED_KEY = 'sw-notification-fired';

async function getSWFiredToday(db: IDBDatabase): Promise<number> {
  const raw = await getSettingValue(db, SW_FIRED_KEY);
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { date: string; count: number };
    const today = new Date().toISOString().slice(0, 10);
    return data.date === today ? data.count : 0;
  } catch {
    return 0;
  }
}

async function incrementSWFired(db: IDBDatabase): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getSWFiredToday(db);
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: SW_FIRED_KEY, value: JSON.stringify({ date: today, count: current + 1 }) });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// ─── Quiet hours check ───

function isInQuietHours(start: string, end: string, now: Date): boolean {
  if (!start || !end || start === end) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // Wraps midnight
  return nowMin >= startMin || nowMin < endMin;
}

// ─── Periodic Sync handler ───

self.addEventListener('periodicsync' as unknown as keyof ServiceWorkerGlobalScopeEventMap, ((event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag !== 'langlearn-check-notifications') return;

  syncEvent.waitUntil(handlePeriodicSync());
}) as EventListener);

async function handlePeriodicSync(): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    return; // Can't read state — skip
  }

  try {
    // Always record the wake time so the app UI can prove the OS is firing
    // this handler — even if no notification ends up being shown.
    await putSettingValue(db, 'last-sync-wake', String(Date.now()));

    const prefs = await getNotificationPrefs(db);
    if (!prefs || !prefs.notificationsEnabled) return;

    const now = new Date();

    // Quiet hours check
    if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, now)) return;

    // Budget check
    const firedToday = await getSWFiredToday(db);
    if (firedToday >= prefs.dailyNotificationBudget) return;

    const todayActivity = await getTodayActivity(db);
    const hasStudiedToday = (todayActivity?.studySeconds ?? 0) > 0;

    // Determine which notification to show (priority order)
    const notification = await pickNotification(db, prefs, now, hasStudiedToday);
    if (notification) {
      // Map notification tags to relevant deep-link pages
      let url = '/LangLearn/';
      if (notification.tag.startsWith('langlearn-cards-due') || notification.tag.startsWith('langlearn-daily-cue')) {
        url = '/LangLearn/#/review';
      } else if (notification.tag.startsWith('langlearn-weekly-digest') || notification.tag.startsWith('langlearn-slipping')) {
        url = '/LangLearn/#/analytics';
      }

      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: '/LangLearn/pwa-192x192.png',
        badge: '/LangLearn/pwa-192x192.png',
        tag: notification.tag,
        data: { url },
      });
      await incrementSWFired(db);
    }
  } finally {
    db.close();
  }
}

interface NotifPayload {
  title: string;
  body: string;
  tag: string;
}

async function pickNotification(
  db: IDBDatabase,
  prefs: NotificationPrefsBlob,
  now: Date,
  hasStudiedToday: boolean,
): Promise<NotifPayload | null> {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const recentActivity = await getRecentActivity(db, 30);
  const streak = calculateStreak(recentActivity);
  const todayActivity = await getTodayActivity(db);

  // 1. Daily cue — show if within 2h window of reminder time and haven't studied
  if (!hasStudiedToday) {
    const [rh, rm] = prefs.dailyReminderTime.split(':').map(Number);
    const reminderMin = rh * 60 + rm;
    const diff = nowMin - reminderMin;
    if (diff >= 0 && diff <= 120) {
      return {
        title: 'Time to practice 🌱',
        body: `Your ${prefs.dailyGoalMinutes}-minute daily goal is waiting. Small steps build big habits.`,
        tag: `langlearn-daily-cue-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 2. Streak-at-risk — evening (≥18:00), no study today, streak ≥ min
  if (prefs.streakReminders && !hasStudiedToday && now.getHours() >= 18) {
    if (streak >= prefs.streakReminderMinDays) {
      return {
        title: `${streak}-day streak at risk 🔥`,
        body: `Even ${prefs.dailyGoalMinutes} minutes keeps it alive. You've got this.`,
        tag: `langlearn-streak-risk-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 3. Cards-due — mid-day pulse when reviews pile up
  if (prefs.dueCardAlerts) {
    const dueCount = await getDueReviewCount(db);
    if (dueCount >= prefs.dueCardThreshold && now.getHours() >= 11 && now.getHours() <= 20) {
      return {
        title: 'Cards waiting 🃏',
        body: `${dueCount} cards ready — a few minutes clears the queue.`,
        tag: `langlearn-cards-due-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 4. Slipping warning — Wednesday evening if behind on weekly goal
  if (prefs.slippingWarnings && prefs.weeklyGoalMinutes > 0 && now.getDay() === 3 && now.getHours() >= 19) {
    const weekSeconds = getWeekStudySeconds(recentActivity);
    const weekGoalSeconds = prefs.weeklyGoalMinutes * 60;
    if (weekGoalSeconds > 0 && weekSeconds / weekGoalSeconds < 0.3) {
      return {
        title: 'Half-week check-in 📊',
        body: 'Light week so far — a short session today gets you back on pace.',
        tag: `langlearn-slipping-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 5. Weekly digest — Sunday evening
  if (prefs.weeklyDigest && now.getDay() === 0 && now.getHours() >= 18) {
    const weekSeconds = getWeekStudySeconds(recentActivity);
    const minutes = Math.round(weekSeconds / 60);
    const weekGoalSeconds = prefs.weeklyGoalMinutes * 60;
    const body = weekGoalSeconds > 0 && weekSeconds >= weekGoalSeconds
      ? `You hit your weekly goal — ${minutes} minutes! 🎉`
      : `${minutes} minutes this week. New week, fresh start.`;
    return {
      title: 'Weekly summary 📊',
      body,
      tag: `langlearn-weekly-digest-${now.toISOString().slice(0, 10)}`,
    };
  }

  // 6. Daily goal met celebration
  if (prefs.dailyGoalMetCelebration && todayActivity?.goalMet) {
    return {
      title: 'Daily goal met! ✅',
      body: 'Nice work — every day counts.',
      tag: `langlearn-goal-met-${now.toISOString().slice(0, 10)}`,
    };
  }

  // 7. Streak milestone
  if (prefs.streakMilestoneAlerts && streak > 0) {
    const celebrated = await getCelebratedMilestones(db);
    const milestone = STREAK_MILESTONES.find(
      (m) => streak >= m && !celebrated.includes(m)
    );
    if (milestone) {
      await addCelebratedMilestone(db, milestone);
      return {
        title: `${milestone}-day streak! 🔥`,
        body: 'Consistency is the whole game. Take a bow.',
        tag: `langlearn-milestone-${milestone}`,
      };
    }
  }

  // 8. Comeback — 2+ days inactive
  if (!hasStudiedToday) {
    const lastActive = recentActivity
      .filter((a) => a.studySeconds > 0)
      .map((a) => a.date)
      .sort()
      .pop();
    if (lastActive) {
      const lastDate = new Date(lastActive + 'T00:00:00');
      const today = new Date(now.toISOString().slice(0, 10) + 'T00:00:00');
      const daysMissed = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
      if (daysMissed >= 2 && daysMissed <= 14) {
        return {
          title: 'Welcome back 🌱',
          body: `It's been ${daysMissed} days. Even 2 minutes today restarts the habit.`,
          tag: `langlearn-comeback-${now.toISOString().slice(0, 10)}`,
        };
      }
    }
  }

  return null;
}

// ─── Push handlers (Web Push from the worker) ───

interface PushPayload {
  title?: string;
  body?: string;
  tag?: string;
  url?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {};
  try {
    payload = (event.data?.json() as PushPayload) ?? {};
  } catch {
    const text = event.data?.text();
    if (text) payload = { title: 'LangLearn', body: text };
  }
  const title = payload.title ?? 'LangLearn';
  const body = payload.body ?? '';
  const tag = payload.tag ?? `langlearn-push-${Date.now()}`;
  const url = payload.url ?? '/LangLearn/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/LangLearn/pwa-192x192.png',
      badge: '/LangLearn/pwa-192x192.png',
      data: { url },
    }),
  );
});

// Browsers occasionally rotate push endpoints; when they do they fire this
// event with the new subscription. We can't talk to the worker from here
// (no VAPID key, no API URL — those live in the page bundle), so we just
// stash a flag the page can pick up on next launch and re-subscribe.
self.addEventListener('pushsubscriptionchange' as keyof ServiceWorkerGlobalScopeEventMap, ((event: Event) => {
  const ev = event as ExtendableEvent;
  ev.waitUntil((async () => {
    try {
      const db = await openDB();
      try {
        await putSettingValue(db, 'push-subscription-changed-at', String(Date.now()));
      } finally {
        db.close();
      }
    } catch {
      /* ignore */
    }
  })());
}) as EventListener);

// ─── Notification click handler ───

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || '/LangLearn/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if found
      for (const client of clients) {
        if (client.url.includes('/LangLearn/') && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      // Otherwise open new
      return self.clients.openWindow(url);
    })
  );
});

// ─── Skip waiting on install for faster updates ───
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
