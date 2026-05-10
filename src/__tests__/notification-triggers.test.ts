import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Module is loaded fresh per test so the dynamic feature-detection sees
// whatever globals we've stubbed for that test.
async function loadFresh() {
  vi.resetModules();
  return await import('../lib/notifications');
}

describe('notification triggers helpers', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;
  const originalNotification = (globalThis as { Notification?: unknown }).Notification;

  beforeEach(() => {
    // Reset globals before each test — start from a clean slate.
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { Notification?: unknown }).Notification;
  });

  afterEach(() => {
    if (originalWindow !== undefined) (globalThis as { window?: unknown }).window = originalWindow;
    else delete (globalThis as { window?: unknown }).window;
    if (originalNotification !== undefined) (globalThis as { Notification?: unknown }).Notification = originalNotification;
    else delete (globalThis as { Notification?: unknown }).Notification;
  });

  it('supportsNotificationTriggers returns false without window', async () => {
    const { supportsNotificationTriggers } = await loadFresh();
    expect(supportsNotificationTriggers()).toBe(false);
  });

  it('supportsNotificationTriggers returns false when only Notification but no TimestampTrigger', async () => {
    class FakeNotification {}
    (globalThis as Record<string, unknown>).window = {
      Notification: FakeNotification,
    };
    (globalThis as Record<string, unknown>).Notification = FakeNotification;
    const { supportsNotificationTriggers } = await loadFresh();
    expect(supportsNotificationTriggers()).toBe(false);
  });

  it('supportsNotificationTriggers returns true when both globals exist with showTrigger on prototype', async () => {
    class FakeNotification {}
    Object.defineProperty(FakeNotification.prototype, 'showTrigger', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    class FakeTimestampTrigger {
      ts: number;
      constructor(ts: number) {
        this.ts = ts;
      }
    }
    const win = {
      Notification: FakeNotification,
      TimestampTrigger: FakeTimestampTrigger,
    };
    (globalThis as Record<string, unknown>).window = win;
    (globalThis as Record<string, unknown>).Notification = FakeNotification;
    (globalThis as Record<string, unknown>).TimestampTrigger = FakeTimestampTrigger;
    const { supportsNotificationTriggers } = await loadFresh();
    expect(supportsNotificationTriggers()).toBe(true);
  });

  it('scheduleTriggeredNotification returns false when unsupported', async () => {
    const { scheduleTriggeredNotification } = await loadFresh();
    const ok = await scheduleTriggeredNotification('t', Date.now() + 1000, { tag: 'x' });
    expect(ok).toBe(false);
  });

  it('scheduleTriggeredNotification calls registration.showNotification with showTrigger when supported', async () => {
    class FakeNotification {
      static permission: NotificationPermission = 'granted';
    }
    Object.defineProperty(FakeNotification.prototype, 'showTrigger', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    class FakeTimestampTrigger {
      ts: number;
      constructor(ts: number) {
        this.ts = ts;
      }
    }

    const showNotification = vi.fn(async () => {});
    const fakeRegistration = { showNotification };

    const navigator = {
      serviceWorker: {
        ready: Promise.resolve(fakeRegistration),
      },
    };

    const win = {
      Notification: FakeNotification,
      TimestampTrigger: FakeTimestampTrigger,
    };
    (globalThis as Record<string, unknown>).window = win;
    (globalThis as Record<string, unknown>).Notification = FakeNotification;
    (globalThis as Record<string, unknown>).TimestampTrigger = FakeTimestampTrigger;
    Object.defineProperty(globalThis, 'navigator', {
      value: navigator,
      configurable: true,
      writable: true,
    });

    const { scheduleTriggeredNotification } = await loadFresh();
    const when = Date.now() + 60_000;
    const ok = await scheduleTriggeredNotification('hello', when, {
      body: 'world',
      tag: 'langlearn-test',
    });
    expect(ok).toBe(true);
    expect(showNotification).toHaveBeenCalledTimes(1);
    const calls = showNotification.mock.calls as unknown as Array<[string, Record<string, unknown>]>;
    const [title, opts] = calls[0];
    expect(title).toBe('hello');
    expect(opts.tag).toBe('langlearn-test');
    expect(opts.body).toBe('world');
    expect(opts.showTrigger).toBeInstanceOf(FakeTimestampTrigger);
    expect((opts.showTrigger as FakeTimestampTrigger).ts).toBe(when);
  });
});
