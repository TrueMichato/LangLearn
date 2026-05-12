// Client-side push subscription lifecycle. Talks to the Cloudflare Worker
// described in `infra/push-worker/`.
//
// The worker URL and VAPID public key come from Vite env vars. If either is
// missing we treat cloud push as disabled — all functions become no-ops and
// `isCloudPushConfigured()` returns false so the UI can render the right tier.

import { db } from '../db/schema';
import type { FullPrefs } from './notification-scheduler';
import { gatherState } from './notification-scheduler';

const VAPID_PUBLIC_KEY: string = (import.meta.env.VITE_VAPID_PUBLIC ?? '').trim();
const PUSH_API_URL: string = (import.meta.env.VITE_PUSH_API_URL ?? '').replace(/\/$/, '').trim();

const ENDPOINT_KEY = 'push-endpoint';
const LAST_WORKER_CHECK_KEY = 'push-last-worker-check';
const LAST_SYNC_AT_KEY = 'push-last-sync-at';

let syncTimer: number | null = null;
const SYNC_DEBOUNCE_MS = 1500;

export function isCloudPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && PUSH_API_URL);
}

export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function subscriptionToJSON(sub: PushSubscription): PushSubscriptionJSON {
  // PushSubscription.toJSON omits expirationTime when null; we keep keys explicit
  // so the worker doesn't have to defensively check.
  const j = sub.toJSON();
  return {
    endpoint: j.endpoint!,
    expirationTime: j.expirationTime ?? null,
    keys: {
      p256dh: j.keys?.p256dh ?? '',
      auth: j.keys?.auth ?? '',
    },
  };
}

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function readSetting(key: string): Promise<string | null> {
  try {
    const row = await db.settings.get(key);
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function writeSetting(key: string, value: string): Promise<void> {
  try {
    await db.settings.put({ key, value });
  } catch {
    /* ignore */
  }
}

async function deleteSetting(key: string): Promise<void> {
  try {
    await db.settings.delete(key);
  } catch {
    /* ignore */
  }
}

/**
 * Build the state blob the worker stores per subscription. Mirrors the shape
 * the worker's planner expects (omitting `todayFiredCounts`, which the worker
 * derives from its own per-day fired-tag log).
 */
async function buildStateBlob(prefs: FullPrefs) {
  const s = await gatherState(prefs);
  // Strip `todayFiredCounts` — server tracks its own.
  return {
    dueCount: s.dueCount,
    currentStreak: s.currentStreak,
    todayGoalMet: s.todayGoalMet,
    todayStudySeconds: s.todayStudySeconds,
    dailyGoalSeconds: s.dailyGoalSeconds,
    weeklyGoalSeconds: s.weeklyGoalSeconds,
    weekStudySeconds: s.weekStudySeconds,
    weekProgress: s.weekProgress,
    lastActiveDate: s.lastActiveDate,
    celebratedMilestones: s.celebratedMilestones,
    snoozedUntil: s.snoozedUntil,
  };
}

async function postJson(path: string, body: unknown): Promise<Response | null> {
  if (!PUSH_API_URL) return null;
  try {
    return await fetch(PUSH_API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[LangLearn push] network error', err);
    return null;
  }
}

/**
 * Create or refresh the browser push subscription and POST it (plus prefs and
 * state) to the worker. Idempotent — safe to call on every app launch.
 *
 * Returns the endpoint URL on success, null on failure / when not configured.
 */
export async function ensurePushSubscription(prefs: FullPrefs): Promise<string | null> {
  if (!isCloudPushConfigured() || !isPushSupported()) return null;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;

  const registration = await getRegistration();
  if (!registration) return null;

  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    } catch (err) {
      console.warn('[LangLearn push] subscribe failed', err);
      return null;
    }
  }

  const json = subscriptionToJSON(sub);
  const state = await buildStateBlob(prefs);
  const res = await postJson('/api/subscribe', { subscription: json, prefs, state });
  if (!res || !res.ok) {
    console.warn('[LangLearn push] /api/subscribe failed', res?.status);
    return null;
  }
  try {
    const data = (await res.json()) as { lastWorkerCheck?: number };
    if (typeof data.lastWorkerCheck === 'number') {
      await writeSetting(LAST_WORKER_CHECK_KEY, String(data.lastWorkerCheck));
    }
  } catch { /* ignore */ }

  await writeSetting(ENDPOINT_KEY, json.endpoint);
  await writeSetting(LAST_SYNC_AT_KEY, String(Date.now()));
  return json.endpoint;
}

async function flushSync(prefs: FullPrefs): Promise<void> {
  const endpoint = await readSetting(ENDPOINT_KEY);
  if (!endpoint) return;
  const state = await buildStateBlob(prefs);
  const res = await postJson('/api/sync', { endpoint, prefs, state });
  if (res && res.status === 404) {
    // Worker doesn't know about this endpoint — re-subscribe.
    await deleteSetting(ENDPOINT_KEY);
    await ensurePushSubscription(prefs);
    return;
  }
  if (res?.ok) {
    try {
      const data = (await res.json()) as { lastWorkerCheck?: number };
      if (typeof data.lastWorkerCheck === 'number') {
        await writeSetting(LAST_WORKER_CHECK_KEY, String(data.lastWorkerCheck));
      }
    } catch { /* ignore */ }
    await writeSetting(LAST_SYNC_AT_KEY, String(Date.now()));
  }
}

/**
 * Debounced sync. Call freely on every state change — repeated calls within
 * `SYNC_DEBOUNCE_MS` collapse to a single network request.
 */
export function syncPushPrefs(prefs: FullPrefs): void {
  if (!isCloudPushConfigured()) return;
  if (syncTimer != null) {
    window.clearTimeout(syncTimer);
  }
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    void flushSync(prefs);
  }, SYNC_DEBOUNCE_MS);
}

/** Force an immediate sync (skipping the debounce). */
export async function syncPushPrefsNow(prefs: FullPrefs): Promise<void> {
  if (!isCloudPushConfigured()) return;
  if (syncTimer != null) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }
  await flushSync(prefs);
}

/** Tear down the current subscription locally and on the worker. */
export async function disablePush(): Promise<void> {
  const endpoint = await readSetting(ENDPOINT_KEY);
  await deleteSetting(ENDPOINT_KEY);
  await deleteSetting(LAST_WORKER_CHECK_KEY);
  await deleteSetting(LAST_SYNC_AT_KEY);

  if (isPushSupported()) {
    const registration = await getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    if (sub) {
      try { await sub.unsubscribe(); } catch { /* ignore */ }
    }
  }
  if (endpoint) {
    await postJson('/api/unsubscribe', { endpoint });
  }
}

/** Send a server-originated test push to the current subscription. */
export async function sendTestPush(): Promise<{ ok: boolean; message: string }> {
  if (!isCloudPushConfigured()) {
    return { ok: false, message: 'Cloud push is not configured for this build.' };
  }
  const endpoint = await readSetting(ENDPOINT_KEY);
  if (!endpoint) {
    return { ok: false, message: 'No active push subscription. Toggle notifications off and on to re-subscribe.' };
  }
  const res = await postJson('/api/test', { endpoint });
  if (!res) return { ok: false, message: 'Network error reaching push worker.' };
  if (res.ok) return { ok: true, message: 'Test push sent — should arrive within a few seconds.' };
  let detail = '';
  try {
    detail = JSON.stringify(await res.json());
  } catch { /* ignore */ }
  return { ok: false, message: `Worker returned ${res.status}. ${detail}` };
}

/** Read the timestamp the worker last ticked through this subscription. */
export async function getLastWorkerCheck(): Promise<number | null> {
  const v = await readSetting(LAST_WORKER_CHECK_KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Read the timestamp of the last successful client→worker sync. */
export async function getLastSyncAt(): Promise<number | null> {
  const v = await readSetting(LAST_SYNC_AT_KEY);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Is there a stored push endpoint for this install? */
export async function hasActivePushSubscription(): Promise<boolean> {
  const v = await readSetting(ENDPOINT_KEY);
  return !!v;
}
