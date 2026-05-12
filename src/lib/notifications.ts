export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/LangLearn/pwa-192x192.png',
        badge: '/LangLearn/pwa-192x192.png',
        ...options,
      }).catch((err) => {
        console.warn('[LangLearn] SW showNotification failed:', err);
        // Fallback to Notification API
        try {
          new Notification(title, { icon: '/LangLearn/pwa-192x192.png', ...options });
        } catch { /* ignore */ }
      });
    }).catch((err) => {
      console.warn('[LangLearn] SW ready failed:', err);
    });
  } else {
    try {
      new Notification(title, {
        icon: '/LangLearn/pwa-192x192.png',
        ...options,
      });
    } catch (err) {
      console.warn('[LangLearn] Notification constructor failed:', err);
    }
  }
}

/** Cancel any pending/shown notifications matching a tag. */
export async function cancelNotificationsByTag(tag: string): Promise<void> {
  const registration = await getRegistration();
  if (!registration) return;
  try {
    const list = await registration.getNotifications({ tag });
    list.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

// ─── Periodic Background Sync ───

export function supportsPeriodicSync(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;
  return 'periodicSync' in (ServiceWorkerRegistration.prototype);
}

export async function isPeriodicSyncRegistered(): Promise<boolean> {
  if (!supportsPeriodicSync()) return false;
  const registration = await getRegistration();
  if (!registration) return false;
  try {
    const tags = await (registration as unknown as { periodicSync: { getTags(): Promise<string[]> } }).periodicSync.getTags();
    return tags.includes('langlearn-check-notifications');
  } catch {
    return false;
  }
}

/**
 * Register periodic background sync. Browser wakes the SW periodically
 * (min ~4h for high-engagement sites) so it can check state and show notifications.
 * Only works on Chromium with PWA installed.
 * Returns true if registration succeeded.
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!supportsPeriodicSync()) return false;
  const registration = await getRegistration();
  if (!registration) return false;
  try {
    const ps = (registration as unknown as {
      periodicSync: { register(tag: string, opts: { minInterval: number }): Promise<void> };
    }).periodicSync;
    await ps.register('langlearn-check-notifications', {
      minInterval: 60 * 60 * 1000, // 1 hour hint (browser enforces its own floor; lower hint = sooner wake when budget allows)
    });
    return true;
  } catch {
    // Permission denied or not supported in this context
    return false;
  }
}

export async function unregisterPeriodicSync(): Promise<void> {
  if (!supportsPeriodicSync()) return;
  const registration = await getRegistration();
  if (!registration) return;
  try {
    const ps = (registration as unknown as {
      periodicSync: { unregister(tag: string): Promise<void> };
    }).periodicSync;
    await ps.unregister('langlearn-check-notifications');
  } catch {
    // ignore
  }
}

// ─── Notification Triggers (TimestampTrigger) ───
//
// When supported (Chromium with experimental-web-platform-features flag, or
// some Chromium variants by default), we can pre-schedule a notification with
// `showTrigger: new TimestampTrigger(whenMs)`. The browser fires it at the
// scheduled wall-clock time even if the SW has been evicted and the page is
// closed. This is the only "while-closed" mechanism available without a
// server, so we use it as the primary path on supported browsers.

export function supportsNotificationTriggers(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  // The spec exposes TimestampTrigger as a global constructor and lists
  // `showTrigger` in the NotificationOptions. Some Chromium versions expose
  // one without the other — require both.
  return (
    'TimestampTrigger' in window &&
    'showTrigger' in (Notification.prototype as unknown as Record<string, unknown>)
  );
}

interface TriggeredNotificationOptions extends NotificationOptions {
  showTrigger?: unknown;
}

/**
 * Schedule a notification to fire at `whenMs` (wall-clock). Uses
 * TimestampTrigger so the browser fires it even if the SW/page is closed.
 *
 * Returns true if the trigger was registered, false otherwise (caller can
 * fall back to other mechanisms).
 */
export async function scheduleTriggeredNotification(
  title: string,
  whenMs: number,
  options: NotificationOptions & { tag: string },
): Promise<boolean> {
  if (!supportsNotificationTriggers()) return false;
  if (Notification.permission !== 'granted') return false;
  const registration = await getRegistration();
  if (!registration) return false;

  try {
    const TriggerCtor = (window as unknown as {
      TimestampTrigger: new (timestamp: number) => unknown;
    }).TimestampTrigger;
    const opts: TriggeredNotificationOptions = {
      icon: '/LangLearn/pwa-192x192.png',
      badge: '/LangLearn/pwa-192x192.png',
      ...options,
      showTrigger: new TriggerCtor(whenMs),
    };
    await registration.showNotification(title, opts as NotificationOptions);
    return true;
  } catch (err) {
    console.warn('[LangLearn] scheduleTriggeredNotification failed:', err);
    return false;
  }
}

/**
 * List currently-pending notifications that have a `showTrigger` set
 * (i.e. were registered via TimestampTrigger and have not yet fired).
 * Used to dedupe and clean up stale triggers across plan refreshes.
 */
export async function listPendingTriggeredTags(prefix?: string): Promise<string[]> {
  if (!supportsNotificationTriggers()) return [];
  const registration = await getRegistration();
  if (!registration) return [];
  try {
    const all = await registration.getNotifications({ includeTriggered: true } as unknown as GetNotificationOptions);
    return all
      .filter((n) => 'showTrigger' in n && (n as unknown as { showTrigger?: unknown }).showTrigger != null)
      .map((n) => n.tag)
      .filter((tag): tag is string => !!tag && (!prefix || tag.startsWith(prefix)));
  } catch {
    return [];
  }
}

export type BackgroundNotifStatus =
  | 'cloud-active'      // Web Push from our own worker — works on every browser, fully closed
  | 'triggers-active'   // Notification Triggers — closed-app reliable
  | 'sync-active'       // Periodic sync registered (best effort)
  | 'not-installed'     // Browser supports periodic sync but PWA not installed
  | 'not-registered'    // Installed but registration pending/failed
  | 'not-supported';    // Browser doesn't support either path

/** Determine the current background notification capability status.
 *  `cloudActive` should be true when the page has a registered push
 *  subscription with the worker. Caller checks via `hasActivePushSubscription`. */
export async function getBackgroundNotificationStatus(cloudActive = false): Promise<BackgroundNotifStatus> {
  if (cloudActive && Notification.permission === 'granted') return 'cloud-active';

  // Triggers next — useful when cloud isn't active.
  if (supportsNotificationTriggers() && Notification.permission === 'granted') {
    return 'triggers-active';
  }

  if (!supportsPeriodicSync()) return 'not-supported';

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  if (!isInstalled) return 'not-installed';

  const registered = await isPeriodicSyncRegistered();
  return registered ? 'sync-active' : 'not-registered';
}

/** Read the last time the SW was woken by periodic sync (from IDB).
 *  Returns null if never recorded or unsupported. */
export async function getLastSyncWake(): Promise<number | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('LangLearnDB');
      req.onsuccess = () => {
        const db = req.result;
        try {
          const tx = db.transaction('settings', 'readonly');
          const store = tx.objectStore('settings');
          const get = store.get('last-sync-wake');
          get.onsuccess = () => {
            const val = get.result?.value;
            if (!val) {
              resolve(null);
            } else {
              const n = Number(val);
              resolve(Number.isFinite(n) ? n : null);
            }
            db.close();
          };
          get.onerror = () => {
            resolve(null);
            db.close();
          };
        } catch {
          resolve(null);
          try { db.close(); } catch { /* ignore */ }
        }
      };
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => {
        // Don't create stores here — bail.
        req.transaction?.abort();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

