/**
 * Asking the browser not to throw the learner's progress away.
 *
 * Every byte of LangLearn progress lives in IndexedDB and localStorage on the
 * learner's own device. Both are "script-writable storage", which browsers are
 * free to evict: Chrome under storage pressure, and Safari after roughly seven
 * days without a visit. An evicted learner loses their streak, their vocabulary
 * and their review history with no warning and no way back — the app simply
 * starts over.
 *
 * `navigator.storage.persist()` is the only defence. It is a request, not a
 * command, and browsers answer it differently:
 *
 *  - Chrome/Edge grant it silently once the site looks "engaged" (installed as
 *    a PWA, bookmarked, or with enough interaction history).
 *  - Firefox prompts the user.
 *  - Safari/iOS never grants it to a plain tab. Installing the PWA to the home
 *    screen is what actually exempts the data from eviction there.
 *
 * So the honest UX is: ask once per session, report what we actually got, and
 * when we are denied, tell the learner to install the app rather than implying
 * their data is safe.
 */

export type PersistenceState =
  /** The browser guarantees the data survives until the user deletes it. */
  | 'persisted'
  /** We asked and were refused — data is evictable. */
  | 'denied'
  /** The browser has no Storage Manager; we cannot ask or know. */
  | 'unsupported'
  /** We have not asked yet this session. */
  | 'unknown';

export interface StorageEstimate {
  usageBytes: number | null;
  quotaBytes: number | null;
}

export interface PersistenceEnvironment {
  /** Whether `navigator.storage` with persist support exists at all. */
  isSupported: () => boolean;
  /** Current grant status, without asking. */
  isPersisted: () => Promise<boolean>;
  /** Ask for the grant. Resolves to the resulting status. */
  requestPersist: () => Promise<boolean>;
}

/**
 * Whether it is worth calling `persist()`.
 *
 * Re-asking when already granted is a wasted round trip, and asking on a
 * browser without the API throws. Note that we *do* re-ask after a denial:
 * grants are re-evaluated as engagement grows, so a learner who installs the
 * PWA or simply keeps coming back can be granted on a later visit. The call is
 * cheap and silent everywhere except Firefox, which only prompts once.
 */
export function shouldRequestPersistence(
  state: Pick<PersistenceEnvironment, never> & { supported: boolean; alreadyPersisted: boolean },
): boolean {
  if (!state.supported) return false;
  return !state.alreadyPersisted;
}

/** Map a support flag and grant result onto the state the UI reports. */
export function resolvePersistenceState(supported: boolean, granted: boolean): PersistenceState {
  if (!supported) return 'unsupported';
  return granted ? 'persisted' : 'denied';
}

/**
 * Ask for persistent storage if it is worth asking, and report where we landed.
 * Never throws — a failure to secure storage must not stop the app from booting.
 */
export async function ensurePersistentStorage(
  env: PersistenceEnvironment,
): Promise<PersistenceState> {
  try {
    const supported = env.isSupported();
    if (!supported) return 'unsupported';

    const alreadyPersisted = await env.isPersisted();
    if (!shouldRequestPersistence({ supported, alreadyPersisted })) {
      return resolvePersistenceState(supported, alreadyPersisted);
    }

    const granted = await env.requestPersist();
    return resolvePersistenceState(supported, granted);
  } catch {
    // A browser that rejects the call outright tells us nothing useful; treat
    // it as "we could not find out" rather than reporting a false denial.
    return 'unknown';
  }
}

// ─── Browser bindings ───

export function browserPersistenceEnvironment(): PersistenceEnvironment {
  return {
    isSupported: () =>
      typeof navigator !== 'undefined' &&
      !!navigator.storage &&
      typeof navigator.storage.persist === 'function' &&
      typeof navigator.storage.persisted === 'function',
    isPersisted: () => navigator.storage.persisted(),
    requestPersist: () => navigator.storage.persist(),
  };
}

/** How much of the origin's quota the learner is using, for the Settings panel. */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  try {
    if (
      typeof navigator === 'undefined' ||
      !navigator.storage ||
      typeof navigator.storage.estimate !== 'function'
    ) {
      return { usageBytes: null, quotaBytes: null };
    }
    const estimate = await navigator.storage.estimate();
    return {
      usageBytes: estimate.usage ?? null,
      quotaBytes: estimate.quota ?? null,
    };
  } catch {
    return { usageBytes: null, quotaBytes: null };
  }
}

/** Human-readable byte size, e.g. "4.2 MB". */
export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unitIndex]}`;
}

/** Whether the app is running as an installed PWA rather than a browser tab. */
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = (window.navigator as { standalone?: boolean }).standalone;
  if (standalone === true) return true;
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false;
}
