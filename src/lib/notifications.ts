export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function supportsNotificationTriggers(): boolean {
  if (!isNotificationSupported()) return false;
  // Chromium-only experimental API
  return (
    typeof window !== 'undefined' &&
    'TimestampTrigger' in window &&
    'showTrigger' in (Notification.prototype as object)
  );
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

/**
 * Schedule a notification for a future timestamp. Uses the experimental
 * Notification Triggers API where available so it fires even when the app
 * is closed; otherwise returns false (caller should fall back to in-app
 * scheduling / catch-up).
 */
export async function scheduleNotification(
  title: string,
  whenMs: number,
  options?: NotificationOptions
): Promise<boolean> {
  if (!supportsNotificationTriggers()) return false;
  if (Notification.permission !== 'granted') return false;
  const registration = await getRegistration();
  if (!registration) return false;
  try {
    // TimestampTrigger is non-standard; cast through any to satisfy TS.
    const TimestampTriggerCtor = (window as unknown as {
      TimestampTrigger: new (ts: number) => unknown;
    }).TimestampTrigger;
    await registration.showNotification(title, {
      icon: '/LangLearn/pwa-192x192.png',
      badge: '/LangLearn/pwa-192x192.png',
      ...options,
      // @ts-expect-error showTrigger is not in the standard NotificationOptions type
      showTrigger: new TimestampTriggerCtor(whenMs),
    });
    return true;
  } catch {
    return false;
  }
}

/** Cancel any pending (scheduled or shown) notifications matching a tag. */
export async function cancelNotificationsByTag(tag: string): Promise<void> {
  const registration = await getRegistration();
  if (!registration) return;
  try {
    // includeTriggered: true returns scheduled-but-not-yet-shown notifications
    // in browsers that support Notification Triggers.
    const list = await registration.getNotifications({
      tag,
      // @ts-expect-error includeTriggered is non-standard
      includeTriggered: true,
    });
    list.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

