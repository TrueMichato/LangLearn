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
      });
    });
  } else {
    new Notification(title, {
      icon: '/LangLearn/pwa-192x192.png',
      ...options,
    });
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
      minInterval: 4 * 60 * 60 * 1000, // 4 hours (browser decides actual frequency)
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

