# LangLearn encrypted checkpoint service

Independent Cloudflare Worker `langlearn-backup`, with one **SQLite-backed
Durable Object per UUID vault**. No R2, KV, push-worker binding, OIDC, GitHub PAT,
or administrator credential is needed in the app. No production resource has
been provisioned by the local tests. Deployment requires the account owner's
authorization and working Cloudflare login. The owner can sign in or
reauthenticate when needed; unattended retries or account creation are not
workarounds for missing owner authorization or a failed login.

## Trust and recovery boundary

The browser creates independent random 32-byte read/write bearer capabilities
and an AES-256-GCM key. Save the recovery kit independently of this browser
before relying on the service. Only SHA-256 capability hashes are stored by the
server. Enrollment requires a server-only `ENROLLMENT_SECRET`; the owner enters
it once to authorize creating a vault, and the app must not persist it.
Enrollment is not a login/account system.

The Worker stores opaque full encrypted checkpoints, never plaintext learning
content or the decryption key. It checks structure, digest, compare-and-swap
(CAS), and **declared** progress-row counts. It cannot verify AEAD, decrypt,
validate application data, or know that a nonempty checkpoint is actually
useful. A successful POST is **storage acceptance**, not a verified restore.
The browser must decrypt with authenticated metadata and fully validate the
backup before changing local data.

Read capability permits listing/downloading; write capability only appends.
Neither exposes deletion, overwrite, retention override, token rotation, or a
public disable/lock route. An initially empty checkpoint is allowed, but the
first *declared nonempty* checkpoint gets the permanent baseline pin. A later
zero-row upload is always rejected, including with history-decrease confirmation.
Decreases to nonzero counts require the explicit confirmation header.

A stolen read token exposes ciphertext and metadata, not the AES key. A stolen
write token can append junk, consume capacity, and affect future anchors; it
cannot directly remove the baseline pin. XSS can steal browser-held capabilities
and keys. The vault is not a defense against a compromised browser or account
administrator.

## Local setup and verification

Use a supported Node version (Node 24.11 tested), available on your `PATH`.

From `infra/backup-worker`:

```sh
gh cfs -- npm ci
gh cfs -- npm run typecheck
gh cfs -- npm test
gh cfs -- npm run build
```

`.npmrc` and the lock route dependency installation through CFS. Never bypass
CFS on authentication/feed failure. `build` is a **dry-run** bundle, not a
deployment. The service has no runtime npm dependencies.

Tests start real `wrangler dev --local`, workerd, and SQLite on dynamically
chosen loopback ports; they stop the processes and remove their unique
`.test-state` directory. They snapshot source/config to isolate Wrangler's file
watcher from concurrent worktree edits. No Cloudflare login or remote state is
used. Fixtures are random synthetic opaque bytes, not learner content.
The package explicitly runs `test/*.check.mjs` with Node's test runner;
`integration.check.mjs` and `retention.check.mjs` deliberately avoid Vitest's
`.test.*` discovery pattern so the root app suite never launches these checks.

Coverage includes separate capabilities/vaults, exact CORS, enrollment conflicts,
concurrent CAS, deliberately discarded acknowledgements, retry after head
advance, same-ID conflicts, body/encoding/digest validation, history decrease,
wipe rejection, chunk round-trip/corruption, pagination, atomic capacity failure,
anchor compaction, and persistence across a complete runtime restart.
The production entry is separately tested without an enrollment secret and
rejects fixture routes. The separate `test/worker.ts` entry has synthetic-only
clock/corruption/usage controls; **never deploy or expose that test entry**.

Pure-clock workload tests simulate **45 days × 8 active hours**, at both 30-second
(43,200 checkpoints) and 60-second (21,600 checkpoints) capture intervals.
They compare incremental compaction against an unbounded-history oracle and
verify that the baseline and required anchors survive within the bound.
Real SQLite tests additionally accept 250 captures at 30-second simulated
intervals, then 45 daily captures. Capacity rollback uses a test-only stored-usage
fixture rather than writing 128 MiB of disposable data.

For browser integration, run the **production entry** locally with clearly
synthetic enrollment authorization and an explicit origin list:

```sh
gh cfs -- npm exec -- wrangler dev --local --ip 127.0.0.1 --port 8797 \
  --var 'ALLOWED_ORIGINS:["http://127.0.0.1:5197","http://localhost:5197"]' \
  --var 'ENROLLMENT_SECRET:synthetic-only-langlearn-local-enrollment-not-production'
```

Base URL: `http://127.0.0.1:8797`, health: `/health`. This code is intentionally
public test data, **never** a production secret. Keep this server loopback-only
and stop it after dependent checks. Its default `.wrangler` state is independent
of test fixtures. Do not mix real learner data or credentials into local tests.

Wrangler is pinned to **4.159.0**, with matching Workers types. The initially
suggested 4.90.1 reproducibly failed local oversized/chunked request handling in
its development proxy and brought six dependency advisories. Upgrading the
isolated toolchain fixed the real-runtime tests; CFS installation/audit reports
**zero known advisories** at verification time. Continue to keep local servers
loopback-only and review future tooling advisories; never run
`npm audit fix --force` blindly.

## Owner-operated production setup

1. With the owner's authorization, select the intended Cloudflare account,
   review plan/budget, enable Workers, and have the owner sign in or
   reauthenticate as needed.
   `gh cfs -- npm exec -- wrangler whoami` confirms the selected account once
   login works. The checked-in configuration deliberately has no account ID.
2. Set `ALLOWED_ORIGINS` in `wrangler.toml` to a JSON array of **exact origins**,
   without paths or trailing slashes. The default is
   `["https://truemichato.github.io"]`; `/LangLearn/` is not part of an origin.
   Add local origins only to local configuration, never a wildcard.
3. Generate an enrollment secret without displaying it in a terminal:

   ```sh
   umask 077
   openssl rand -hex 32 > .enrollment-secret.local
   gh cfs -- npm exec -- wrangler secret put ENROLLMENT_SECRET < .enrollment-secret.local
   ```

   Store it securely in the owner's password manager before removing the
   ignored local file. Do not paste it into source, a Vite variable, issue,
   screenshot, command-line argument, or build log. The owner uses this secret
   only for vault enrollment, not routine backup or recovery.
4. After authorization and tooling review, deploy explicitly:

   ```sh
   gh cfs -- npm exec -- wrangler deploy
   ```

   `new_sqlite_classes = ["BackupVault"]` migration `v1` creates the namespace;
   no separate R2 bucket or database provisioning is needed. Verify the actual
   HTTPS workers.dev URL from Wrangler's output with `GET /health`. Configure
   that URL in the frontend only after testing a synthetic upload/download and
   independent-browser restore.
5. Keep the Worker name/class/migration and namespace stable. Renaming or
   deleting a namespace is not migration or recovery. Disable production
   request-body/header logging and avoid `wrangler tail` with real secrets.

The secret may be rotated through `wrangler secret put` without altering
existing vaults; existing read/write capabilities still work. There is no
per-vault capability-rotation endpoint. To replace a compromised kit, explicitly
provision a different vault and keep the old recovery material as needed.
Revoking enrollment does not revoke a compromised existing writer.

## HTTP contract

All responses use `Cache-Control: no-store`; errors are
`{"error":{"code":"...","message":"..."},"headId":"optional-current-id"}`.
Never put a bearer or AES key in URLs.

| Route | Authorization | Result |
|---|---|---|
| `GET /health` | None | `{ok:true,service:"langlearn-backup",version:1}` |
| `POST /v1/vaults` | Enrollment bearer | JSON `{vaultId,readTokenHash,writeTokenHash}` → `201 {vaultId}` |
| `GET /v1/vaults/:vaultId/status` | Read bearer | `{headId,sequence,storedBytes,checkpointCount,maxBytes,retentionDays:30}` |
| `GET /v1/vaults/:vaultId/checkpoints?cursor=sequence&limit=20` | Read bearer | `{checkpoints: summariesNewestFirst,nextCursor,headId}` |
| `GET /v1/vaults/:vaultId/checkpoints/:checkpointId` | Read bearer | `{checkpoint:envelope,receipt:summary}` |
| `POST /v1/vaults/:vaultId/checkpoints` | Write bearer | Envelope → `201 {checkpoint:summary,headId}`; exact retained replay → `200` |

Enrollment hashes are distinct lowercase 64-hex SHA-256 values of the UTF-8
bearers. The browser generates UUIDs and the capability entropy; the server
cannot verify randomness. Vault UUID paths are case-normalized. Existing vault
enrollment always returns `409 vault-exists`, never resets credentials.
After a lost enrollment acknowledgement, reconcile with an authenticated
status read using the **same saved kit**, not replacement credentials.

Envelope fields, in canonical serialization order:

```ts
{
  version: 1, id: string, parentId: string | null, createdAt: string,
  schemaVersion: number, progressRows: number, iv: string,
  ciphertext: string, sha256: string
}
```

IDs are UUIDs; `createdAt` is an ISO timestamp. Counters are nonnegative safe
integers; application schema versions are not coupled to the deployed server.
`iv` is canonical padded base64 of 12 bytes; `ciphertext` is canonical padded
base64 with at least the 16-byte GCM tag. Unsupported wire versions, extra
fields, malformed UTF-8/base64/JSON, and bad checksums fail before mutation.

Digest = lowercase SHA-256 hex of UTF-8:

```js
JSON.stringify([version, id, parentId, createdAt, schemaVersion, progressRows, iv, ciphertext])
```

Client-side AES-GCM AAD is UTF-8:

```js
JSON.stringify([1, id, parentId, createdAt, schemaVersion, progressRows])
```

Summary fields: `id,parentId,createdAt,storedAt,schemaVersion,progressRows,sha256,bytes,sequence`.
`storedAt` is server ISO time; `bytes` is UTF-8 size of the canonical JSON
envelope, not raw HTTP whitespace/key order or plaintext size. `sequence`
strictly increases per accepted new checkpoint. Pagination limits are 1–50;
positive safe-integer cursors return strictly lower sequences.

New `parentId` must match current head: otherwise `409 head-conflict` includes
`headId`. Lookup of an already retained ID happens **before CAS**: identical
canonical envelope returns its original receipt and current head, even after
other checkpoints advance it. Different content for that ID returns
`409 idempotency-conflict`. Idempotency receipts live as long as their retained
envelope, not forever; a compacted checkpoint must not be blindly re-uploaded
as a new root. Reconcile status/list with the saved pending checkpoint.

Lower declared counts return `409 history-decreased` unless a deliberate user
action sends `X-Confirm-History-Decrease: true`. Zero after nonempty is always
`409 suspected-wipe`. Neither confirmation nor writer authorization bypasses
retention or capacity.

## Retention and capacity

This is **tiered full-snapshot retention**, not every-version-for-30-days.
On each accepted checkpoint, atomically select the union of:

- The first declared nonempty checkpoint, permanently pinned.
- The newest **8** checkpoints, including the head.
- The newest checkpoint per UTC hour in the **current hour plus 23 previous
  hourly buckets**.
- The newest checkpoint per UTC day in **today plus 29 previous UTC days**.

Only occupied buckets get anchors. Ties use server sequence. Selection uses
server `storedAt`, never client `createdAt`. At most **63** states are selected
before overlaps; fewer are usual. `retentionDays:30` reports the daily-anchor
window. It does **not** promise 30 complete 24-hour periods for every version.
An intermediate recent snapshot may be compacted as soon as it falls out of
the eight-most-recent tier and is not an hourly/daily anchor. There is no alarm:
idle vaults keep their existing snapshots; compaction occurs with a new write.

Hard application bounds in `src/protocol.ts`:

| Bound | Value |
|---|---|
| Raw request / canonical envelope | 8 MiB (enrollment: 1 KiB) |
| Serialized retained envelope total per vault | 128 MiB |
| Retained checkpoints safety cap | 200 |
| SQLite envelope text chunks | ≤64 KiB each |
| Daily / hourly / recent tiers | 30 days / 24 hourly buckets / 8 snapshots |

The byte quota is payload accounting, not SQLite/index/metadata/WAL disk usage.
Full base64 checkpoints include roughly 4/3 encryption-size expansion. Large
datasets can hit 128 MiB with far fewer than 63 states: reduce capture size or
explicitly review a storage/budget upgrade; never silently sacrifice required
anchors. The server plans compaction first, then rejects `507 capacity-exceeded`
if the selected tier cannot fit. A rejection changes **nothing**: not head,
sequence, chunks, or even otherwise unselected old snapshots.

Validation/hash work happens outside `storage.transactionSync`; inside it the
Worker rechecks mutable state, idempotency, CAS, history guards, selection, quota,
chunk inserts/removals, receipt and head together. No SQL `BEGIN` and no
cross-storage two-phase publication. GET reassembles chunks, checks their
ordering/bounds, canonical JSON, bytes, digest and metadata; corruption is a
`500 storage-corrupt`, never successful recovery.

## Costs, failures, and operations

As checked 2026-11-17, Cloudflare documents SQLite Durable Objects on **Free**
and Paid. Free has **5 GB account-wide SQL storage**, 100,000 DO requests/day,
13,000 GB-s/day, 5 million row reads/day, and 100,000 row writes/day. Exceeding
a Free tier quota causes affected operations to fail; daily quotas reset at
00:00 UTC. Workers' own limits also apply. No paid plan is silently enabled.

Paid allocations/rates currently include 5 GB-month storage then $0.20/GB-month,
1 million DO requests/month then $0.15/million, and separate duration/SQL row
charges. Each chunk/metadata insert and compaction delete costs rows; large
snapshots and frequent capture can exhaust free row-write allowance well
before storage capacity. Request frequency is not a free-resource guarantee.
Set account budgets/spending limits and alerts deliberately. Do not promise
zero cost, unlimited writes, an SLA, or account-scale fit from per-vault limits.

Cloudflare's limits page currently lists an 8 MB maximum SQL string/BLOB/row;
we deliberately use conservative 64 KiB chunks and do not depend on that
larger bound. Some Cloudflare FAQ limits conflict; account dashboard/provider
enforcement is authoritative. Recheck before enabling a paid resource:

- <https://developers.cloudflare.com/durable-objects/platform/limits/>
- <https://developers.cloudflare.com/durable-objects/platform/pricing/>
- <https://developers.cloudflare.com/workers/platform/limits/>

Operational handling:

- **503 / timeout / ambiguous POST:** retain the pending encrypted envelope,
  retry its exact ID/body; don't infer failure or create a sibling root.
- **409 head-conflict:** fetch status/latest valid checkpoint and reconcile;
  never auto-force an older browser over a newer head.
- **507:** stop writes, keep local data and all recovery material, report the
  capacity failure. Existing copies remain readable. Changing hard limits
  requires reviewed server code/budget, not a writer-accessible override.
- **500 storage-corrupt:** try an earlier retained checkpoint and investigate;
  browser AEAD and full backup validation remain mandatory even after a 200.
- **Free quota/provider outage:** recovery may be unavailable until limits
  reset or the provider recovers. No alarm promises infinite retries.
- **Lost key/read token:** the server cannot reconstruct them or decrypt a
  vault; restore the independently saved recovery kit.
- **Administrator/account loss:** an administrator can delete code, secrets or
  namespaces, and Cloudflare/account compromise or loss can destroy all copies.
  Atomic SQLite is not a separate administrator trust domain. A future
  separately administered/provider copy can address that risk; this version
  does not implement one.

Observe health/status counters and provider-level error/usage metrics without
recording authorization headers, bodies, encryption keys, enrollment material,
or recovery URLs. No content/secret logging is implemented; Workers
observability is disabled by default. Do not enable a gateway/CDN cache or log
request bodies at the edge.

CORS is exact-origin browser policy, **not authentication**. Requests without
`Origin` are permitted for recovery tools but still require capabilities.
No cookies or credentialed wildcard CORS is used. The PWA's CSP `connect-src`
must explicitly allow the deployed HTTPS backup origin; this Worker does not
change frontend CSP, service workers, or cache rules. Bearer requests and
responses must never be cached by a browser service worker.

An independent-browser recovery connects directly to this backup Worker using
the saved kit, selects a retained checkpoint, verifies/decrypts/validates it
locally, and only then imports with a local safety copy. It does not require
push subscription, a live push-worker, or any learner content sent to the
notification service.
