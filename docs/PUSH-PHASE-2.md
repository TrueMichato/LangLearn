# Phase 2 — Web Push backend (not yet built)

Phase 1 ships TimestampTrigger-based scheduling and tightens periodic background sync. That covers Chromium with experimental flags + installed PWAs. It does **not** cover:

- iOS Safari (even installed PWAs on iOS 16.4+) — needs Web Push.
- Firefox desktop — needs Web Push.
- Stable Chrome without the experimental flag — falls back to best-effort periodic sync, which often never fires.

When Phase 1 isn't enough, build Phase 2: a tiny always-on backend that delivers Web Push.

## Architecture

```
[ Browser ]                          [ Cloudflare Worker ]
  ─ pushManager.subscribe ─────────► /api/subscribe
                                       └─► KV: subs[endpoint] = { sub, prefs }

  ─ unsubscribe ──────────────────► /api/unsubscribe
                                       └─► KV.delete(endpoint)

  ◄── push event ◄───── HTTP push ── Cron Trigger (every 15 min)
                                       ├─ for each sub in KV
                                       ├─ run pickNotification(prefs, state)
                                       └─ POST web-push to sub.endpoint
```

Per-user state (streak, due count, etc.) is computed client-side and pushed up alongside `prefs` whenever it changes — the worker is stateless aside from KV. This keeps the backend a pure delivery channel; LangLearn stays local-first.

## Pieces to build

1. **VAPID keypair**
   - `npx web-push generate-vapid-keys`
   - Public key shipped to client (env var `VITE_VAPID_PUBLIC`).
   - Private key as Worker secret (`wrangler secret put VAPID_PRIVATE`).

2. **Cloudflare Worker** (`infra/push-worker/`)
   - `wrangler.toml` with KV namespace `SUBS` and a Cron Trigger (`*/15 * * * *`).
   - `POST /api/subscribe` `{ subscription, prefs, state }` → `KV.put(subscription.endpoint, JSON.stringify(...))`.
   - `POST /api/state` `{ endpoint, state }` → updates the cached state used by the planner.
   - `POST /api/unsubscribe` `{ endpoint }` → `KV.delete(endpoint)`.
   - `scheduled(event)` handler iterates `KV.list()`, runs the planner, sends pushes via a Worker-compatible web-push lib (the npm `web-push` package depends on Node `crypto`; use `@negrel/webpush` or hand-rolled `crypto.subtle` + AES-GCM).

3. **Reuse the planner**
   - `src/lib/notification-planner.ts` is already pure. Copy it to the Worker repo, or publish it as a tiny shared package.
   - The current `sw.ts` `pickNotification` is structured the same way — port the logic, not the IDB plumbing.

4. **Client wiring**
   - On settings change, if `prefs.notificationsEnabled`:
     - `const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC })`
     - `POST /api/subscribe { subscription: sub, prefs, state }`
   - On disable: `await sub.unsubscribe(); POST /api/unsubscribe`.
   - Mirror `state` (due count, streak, last activity) on every meaningful change so the Worker plans accurately.

5. **Service worker `push` handler** (add to `src/sw.ts`)
   ```ts
   self.addEventListener('push', (event) => {
     const payload = event.data?.json() ?? {};
     event.waitUntil(self.registration.showNotification(payload.title, payload));
   });
   ```

6. **Privacy / user control**
   - "Disable cloud reminders" toggle → `unsubscribe()`. Make this clearly distinct from the in-app notification toggle so users can keep local triggers but opt out of the server.
   - Document in Settings: "Cloud reminders send your notification preferences and study summary stats to LangLearn's reminder server. No vocab, no answers."

## Effort estimate

- ~1 day for the Worker + KV + cron loop (most of it is porting `pickNotification` and getting the push crypto right on Workers).
- ~½ day for client subscribe/unsubscribe + SW push handler + Settings UI updates.
- ~½ day for testing across platforms (Android Chrome, iOS Safari installed PWA, Firefox desktop).

## Why we didn't build it for Phase 1

The user opted to try Phase 1's backendless improvements first. Phase 2 adds operational ownership (a Worker to maintain, a KV to back up, push crypto to keep healthy) — worth doing only if Phase 1 visibly underdelivers in production.
