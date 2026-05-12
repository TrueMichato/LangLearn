// Cloudflare Worker entrypoint for LangLearn push.
//
// Endpoints (all POST, JSON):
//   /api/subscribe   — register or replace a push subscription
//   /api/sync        — partial-merge prefs and/or state
//   /api/unsubscribe — delete a subscription
//   /api/test        — send a one-off test push to the caller's subscription
//
// Cron trigger (`*/15 * * * *`): iterate subscriptions, run the planner,
// dispatch any due notifications via Web Push, and update per-subscription
// fired-tag bookkeeping.

import {
  computeUpcomingNotifications,
  type NotificationPrefs,
  type SchedulerState,
  type ScheduledNotification,
  type NotificationCategory,
} from './planner';
import {
  sendWebPush,
  type PushSubscriptionJSON,
  type VapidConfig,
} from './push';

interface Env {
  SUBS: KVNamespace;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGINS: string;
}

interface SubscriptionRecord {
  subscription: PushSubscriptionJSON;
  prefs: NotificationPrefs;
  state: Omit<SchedulerState, 'todayFiredCounts'>;
  /** Per-day fired tag log so the planner enforces the daily budget across cron ticks. */
  firedHistory: Record<string, string[]>; // YYYY-MM-DD -> tags[]
  updatedAt: number;
  lastWorkerCheck: number;
}

const SUB_PREFIX = 'sub:';
const HISTORY_RETENTION_DAYS = 7;

// ────────────────────────── helpers ──────────────────────────

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function trimHistory(h: Record<string, string[]>, now = new Date()): Record<string, string[]> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - HISTORY_RETENTION_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(h)) {
    if (k >= cutoffKey) out[k] = v;
  }
  return out;
}

function todayFiredCounts(history: Record<string, string[]>, now: Date): Partial<Record<NotificationCategory, number>> {
  const tags = history[todayKey(now)] ?? [];
  const counts: Partial<Record<NotificationCategory, number>> = {};
  for (const tag of tags) {
    const cat = inferCategory(tag);
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

function inferCategory(tag: string): NotificationCategory | null {
  if (tag.startsWith('daily-cue-')) return 'daily-cue';
  if (tag.startsWith('cards-due-')) return 'cards-due';
  if (tag.startsWith('streak-at-risk-')) return 'streak-at-risk';
  if (tag.startsWith('comeback-')) return 'comeback';
  if (tag.startsWith('slipping-')) return 'slipping';
  if (tag.startsWith('daily-goal-met-')) return 'daily-goal-met';
  if (tag.startsWith('weekly-digest-')) return 'weekly-digest';
  if (tag.startsWith('streak-milestone-')) return 'streak-milestone';
  return null;
}

function bufToHex(buf: Uint8Array): string {
  let s = '';
  for (let i = 0; i < buf.length; i++) s += buf[i].toString(16).padStart(2, '0');
  return s;
}

async function endpointToKeyAsync(endpoint: string): Promise<string> {
  const data = new TextEncoder().encode(endpoint);
  const buf = await crypto.subtle.digest('SHA-1', data);
  return SUB_PREFIX + bufToHex(new Uint8Array(buf));
}

function vapidConfig(env: Env): VapidConfig {
  return {
    publicKey: env.VAPID_PUBLIC,
    privateKey: env.VAPID_PRIVATE,
    subject: env.VAPID_SUBJECT,
  };
}

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  // Wildcard host suffix support: an entry like "http://localhost:*" matches
  // any port on http://localhost.
  const matches = (entry: string, ori: string): boolean => {
    if (entry === ori) return true;
    if (entry.endsWith(':*')) {
      const prefix = entry.slice(0, -1); // drop the *
      return ori.startsWith(prefix);
    }
    return false;
  };
  const allowOrigin = origin && allowed.some((a) => matches(a, origin)) ? origin : '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowOrigin) headers['Access-Control-Allow-Origin'] = allowOrigin;
  return headers;
}

function jsonResponse(body: unknown, status: number, env: Env, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, origin),
    },
  });
}

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

function buildPushPayload(n: ScheduledNotification): {
  title: string;
  body: string;
  tag: string;
  url: string;
} {
  let url = '/LangLearn/';
  if (n.tag.startsWith('cards-due') || n.tag.startsWith('daily-cue')) url = '/LangLearn/#/review';
  else if (n.tag.startsWith('weekly-digest') || n.tag.startsWith('slipping')) url = '/LangLearn/#/analytics';
  return { title: n.title, body: n.body, tag: `langlearn-${n.tag}`, url };
}

// ────────────────────────── HTTP handler ──────────────────────────

const handler: ExportedHandler<Env> = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true }, 200, env, origin);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'method not allowed' }, 405, env, origin);
    }

    switch (url.pathname) {
      case '/api/subscribe':
        return handleSubscribe(req, env, origin);
      case '/api/sync':
        return handleSync(req, env, origin);
      case '/api/unsubscribe':
        return handleUnsubscribe(req, env, origin);
      case '/api/test':
        return handleTest(req, env, origin);
      default:
        return jsonResponse({ error: 'not found' }, 404, env, origin);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};

export default handler;

// ────────────────────────── endpoints ──────────────────────────

interface SubscribePayload {
  subscription: PushSubscriptionJSON;
  prefs: NotificationPrefs;
  state: Omit<SchedulerState, 'todayFiredCounts'>;
}

async function handleSubscribe(req: Request, env: Env, origin: string | null): Promise<Response> {
  const body = await readJson<SubscribePayload>(req);
  if (!body || !body.subscription?.endpoint || !body.subscription.keys?.p256dh || !body.subscription.keys?.auth) {
    return jsonResponse({ error: 'invalid subscription' }, 400, env, origin);
  }
  if (!body.prefs || typeof body.prefs.notificationsEnabled !== 'boolean') {
    return jsonResponse({ error: 'invalid prefs' }, 400, env, origin);
  }

  const key = await endpointToKeyAsync(body.subscription.endpoint);
  const existingRaw = await env.SUBS.get(key);
  const existing = existingRaw ? (JSON.parse(existingRaw) as SubscriptionRecord) : null;

  const record: SubscriptionRecord = {
    subscription: body.subscription,
    prefs: body.prefs,
    state: body.state,
    firedHistory: existing?.firedHistory ?? {},
    updatedAt: Date.now(),
    lastWorkerCheck: existing?.lastWorkerCheck ?? 0,
  };

  await env.SUBS.put(key, JSON.stringify(record));
  return jsonResponse({ ok: true, lastWorkerCheck: record.lastWorkerCheck }, 200, env, origin);
}

interface SyncPayload {
  endpoint: string;
  prefs?: NotificationPrefs;
  state?: Omit<SchedulerState, 'todayFiredCounts'>;
}

async function handleSync(req: Request, env: Env, origin: string | null): Promise<Response> {
  const body = await readJson<SyncPayload>(req);
  if (!body?.endpoint) return jsonResponse({ error: 'invalid request' }, 400, env, origin);

  const key = await endpointToKeyAsync(body.endpoint);
  const raw = await env.SUBS.get(key);
  if (!raw) return jsonResponse({ error: 'unknown subscription' }, 404, env, origin);
  const record = JSON.parse(raw) as SubscriptionRecord;

  if (body.prefs) record.prefs = body.prefs;
  if (body.state) record.state = body.state;
  record.updatedAt = Date.now();
  await env.SUBS.put(key, JSON.stringify(record));
  return jsonResponse({ ok: true, lastWorkerCheck: record.lastWorkerCheck }, 200, env, origin);
}

async function handleUnsubscribe(req: Request, env: Env, origin: string | null): Promise<Response> {
  const body = await readJson<{ endpoint: string }>(req);
  if (!body?.endpoint) return jsonResponse({ error: 'invalid request' }, 400, env, origin);
  const key = await endpointToKeyAsync(body.endpoint);
  await env.SUBS.delete(key);
  return jsonResponse({ ok: true }, 200, env, origin);
}

async function handleTest(req: Request, env: Env, origin: string | null): Promise<Response> {
  const body = await readJson<{ endpoint: string }>(req);
  if (!body?.endpoint) return jsonResponse({ error: 'invalid request' }, 400, env, origin);
  const key = await endpointToKeyAsync(body.endpoint);
  const raw = await env.SUBS.get(key);
  if (!raw) return jsonResponse({ error: 'unknown subscription' }, 404, env, origin);
  const record = JSON.parse(raw) as SubscriptionRecord;

  const result = await sendWebPush(
    record.subscription,
    {
      title: 'LangLearn cloud test ✅',
      body: 'Push from the server is working — you\'ll get reminders even when the app is closed.',
      tag: 'langlearn-cloud-test',
      url: '/LangLearn/',
    },
    vapidConfig(env),
  );
  if (result.gone) {
    await env.SUBS.delete(key);
  }
  return jsonResponse(
    { ok: result.ok, status: result.status, gone: result.gone, bodyText: result.bodyText },
    result.ok ? 200 : 502,
    env,
    origin,
  );
}

// ────────────────────────── cron ──────────────────────────

async function runCron(env: Env): Promise<void> {
  const now = new Date();
  let cursor: string | undefined;
  do {
    const list = await env.SUBS.list({ prefix: SUB_PREFIX, cursor, limit: 1000 });
    for (const k of list.keys) {
      try {
        await processSubscription(env, k.name, now);
      } catch (err) {
        console.error('processSubscription failed', k.name, err);
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
}

async function processSubscription(env: Env, key: string, now: Date): Promise<void> {
  const raw = await env.SUBS.get(key);
  if (!raw) return;
  const record = JSON.parse(raw) as SubscriptionRecord;

  // Stale subscription pruning — no client sync in 30 days = abandoned.
  const ageMs = Date.now() - record.updatedAt;
  if (ageMs > 30 * 24 * 60 * 60 * 1000) {
    await env.SUBS.delete(key);
    return;
  }

  if (!record.prefs.notificationsEnabled) {
    record.lastWorkerCheck = Date.now();
    await env.SUBS.put(key, JSON.stringify(record));
    return;
  }

  const state: SchedulerState = {
    ...record.state,
    todayFiredCounts: todayFiredCounts(record.firedHistory, now),
  };

  const planned = computeUpcomingNotifications(state, record.prefs, now);
  const today = todayKey(now);
  const firedToday = new Set(record.firedHistory[today] ?? []);

  for (const n of planned) {
    if (firedToday.has(n.tag)) continue;
    // Only deliver notifications that are due now or in the past — future
    // ones will be picked up by a later cron tick.
    if (n.whenMs > now.getTime() + 30_000) continue;

    const result = await sendWebPush(record.subscription, buildPushPayload(n), vapidConfig(env));
    if (result.gone) {
      await env.SUBS.delete(key);
      return;
    }
    if (!result.ok) {
      console.warn('push send failed', { status: result.status, tag: n.tag });
      continue;
    }
    firedToday.add(n.tag);
  }

  record.firedHistory[today] = Array.from(firedToday);
  record.firedHistory = trimHistory(record.firedHistory, now);
  record.lastWorkerCheck = Date.now();
  // Always persist so lastWorkerCheck advances — the UI uses it to show
  // freshness, and clients ask for it back via the next /api/sync response.
  await env.SUBS.put(key, JSON.stringify(record));
}
