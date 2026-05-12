# LangLearn push worker

A tiny Cloudflare Worker that delivers Web Push notifications to the LangLearn
PWA on a 15-minute cron schedule. Stores per-subscription prefs and state in
KV; runs the same notification planner the client uses.

## Why this exists

`TimestampTrigger` is gated behind an experimental Chrome flag and Periodic
Background Sync only fires sporadically on installed Chromium PWAs. Web Push is
the only mechanism that reliably delivers notifications when the app is fully
closed — and Web Push needs a server to sign and POST to the browser's push
endpoint. This worker is that server.

## What it stores

Per push subscription (key = SHA-1 of `subscription.endpoint`):

- The push subscription (`endpoint` + `p256dh` + `auth` keys)
- Notification preferences (the same `NotificationPrefs` the client uses)
- A small `state` blob: due-card count, current streak, today's study seconds
  & goal, week study seconds & goal, last-active date, celebrated milestones
- Per-day fired-tag log (last 7 days) so cron ticks don't re-fire a tag

**No** vocabulary, **no** review history, **no** language content is sent to or
stored on the worker. See the LangLearn Settings UI for the user-facing copy.

## Endpoints

All POST, JSON, CORS allowing origins listed in `ALLOWED_ORIGINS`.

| Path | Body | Purpose |
| --- | --- | --- |
| `POST /api/subscribe` | `{ subscription, prefs, state }` | Register or replace a subscription |
| `POST /api/sync` | `{ endpoint, prefs?, state? }` | Partial-merge update |
| `POST /api/unsubscribe` | `{ endpoint }` | Remove a subscription |
| `POST /api/test` | `{ endpoint }` | Send an immediate test push |
| `GET  /health` | — | Liveness probe |

The `subscription.endpoint` URL is unguessable and serves as the auth token —
this is the standard Web Push security model.

## Cron

`*/15 * * * *` — every 15 minutes, the worker:

1. Iterates KV with the `sub:` prefix.
2. For each subscription, runs `computeUpcomingNotifications(state, prefs, now)`.
3. Sends Web Push for any planned notification whose `whenMs <= now + 30s` and
   that hasn't already been fired today.
4. Updates `firedHistory[today]` and `lastWorkerCheck`.
5. Deletes subscriptions that 404/410 (browser dropped them) or that have not
   sync'd in 30 days (abandoned installs).

Free-tier cron minimum is every minute on Workers; 15 minutes matches the
planner's coarse time resolution and stays well under all quotas.

## First-time setup

You'll need a free Cloudflare account.

```bash
cd infra/push-worker
npm install

# 1. Authenticate
npx wrangler login

# 2. Generate VAPID keypair
npx web-push generate-vapid-keys --json > vapid.json
#   { "publicKey": "B...", "privateKey": "..." }
#   ⚠ Treat privateKey as a secret. Do NOT commit vapid.json.

# 3. Create the KV namespace and copy the printed ID
npx wrangler kv namespace create SUBS
# Paste the returned id into wrangler.toml under [[kv_namespaces]] → id

# 4. Set the public VAPID key + subject in wrangler.toml [vars]
#    VAPID_PUBLIC = "<publicKey from step 2>"
#    VAPID_SUBJECT = "mailto:you@example.com"
#    ALLOWED_ORIGINS = "https://truemichato.github.io,http://localhost:5173"

# 5. Set the private VAPID key as a secret (NEVER commit)
npx wrangler secret put VAPID_PRIVATE
# (paste privateKey when prompted)

# 6. Deploy
npx wrangler deploy
# → https://langlearn-push.<your-account>.workers.dev
```

Then in the LangLearn repo root, set the matching env vars for the Vite build:

```bash
# .env.production (or .env.local for dev)
VITE_VAPID_PUBLIC=<publicKey from step 2>
VITE_PUSH_API_URL=https://langlearn-push.<your-account>.workers.dev
```

Rebuild the client (`npm run build`) and redeploy GitHub Pages.

## Local development

```bash
# Worker (in infra/push-worker/)
npx wrangler dev          # serves http://localhost:8787

# Client (in repo root)
echo 'VITE_VAPID_PUBLIC=<publicKey>'        >> .env.local
echo 'VITE_PUSH_API_URL=http://localhost:8787' >> .env.local
npm run dev               # serves http://localhost:5173
```

Trigger the cron manually with `npx wrangler dev --test-scheduled` then hit
`http://localhost:8787/__scheduled?cron=*+*+*+*+*` from a browser.

## Troubleshooting

- **`401 unauthorized` from FCM/Mozilla** → `VAPID_PUBLIC` (vars) and the
  `applicationServerKey` baked into the client don't match. Re-deploy the
  client after rotating keys.
- **`404` / `410 Gone` from push endpoint** → subscription expired / user
  uninstalled. Worker auto-deletes these.
- **`/api/test` returns 200 but no notification** → the SW isn't registering
  the `push` listener. DevTools → Application → Service Workers → check the
  "Update" / "Unregister" cycle and confirm `src/sw.ts` shipped with a `push`
  handler.
- **iOS isn't receiving anything** → user must have installed the PWA
  ("Add to Home Screen") on iOS 16.4+. Web Push doesn't work in mobile
  Safari without install.
- **CORS error in console** → add the calling origin to `ALLOWED_ORIGINS`
  (comma-separated). Wildcard suffix supported, e.g. `http://localhost:*`.

## Code layout

```
src/
  index.ts    — fetch() router, scheduled() cron, KV access
  planner.ts  — verbatim port of src/lib/notification-planner.ts
  push.ts     — hand-rolled VAPID JWT (ES256) + AES128GCM (RFC 8291) sender
```

No third-party push libraries — everything is `crypto.subtle`. Keeps the
supply-chain attack surface to zero and the bundle under 30 KB.

## Costs

Free tier covers it comfortably:

- Workers free: 100 000 requests/day. 4 cron ticks/hour × 24 = 96/day, plus a
  handful of `/api/sync` from each user. Hundreds of users fit easily.
- KV free: 1 000 writes/day per namespace, 100 000 reads/day. One write per
  cron tick per active subscription.

If you grow past the free tier, the only real cost driver is KV writes. Halve
the cron frequency or batch state updates.
