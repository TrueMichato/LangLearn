/**
 * Surviving a bad upgrade.
 *
 * A schema upgrade is the single most dangerous moment in a local-first app.
 * The learner's entire history is in one IndexedDB database, an upgrade rewrites
 * it in place, and if anything goes wrong there is nowhere to go back to. Three
 * failure modes are real here:
 *
 *  1. **A destructive or buggy upgrade function.** Version 9 of this schema used
 *     to delete rows outright. Even fixed, any future upgrade can lose data by
 *     accident.
 *  2. **A version downgrade.** GitHub Pages serves a cached bundle; a learner
 *     whose database is at version 10 can load JavaScript that only declares
 *     version 9. IndexedDB refuses to open and throws `VersionError`.
 *  3. **A blocked upgrade.** Another tab holding the old version keeps the
 *     upgrade waiting forever, and the app hangs with no explanation.
 *
 * The defences, in order:
 *
 *  - Take a full snapshot *before* letting an upgrade run, so there is always a
 *    known-good copy from before the change.
 *  - Handle `blocked` and `versionchange` so tabs cannot deadlock each other.
 *  - Catch open failures and hand them to the UI as a recoverable state, rather
 *    than letting the app render blank. A learner staring at a broken app will
 *    reinstall it or clear site data — and *that* is what actually destroys the
 *    data for good.
 */

import Dexie from 'dexie';
import { db, CURRENT_SCHEMA_VERSION, type Snapshot } from './schema';
import {
  buildBackupPayload,
  importAllData,
  BACKUP_STORAGE_KEYS,
  BACKUP_PAYLOAD_VERSION,
} from './backup';

let pendingSnapshot: Snapshot | null = null;

/** How many automatic snapshots to keep. Each is a full copy, so this is a
 *  trade against the origin's storage quota. */
export const MAX_SNAPSHOTS = 3;

export type DbStatus =
  | { kind: 'opening' }
  | { kind: 'ready' }
  /** Another tab is holding the old schema open. Recoverable by closing it. */
  | { kind: 'blocked' }
  /** The stored database is newer than this bundle — almost always a stale
   *  cached build. Recoverable by reloading to fetch the current one. */
  | { kind: 'version-mismatch'; error: Error }
  /** The upgrade or open failed for some other reason. */
  | { kind: 'failed'; error: Error }
  /**
   * The database opened cleanly but is empty, while a snapshot still holds real
   * progress. This is the quiet failure mode: IndexedDB can drop or recreate an
   * object store during a bad upgrade, and the app then starts perfectly happily
   * with nothing in it. Nothing throws, so without this check the learner simply
   * finds themselves back at zero.
   */
  | { kind: 'data-loss-suspected'; snapshot: Snapshot };

/**
 * Classify an open failure so the UI can say something true about it.
 *
 * `VersionError` specifically means "the database on disk is newer than the code
 * asking for it". That is a stale-bundle problem, not a corruption problem, and
 * the data is completely intact — which is the most important thing to tell the
 * learner.
 */
export function classifyOpenError(error: unknown): DbStatus {
  const err = error instanceof Error ? error : new Error(String(error));
  const name = (error as { name?: string })?.name ?? '';
  if (name === 'VersionError' || err.message.includes('less than the existing version')) {
    return { kind: 'version-mismatch', error: err };
  }
  return { kind: 'failed', error: err };
}

/**
 * Whether the stored database is about to be upgraded by this bundle.
 *
 * Dexie reports the on-disk version in whole numbers (10 → 10). A stored
 * version below what we declare means an upgrade is pending, which is exactly
 * when a snapshot is worth taking. A fresh database (version 0) has nothing to
 * protect.
 */
export function needsPreUpgradeSnapshot(
  storedVersion: number,
  declaredVersion: number,
): boolean {
  return storedVersion > 0 && storedVersion < declaredVersion;
}

/**
 * Tables whose emptiness means the learner has lost progress.
 *
 * Deliberately excludes `settings` and `texts`: those can be legitimately empty
 * for someone who has been using the app for a while, so counting them would
 * weaken the signal.
 */
const PROGRESS_TABLES = [
  'words',
  'reviews',
  'dailyActivity',
  'lessonProgress',
  'characterProgress',
  'testHistory',
  'badges',
] as const;

const DATA_LOSS_DISMISSED_KEY = 'langlearn-data-loss-dismissed';

/** Total rows a snapshot payload holds across the progress tables. */
export function snapshotProgressRows(payload: string): number {
  try {
    const parsed = JSON.parse(payload) as { tables?: Record<string, unknown[]> };
    const tables = parsed.tables ?? {};
    return PROGRESS_TABLES.reduce((sum, name) => sum + (tables[name]?.length ?? 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Whether an empty database should be treated as data loss rather than a fresh
 * start.
 *
 * Only fires when a snapshot proves there *was* progress, so a genuinely new
 * learner is never shown a recovery screen. Once dismissed for a given snapshot
 * we stay quiet — someone who reset on purpose should not be asked twice.
 */
export function suspectsDataLoss(input: {
  liveProgressRows: number;
  snapshotProgressRows: number;
  dismissedFor: string | null;
  snapshotCreatedAt: string;
}): boolean {
  if (input.liveProgressRows > 0) return false;
  if (input.snapshotProgressRows <= 0) return false;
  return input.dismissedFor !== input.snapshotCreatedAt;
}

/** Stop offering to restore this snapshot — the learner chose to start over. */
export function dismissDataLoss(snapshot: Snapshot): void {
  try {
    localStorage.setItem(DATA_LOSS_DISMISSED_KEY, snapshot.createdAt);
  } catch {
    /* best effort */
  }
}

/**
 * Look for the quiet failure: an intact but empty database sitting next to a
 * snapshot full of progress.
 */
async function findSuspectedDataLoss(): Promise<Snapshot | null> {
  try {
    let liveProgressRows = 0;
    for (const name of PROGRESS_TABLES) {
      liveProgressRows += await db.table(name).count();
      if (liveProgressRows > 0) return null;
    }

    // The newest snapshot is not necessarily a useful one — restoring creates a
    // safety snapshot of whatever was there at the time, which may itself be
    // empty. Recover against the most recent snapshot that actually has
    // something in it.
    const snapshots = await listSnapshots();
    const usable = snapshots.find((s) => snapshotProgressRows(s.payload) > 0);
    if (!usable) return null;

    let dismissedFor: string | null = null;
    try {
      dismissedFor = localStorage.getItem(DATA_LOSS_DISMISSED_KEY);
    } catch {
      /* private mode */
    }

    return suspectsDataLoss({
      liveProgressRows,
      snapshotProgressRows: snapshotProgressRows(usable.payload),
      dismissedFor,
      snapshotCreatedAt: usable.createdAt,
    })
      ? usable
      : null;
  } catch {
    return null;
  }
}

/** Read the on-disk schema version without triggering an upgrade. */
async function getStoredVersion(): Promise<number> {
  try {
    const existing = await Dexie.exists('LangLearnDB');
    if (!existing) return 0;
    const probe = new Dexie('LangLearnDB');
    await probe.open();
    const version = probe.verno;
    probe.close();
    return version;
  } catch {
    // If we cannot tell, assume no upgrade is pending rather than blocking boot.
    return 0;
  }
}

// ─── Snapshots ───

export async function listSnapshots(): Promise<Snapshot[]> {
  try {
    const all = await db.snapshots.orderBy('createdAt').reverse().toArray();
    return all;
  } catch {
    return [];
  }
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.snapshots.delete(id);
}

/** Drop the oldest snapshots beyond `MAX_SNAPSHOTS`. */
async function pruneSnapshots(): Promise<void> {
  const all = await db.snapshots.orderBy('createdAt').reverse().toArray();
  const excess = all.slice(MAX_SNAPSHOTS);
  if (excess.length) {
    await db.snapshots.bulkDelete(
      excess.map((s) => s.id).filter((id): id is number => id != null),
    );
  }
}

/**
 * Capture a full copy of the learner's data.
 *
 * Never throws: a snapshot is a safety net, and failing to take one must not
 * stop the app from starting or block whatever the learner was doing.
 */
export async function takeSnapshot(reason: string): Promise<Snapshot | null> {
  try {
    const payload = await buildBackupPayload();
    const serialized = JSON.stringify(payload);

    // Only progress counts. A database holding nothing but a settings row has
    // nothing worth protecting, and snapshotting it anyway would push a real
    // recovery point out of the retention window — which is exactly what you
    // need when the next thing that happens is a wipe.
    if (snapshotProgressRows(serialized) === 0) return null;

    const snapshot: Snapshot = {
      createdAt: new Date().toISOString(),
      reason,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      payload: serialized,
      sizeBytes: serialized.length,
    };
    const id = (await db.snapshots.add(snapshot)) as number;
    await pruneSnapshots();
    return { ...snapshot, id };
  } catch {
    return null;
  }
}

/** Put a snapshot back. Replaces the tables the snapshot carries. */
export async function restoreSnapshot(id: number): Promise<void> {
  const snapshot = await db.snapshots.get(id);
  if (!snapshot) throw new Error('Snapshot not found');
  // Take a snapshot of the current state first — restoring is itself a
  // destructive act, and the learner may have restored the wrong one.
  await takeSnapshot('before restoring an earlier snapshot');
  await importAllData(snapshot.payload, 'replace');
}

// ─── Opening the database ───

let openPromise: Promise<DbStatus> | null = null;

/**
 * Open the database, snapshotting first if an upgrade is pending.
 *
 * Idempotent — every caller shares the same attempt, so a dozen components
 * mounting at once do not race each other into a dozen upgrades.
 */
export function openDatabase(): Promise<DbStatus> {
  if (openPromise) return openPromise;

  openPromise = (async (): Promise<DbStatus> => {
    // Another tab is blocking our upgrade. Dexie fires this instead of hanging
    // silently, so we can tell the learner what to do about it.
    let blocked = false;
    db.on('blocked', () => {
      blocked = true;
    });

    // A newer tab wants to upgrade. Close our connection so it can proceed —
    // refusing would deadlock both tabs, and this one can recover on reload.
    db.on('versionchange', () => {
      db.close();
    });

    try {
      const storedVersion = await getStoredVersion();
      if (needsPreUpgradeSnapshot(storedVersion, CURRENT_SCHEMA_VERSION)) {
        try {
          await captureSnapshotAtStoredVersion(storedVersion);
        } catch {
          /* snapshotting is best-effort; never block the upgrade on it */
        }
      }

      await db.open();

      const lost = await findSuspectedDataLoss();
      if (lost) return { kind: 'data-loss-suspected', snapshot: lost };

      return { kind: 'ready' };
    } catch (error) {
      if (blocked) return { kind: 'blocked' };
      return classifyOpenError(error);
    }
  })();

  return openPromise;
}

/**
 * Snapshot the database as it exists *before* the upgrade, using a raw Dexie
 * connection at the stored version so no upgrade is triggered by the read.
 *
 * The snapshots table does not exist yet at the old schema version, so the
 * payload is held in memory and written by `flushPendingSnapshot()` once the
 * upgrade has completed.
 */
async function captureSnapshotAtStoredVersion(storedVersion: number): Promise<void> {
  const raw = new Dexie('LangLearnDB');
  await raw.open();
  try {
    const tables: Record<string, unknown[]> = {};
    for (const table of raw.tables) {
      if (table.name === 'snapshots') continue;
      tables[table.name] = await table.toArray();
    }
    if (PROGRESS_TABLES.every((name) => (tables[name]?.length ?? 0) === 0)) return;

    const storage: Record<string, string> = {};
    if (typeof localStorage !== 'undefined') {
      for (const key of BACKUP_STORAGE_KEYS) {
        const value = localStorage.getItem(key);
        if (value != null) storage[key] = value;
      }
    }

    const payload = JSON.stringify({
      version: BACKUP_PAYLOAD_VERSION,
      exportedAt: new Date().toISOString(),
      schemaVersion: storedVersion,
      tables,
      localStorage: storage,
    });

    pendingSnapshot = {
      createdAt: new Date().toISOString(),
      reason: `before upgrade from schema v${storedVersion} to v${CURRENT_SCHEMA_VERSION}`,
      schemaVersion: storedVersion,
      payload,
      sizeBytes: payload.length,
    };
  } finally {
    raw.close();
  }
}

/**
 * Move a pre-upgrade snapshot into the (now existing) snapshots table.
 * Call once after `openDatabase()` reports ready.
 */
export async function flushPendingSnapshot(): Promise<void> {
  if (!pendingSnapshot) return;
  const snapshot = pendingSnapshot;
  pendingSnapshot = null;
  try {
    await db.snapshots.add(snapshot);
    await pruneSnapshots();
  } catch {
    /* best effort */
  }
}

/** Export the raw payload of a snapshot so the learner can save it off-device. */
export async function exportSnapshot(id: number): Promise<string | null> {
  const snapshot = await db.snapshots.get(id);
  return snapshot?.payload ?? null;
}
