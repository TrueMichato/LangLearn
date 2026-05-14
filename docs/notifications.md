# Notifications architecture

LangLearn uses three layered mechanisms to deliver reminders. They sit on top
of each other from "always works" to "best effort":

| Tier | Mechanism | When it fires | Coverage |
| --- | --- | --- | --- |
| 1 | **Web Push (cloud reminders)** | Cron tick on the LangLearn worker | Every browser that supports Web Push, fully closed (Chromium, Firefox, iOS 16.4+ installed PWA) |
| 2 | **TimestampTrigger** | Browser pre-schedules notifications client-side | Chromium with `chrome://flags/#enable-experimental-web-platform-features` |
| 3 | **Periodic Background Sync** | OS wakes the SW periodically | Installed Chromium PWAs only, very best-effort |
| — | **In-app tick** | App is open | Always |

If tier 1 is configured (env vars set + worker deployed), the client suppresses
tier 2 to avoid double-firing. Tier 3 always registers — it's free belt and
suspenders on Chromium.

## Tier 1 — Cloud reminders (Web Push)

Implementation lives in [`infra/push-worker/`](../infra/push-worker/README.md)
(Cloudflare Workers + KV + cron) and in `src/lib/push-subscription.ts` on the
client.

### Setup

1. Deploy the worker — see `infra/push-worker/README.md`.
2. In the LangLearn repo root, create `.env.production` with:
   ```
   VITE_VAPID_PUBLIC=<base64url public key>
   VITE_PUSH_API_URL=https://langlearn-push.<account>.workers.dev
   ```
3. `npm run build` and redeploy GitHub Pages.

If those env vars are empty, the Settings UI hides the cloud-reminders toggle
and falls back to tier 2/3 only.

### Privacy

The worker stores per push subscription:

- `subscription` (endpoint URL + p256dh + auth keys, required by Web Push)
- `prefs` (the user's notification preferences)
- `state` (due-card count, current streak, today's study seconds & goal,
  weekly study seconds & goal, last-active date, celebrated milestones,
  in-app snoozes)
- A 7-day rolling fired-tag log so cron ticks don't re-fire a tag

**No vocabulary, no answers, no review history, no language content** ever
leaves the device. The Settings UI surfaces the same copy.

### Lifecycle

- **Subscribe**: when the user enables notifications and grants permission,
  `ensurePushSubscription` calls `pushManager.subscribe`, then `POST /api/subscribe`.
- **Sync**: any pref or state change fires a debounced `POST /api/sync`
  (1.5 s debounce). The hook also calls it on every visibilitychange→visible.
- **Cron**: every 15 minutes the worker iterates KV, runs the planner, sends
  Web Push for any due notification not already fired today, and updates
  `firedHistory[today]`.
- **Unsubscribe**: when the user toggles cloud reminders or master notifications
  off, `disablePush` calls `subscription.unsubscribe()` then `POST /api/unsubscribe`.
- **Endpoint rotation**: the SW handles `pushsubscriptionchange` by stashing a
  flag; the next page load re-subscribes via `ensurePushSubscription`.
- **Pruning**: subscriptions returning 404/410 are deleted on the next cron
  tick. Subscriptions that haven't sync'd in 30 days are also deleted.

### Test buttons

Settings → Notifications has three test buttons:

- **🔔 Send test notification (now)** — local `showNotification`, proves the
  permission/SW path works.
- **☁ Send a test push from the server** — `POST /api/test`, proves the
  full cloud loop works end-to-end. Visible only when cloud is configured
  and active.
- **⏱ Schedule test for 60 s** — uses TimestampTrigger; close the browser
  to verify tier 2 fires while-closed.

## Tier 2 — TimestampTrigger

`src/lib/notifications.ts` exposes `scheduleTriggeredNotification`. Up to 7
days of upcoming reminders are pre-registered; the browser fires them at the
scheduled wall-clock time even if the page and SW are closed. We reconcile
against `getNotifications({includeTriggered:true})` on every refresh and
cancel any tag that's no longer in the plan.

This path is suppressed when tier 1 is active (the worker delivers the same
notifications) but stays as fallback if the worker is unreachable.

## Tier 3 — Periodic Background Sync

`src/sw.ts` registers a `periodicsync` listener with tag
`langlearn-check-notifications`. The handler reads prefs/state from
IndexedDB and shows at most one notification per wake. Quiet hours and the
daily budget are enforced inside the SW. Wakes are recorded in
`db.settings['last-sync-wake']` so the Settings UI can show diagnostic info.

## In-app tick

`src/hooks/useNotificationScheduler.ts` runs `tickInApp` + `refreshNotifications`
every 5 minutes while the app is open, and on every visibilitychange→visible.
This is the only mechanism that *always* works (because the app is, by
definition, open).

## Timezones

Cloudflare Workers run in UTC. The notification planner schedules wall-clock
times (`dailyReminderTime`, quiet hours, hard-coded `19:00`/`19:30` evening
slots), so without TZ awareness everything would fire at the *UTC* wall-clock
— for a user in Israel (UTC+2/+3) that means a "09:00 reminder" arrives at
noon, and the `19:00` weekly digest lands at 22:00 right inside default quiet
hours and gets clamped out of the day.

To fix this, the client populates `prefs.timezone` from
`Intl.DateTimeFormat().resolvedOptions().timeZone` and includes it in every
`/api/subscribe` and `/api/sync` payload. Both planner copies (`src/lib/
notification-planner.ts` and `infra/push-worker/src/planner.ts`) use shared
TZ helpers in `tz.ts` (`partsInTz`, `wallClockToUtcMs`, `localDateKey`,
`daysBetweenIso`) to interpret all wall-clock math in the user's TZ. The
worker's `firedHistory` keys also roll over at the user's local midnight,
not UTC midnight.

If a user changes their OS timezone (or travels), they should open the app
once to re-sync `prefs.timezone` to the worker.

### Stale-state recovery

The worker's per-subscription `state` blob (`todayStudySeconds`, `todayGoalMet`,
`weekStudySeconds`, …) is only refreshed when the client calls `/api/sync`.
On days the user never opens the app, the persisted snapshot reflects
yesterday's numbers — `todayGoalMet=true` would suppress the streak-at-risk
nudge today. `processSubscription` therefore checks
`state.lastActiveDate < localDateKey(now, tz)` and constructs a planner-only
view that zeroes the day-scoped fields (and week-scoped fields when ≥7 days
have elapsed). The persisted record is left untouched so the next real sync
still merges truth.

## Files

- `src/lib/notifications.ts` — permission, supports/registers periodic sync,
  TimestampTrigger helpers, status enum (`cloud-active | triggers-active |
  sync-active | not-installed | not-registered | not-supported`)
- `src/lib/notification-scheduler.ts` — plan, schedule, reconcile, mirror
  prefs to IDB. `gatherState` is exported for the cloud sync payload.
- `src/lib/notification-planner.ts` — pure planner. Same logic the worker
  imports verbatim from `infra/push-worker/src/planner.ts`.
- `src/lib/push-subscription.ts` — cloud lifecycle: subscribe, sync,
  unsubscribe, test, last-worker-check getters.
- `src/sw.ts` — SW: periodic sync handler, push handler, click handler,
  pushsubscriptionchange.
- `src/hooks/useNotificationScheduler.ts` — wires it all together.
- `src/components/settings/NotificationSettings.tsx` — UI tier selector +
  cloud toggle + test buttons + privacy copy.
- `infra/push-worker/` — Cloudflare Worker (router + cron + KV + Web Push).
