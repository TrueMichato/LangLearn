/**
 * Applying a service worker update, defensively.
 *
 * The happy path is simply "message the waiting worker, it calls skipWaiting(),
 * the browser swaps the controller and we reload". Two states break that path,
 * and both of them look identical to a user: the banner sits there and the
 * Update button appears to do nothing.
 *
 *  1. There is no waiting worker at all. A worker that calls skipWaiting() in
 *     its install handler self-activates, but workbox may already have raised
 *     its `waiting` event (it only suppresses that event when activation lands
 *     within 200ms). The prompt is then attached to a worker that has moved on.
 *
 *  2. The waiting worker predates the SKIP_WAITING message handler, so it
 *     ignores the message and keeps waiting for every tab to close. Reloading
 *     does not release the client, so it stays stuck across refreshes.
 *
 * `applyUpdate` detects both and always makes progress, unregistering the
 * stale registration as a last resort so the next load installs the current
 * build from the network.
 */

export const UPDATE_APPLIED_KEY = 'langlearn-update-applied';

/** How long to give the browser to swap controllers before we assume the
 *  waiting worker is never going to hand over. */
export const CONTROLLER_CHANGE_TIMEOUT_MS = 5000;

export type UpdateOutcome =
  /** The waiting worker took over — a normal, clean update. */
  | 'activated'
  /** The waiting worker ignored us; we dropped the registration to recover. */
  | 'recovered'
  /** Nothing was waiting and nothing took over; reload and move on. */
  | 'reloaded';

export interface UpdateEnvironment {
  getRegistration: () => Promise<ServiceWorkerRegistration | null>;
  waitForControllerChange: (timeoutMs: number) => Promise<boolean>;
  isOnline: () => boolean;
  reload: () => void;
  markApplied: () => void;
}

export async function applyUpdate(env: UpdateEnvironment): Promise<UpdateOutcome> {
  const registration = await env.getRegistration();
  if (!registration) {
    env.reload();
    return 'reloaded';
  }

  // Start listening before we prod the worker, so we cannot miss the swap.
  const controllerChanged = env.waitForControllerChange(CONTROLLER_CHANGE_TIMEOUT_MS);

  if (!registration.waiting) {
    // The prompt can outlive the worker it referred to. Re-check for a build
    // newer than whatever is running before giving up on it.
    try {
      await registration.update();
    } catch {
      /* offline or the check failed — carry on with what we have */
    }
  }
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });

  if (await controllerChanged) {
    env.markApplied();
    env.reload();
    return 'activated';
  }

  if (registration.waiting && env.isOnline()) {
    // Stuck worker. It will never hand over while this client is open, so drop
    // the registration entirely — the reload below then installs the current
    // build fresh. Only safe online, since it also drops the offline cache.
    try {
      await registration.unregister();
    } catch {
      /* ignore — the reload is still worth attempting */
    }
    env.markApplied();
    env.reload();
    return 'recovered';
  }

  env.reload();
  return 'reloaded';
}

// ─── Browser bindings ───

export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

export async function hasWaitingWorker(): Promise<boolean> {
  const registration = await getRegistration();
  return !!registration?.waiting;
}

function waitForControllerChange(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (changed: boolean) => {
      if (settled) return;
      settled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
      window.clearTimeout(timer);
      resolve(changed);
    };
    const onChange = () => finish(true);
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    const timer = window.setTimeout(() => finish(false), timeoutMs);
  });
}

export function browserUpdateEnvironment(): UpdateEnvironment {
  return {
    getRegistration,
    waitForControllerChange,
    isOnline: () => navigator.onLine !== false,
    reload: () => window.location.reload(),
    markApplied: () => {
      try {
        sessionStorage.setItem(UPDATE_APPLIED_KEY, '1');
      } catch {
        /* private mode — the confirmation is a nicety, not a requirement */
      }
    },
  };
}

/** Reads and clears the "an update was just applied" flag set before reloading. */
export function consumeUpdateApplied(): boolean {
  try {
    if (sessionStorage.getItem(UPDATE_APPLIED_KEY) !== '1') return false;
    sessionStorage.removeItem(UPDATE_APPLIED_KEY);
    return true;
  } catch {
    return false;
  }
}
