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
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: '/LangLearn/pwa-192x192.png',
        badge: '/LangLearn/pwa-192x192.png',
        tag: notification.tag,
        data: { url: '/LangLearn/' },
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
  // 1. Daily cue — show if within 2h window of reminder time and haven't studied
  if (!hasStudiedToday) {
    const [rh, rm] = prefs.dailyReminderTime.split(':').map(Number);
    const reminderMin = rh * 60 + rm;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const diff = nowMin - reminderMin;
    // Show if we're 0-120 min past the reminder time (browser may wake SW late)
    if (diff >= 0 && diff <= 120) {
      return {
        title: 'Time to practice 🌱',
        body: `Your ${prefs.dailyGoalMinutes}-minute daily goal is waiting. Small steps build big habits.`,
        tag: `langlearn-daily-cue-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 2. Streak-at-risk — show in the evening (after 18:00) if no study today and streak ≥ min
  if (prefs.streakReminders && !hasStudiedToday && now.getHours() >= 18) {
    const recentActivity = await getRecentActivity(db, 30);
    const streak = calculateStreak(recentActivity);
    if (streak >= prefs.streakReminderMinDays) {
      return {
        title: `${streak}-day streak at risk 🔥`,
        body: `Even ${prefs.dailyGoalMinutes} minutes keeps it alive. You've got this.`,
        tag: `langlearn-streak-risk-${now.toISOString().slice(0, 10)}`,
      };
    }
  }

  // 3. Comeback — if no study in 2+ days
  if (!hasStudiedToday) {
    const recentActivity = await getRecentActivity(db, 14);
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
