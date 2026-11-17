# LangLearn

A kind language-learning PWA with offline support and spaced repetition.

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 8** + **vite-plugin-pwa** — build tooling & service worker
- **Tailwind CSS 4** — styling
- **Zustand** — state management
- **Dexie (IndexedDB)** — offline-first data storage
- **Vitest** — unit tests

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview the production build locally
```

## Tests

```bash
npm test
```

## Contributing

Read [AGENTS.md](./AGENTS.md) for development conventions and
[knowledge-aware reading and practice](./docs/knowledge-practice.md) before
changing vocabulary content, adaptive selection, coverage, or word capture.

## Keeping your data safe

Words, reviews, lessons and activity/streak history live in this browser's
IndexedDB database. Bonus XP, badge display and study-set definitions live
separately in localStorage. If only the database becomes unavailable or is
reset, those totals and definitions can survive while the sets appear empty;
that pattern alone does not establish why storage went missing.

LangLearn checks storage before mounting study screens or starting timers,
requests persistent storage when supported, and keeps:

- Coalesced recovery copies after committed study changes, plus a best-effort
  refresh when the app is hidden. These compact localStorage copies omit
  detailed answer logs, have a size limit, and preserve the last useful copy
  when history unexpectedly disappears or a new capture fails. Existing bytes
  that this app cannot read (including newer formats) are never overwritten.
- Coherent pre-upgrade and routine daily snapshots inside IndexedDB. Routine
  retention is three copies; useful recovery points and pre-restore safety
  copies are protected from being displaced by missing/trivial progress.

If progress disappears, **do not clear site data or uninstall the app**.
Download any offered recovery copy first. It remains accessible under
**Settings → Data and privacy → Your data**, even after choosing to continue
without restoring. Export current data there too, particularly if you have
already made new progress.

**Restore missing progress** preserves current work, surviving bonus XP, badges
and study-set definitions, and saves a required safety snapshot first.
Original word IDs reconnect manual sets. If new records reuse incompatible
word, text or review IDs, restoration refuses to guess: keep both exported
files for manual recovery. Nothing is silently replaced in that case.
Recovery-screen snapshots use that same additive path; Settings' explicitly
confirmed snapshot Restore remains a point-in-time replacement.

If another tab requests a database change, this tab closes its connection and
asks you to reload instead of showing an apparently empty, disconnected app.

These are local safeguards, not cloud sync. Clearing all site data can remove
both the database and recovery copy; persistence requests and visibility
flushes are not guarantees. Regular **Export all data** files saved off-device
are the safest complete backup. If no usable copy survived, XP/badges cannot
reconstruct missing words or lesson history.

## Deployment

The app is deployed to **GitHub Pages** via a workflow in `.github/workflows/`.
The `base` path in `vite.config.ts` is set to `/langlearn/` to match the
GitHub Pages URL.
