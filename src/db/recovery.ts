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
 *  - Keep a compact recovery capsule in localStorage, outside the IndexedDB
 *    database, so a database-only eviction does not remove its own backup.
 *  - Take a full snapshot *before* letting an upgrade run, so there is always a
 *    known-good copy from before the change.
 *  - Handle `blocked` and `versionchange` so tabs cannot deadlock each other.
 *  - Catch open failures and hand them to the UI as a recoverable state, rather
 *    than letting the app render blank. A learner staring at a broken app will
 *    reinstall it or clear site data — and *that* is what actually destroys the
 *    data for good.
 */

import Dexie from 'dexie';
import { db, CURRENT_SCHEMA_VERSION, DB_NAME, type Snapshot } from './schema';
import {
  buildBackupPayload,
  importRecoveryData,
  importAllData,
  normalizePayload,
  BACKUP_STORAGE_KEYS,
  BACKUP_PAYLOAD_VERSION,
  type BackupPayload,
} from './backup';
import {
  readRecoveryCapsule,
  refreshRecoveryCapsule,
  type RecoveryCapsule,
} from './recovery-capsule';
import { hasMissingRecoveryHistory, recoveryHistoryRows } from './recovery-history';

let pendingSnapshot: Snapshot | null = null;

/** How many automatic snapshots to keep. Each is a full copy, so this is a
 *  trade against the origin's storage quota. */
export const MAX_SNAPSHOTS = 3;

export type DbStatus =
  | { kind: 'opening' }
  | { kind: 'ready'; recoveryWarning?: string }
  /** Another tab is holding the old schema open. Recoverable by closing it. */
  | { kind: 'blocked' }
  /** Another tab requested a database change. The closed connection must not
   *  keep presenting the app as usable; the event need not prove a newer version. */
  | { kind: 'reload-required' }
  /** The stored database is newer than this bundle — almost always a stale
   *  cached build. Recoverable by reloading to fetch the current one. */
  | { kind: 'version-mismatch'; error: Error }
  /** The upgrade or open failed for some other reason. */
  | { kind: 'failed'; error: Error }
  /**
   * The database opened cleanly but is empty, while a recovery point holds real
   * progress. This is the quiet failure mode: IndexedDB can drop or recreate an
   * object store during a bad upgrade, and the app then starts perfectly happily
   * with nothing in it. Nothing throws, so without this check the learner simply
   * finds themselves back at zero.
   */
  | { kind: 'data-loss-suspected'; recovery: RecoveryPoint };

export type RecoveryPoint =
  | { kind: 'snapshot'; snapshot: Snapshot }
  | { kind: 'capsule'; capsule: RecoveryCapsule };

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

const DATA_LOSS_DISMISSED_KEY = 'langlearn-data-loss-dismissed';

/** Total rows a snapshot payload holds across the progress tables. */
export function snapshotProgressRows(payload: string): number {
  try {
    const parsed = JSON.parse(payload) as { tables?: BackupPayload['tables'] };
    return recoveryHistoryRows(parsed.tables ?? {});
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
  missingHistory?: boolean;
}): boolean {
  if (input.liveProgressRows > 0 && !input.missingHistory) return false;
  if (input.snapshotProgressRows <= 0) return false;
  return input.dismissedFor !== input.snapshotCreatedAt;
}

/** The timestamp also identifies a dismissal without deleting the copy. */
function recoveryCreatedAt(recovery: RecoveryPoint): string {
  return recovery.kind === 'snapshot'
    ? recovery.snapshot.createdAt
    : recovery.capsule.createdAt;
}

function recoveryPayload(recovery: RecoveryPoint): string {
  return recovery.kind === 'snapshot'
    ? recovery.snapshot.payload
    : JSON.stringify(recovery.capsule.payload);
}

export function dismissDataLoss(recovery: RecoveryPoint): void {
  try {
    localStorage.setItem(DATA_LOSS_DISMISSED_KEY, recoveryCreatedAt(recovery));
  } catch {
    /* best effort */
  }
}

/**
 * Look for history demonstrably missing from the database, using an earlier
 * recovery point rather than inferring history from XP or badge totals.
 */
export async function findSuspectedDataLoss(): Promise<RecoveryPoint | null> {
  // These are safety-critical reads. A failure is not proof of an empty or
  // healthy database; let openDatabase classify it instead of admitting writers.
  const live = await buildBackupPayload();
  // The newest recovery point is not necessarily useful — restoring creates a
  // safety snapshot of whatever was there at the time, which may itself be
  // empty. Use the most recent candidate that actually contains missing history.
  const snapshots = await listSnapshots();
  const candidates: RecoveryPoint[] = snapshots.map((snapshot) => ({
    kind: 'snapshot',
    snapshot,
  }));
  const capsule = readRecoveryCapsule();
  if (capsule) candidates.push({ kind: 'capsule', capsule });
  candidates.sort((a, b) =>
    recoveryCreatedAt(b).localeCompare(recoveryCreatedAt(a)),
  );
  const usable = candidates.find((candidate) => {
    try {
      const previous = JSON.parse(recoveryPayload(candidate)) as BackupPayload;
      return hasMissingRecoveryHistory(live.tables, previous.tables);
    } catch {
      return false; // An invalid old payload cannot prove anything.
    }
  });
  if (!usable) return null;

  let dismissedFor: string | null = null;
  try {
    dismissedFor = localStorage.getItem(DATA_LOSS_DISMISSED_KEY);
  } catch {
    /* private mode */
  }

  return suspectsDataLoss({
    liveProgressRows: recoveryHistoryRows(live.tables),
    missingHistory: true,
    snapshotProgressRows: snapshotProgressRows(recoveryPayload(usable)),
    dismissedFor,
    snapshotCreatedAt: recoveryCreatedAt(usable),
  })
    ? usable
    : null;
}

/** Read the on-disk schema version without triggering an upgrade. */
async function getStoredVersion(): Promise<number> {
  const existing = await Dexie.exists(DB_NAME);
  if (!existing) return 0;
  const probe = new Dexie(DB_NAME);
  try {
    await probe.open();
    return probe.verno;
  } finally { probe.close(); }
}

// ─── Snapshots ───

export async function listSnapshots(): Promise<Snapshot[]> {
  // Recovery UI also calls this after a failed/blocked open. Do not let that
  // read auto-open Dexie and bypass a failed pre-upgrade safety capture.
  if (!db.isOpen()) throw new Error('The database is not open. Reload to retry the storage safety checks.');
  return db.snapshots.orderBy('createdAt').reverse().toArray();
}

export async function deleteSnapshot(id: number): Promise<void> {
  await db.snapshots.delete(id);
}

/** Drop the oldest snapshots beyond `MAX_SNAPSHOTS`. */
async function pruneSnapshots(): Promise<void> {
  const all = await db.snapshots.orderBy('createdAt').reverse().toArray();
  const excess = all.slice(MAX_SNAPSHOTS).filter((snapshot) => {
    try {
      const newest = JSON.parse(all[0].payload) as BackupPayload;
      const previous = JSON.parse(snapshot.payload) as BackupPayload;
      return !hasMissingRecoveryHistory(newest.tables, previous.tables);
    } catch { return false; }
  });
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

    // Only progress counts. A database holding only ordinary preference rows has
    // nothing worth protecting, and snapshotting it anyway would push a real
    // recovery point out of the retention window — which is exactly what you
    // need when the next thing that happens is a wipe.
    if (snapshotProgressRows(serialized) === 0) return null;
    const copies = await listSnapshots();
    const capsule = readRecoveryCapsule();
    if (capsule && hasMissingRecoveryHistory(payload.tables, capsule.payload.tables)) return null;
    if (copies.some((copy) => {
      try {
        return hasMissingRecoveryHistory(payload.tables, (JSON.parse(copy.payload) as BackupPayload).tables);
      } catch { return false; }
    })) return null;

    const snapshot = snapshotFromPayload(payload, reason);
    const id = (await db.snapshots.add(snapshot)) as number;
    await pruneSnapshots();
    return { ...snapshot, id };
  } catch {
    return null;
  }
}

function snapshotFromPayload(payload: BackupPayload, reason: string): Snapshot {
  const serialized = JSON.stringify(payload);
  return {
    createdAt: new Date().toISOString(), reason,
    schemaVersion: payload.schemaVersion, payload: serialized, sizeBytes: serialized.length,
  };
}

/** Put a snapshot back. Replaces the tables the snapshot carries. */
export async function restoreSnapshot(id: number): Promise<void> {
  const snapshot = await db.snapshots.get(id);
  if (!snapshot) throw new Error('Snapshot not found');
  // Take a snapshot of the current state first — restoring is itself a
  // destructive act, and the learner may have restored the wrong one.
  // Do not prune at this boundary: both the chosen source and the current data
  // must remain available, even when the normal retention window is full.
  await db.snapshots.add(snapshotFromPayload(await buildBackupPayload(), 'before restoring an earlier snapshot'));
  await importAllData(snapshot.payload, 'replace');
}

/** Restore either an in-database migration snapshot or the independent capsule. */
export async function restoreRecoveryPoint(
  recovery: RecoveryPoint,
): Promise<void> {
  let payload: BackupPayload;
  if (recovery.kind === 'snapshot') {
    if (recovery.snapshot.id == null) throw new Error('Snapshot not found');
    const snapshot = await db.snapshots.get(recovery.snapshot.id);
    if (!snapshot) throw new Error('Snapshot not found');
    payload = normalizePayload(JSON.parse(snapshot.payload));
  } else {
    payload = recovery.capsule.payload;
  }

  await importRecoveryData(payload, async (current) => {
    await db.snapshots.add(snapshotFromPayload(current,
      recovery.kind === 'capsule' ? 'before restoring browser recovery copy' : 'before recovering from an earlier snapshot'));
  });
  await refreshRecoveryCapsule();
}

/** Export either recovery format as a normal backup payload. */
export function exportRecoveryPoint(recovery: RecoveryPoint): string {
  return recoveryPayload(recovery);
}

// ─── Opening the database ───

let openPromise: Promise<DbStatus> | null = null;
type DatabaseInvalidation = Extract<DbStatus, { kind: 'reload-required' }>;
let invalidation: DatabaseInvalidation | null = null;
const invalidationListeners = new Set<(status: DatabaseInvalidation) => void>();

export function subscribeDatabaseInvalidation(
  listener: (status: DatabaseInvalidation) => void,
): () => void {
  invalidationListeners.add(listener);
  if (invalidation) listener(invalidation);
  return () => { invalidationListeners.delete(listener); };
}

function onVersionChange(): false {
  db.close();
  invalidation = { kind: 'reload-required' };
  for (const listener of invalidationListeners) listener(invalidation);
  // We closed explicitly. Dexie's default handler would enable auto-open again.
  return false;
}

/**
 * Open the database, snapshotting first if an upgrade is pending.
 *
 * Idempotent — every caller shares the same attempt, so a dozen components
 * mounting at once do not race each other into a dozen upgrades.
 */
export function openDatabase(): Promise<DbStatus> {
  if (invalidation) return Promise.resolve(invalidation);
  if (openPromise) return openPromise;

  openPromise = (async (): Promise<DbStatus> => {
    // Another tab is blocking our upgrade. Dexie fires this instead of hanging
    // silently, so we can tell the learner what to do about it.
    let reportBlocked: (status: DbStatus) => void;
    const blocked = new Promise<DbStatus>((resolve) => { reportBlocked = resolve; });
    const onBlocked = () => reportBlocked({ kind: 'blocked' });
    db.on('blocked', onBlocked);

    // A newer tab wants to upgrade. Close our connection so it can proceed —
    // refusing would deadlock both tabs, and this one can recover on reload.
    db.on('versionchange', onVersionChange);

    const opening = (async (): Promise<DbStatus> => {
      try {
        const storedVersion = await getStoredVersion();
        if (needsPreUpgradeSnapshot(storedVersion, CURRENT_SCHEMA_VERSION)) {
          await captureSnapshotAtStoredVersion(storedVersion);
        }

        await db.open();
        await flushPendingSnapshot();

        const lost = await findSuspectedDataLoss();
        if (invalidation) return invalidation;
        if (lost) return { kind: 'data-loss-suspected', recovery: lost };

        return { kind: 'ready' };
      } catch (error) {
        return invalidation ?? classifyOpenError(error);
      }
    })();
    // A real blocked event does not reject db.open(). Return actionable UI
    // immediately while IndexedDB waits for the other tab to close.
    const result = await Promise.race([opening, blocked]);
    db.on('blocked').unsubscribe(onBlocked);
    return result;
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
  const raw = new Dexie(DB_NAME);
  await raw.open();
  try {
    const tables: Record<string, unknown[]> = {};
    const sourceTables = raw.tables.filter((table) => table.name !== 'snapshots');
    await raw.transaction('r', sourceTables, async () => {
      await Promise.all(sourceTables.map(async (table) => { tables[table.name] = await table.toArray(); }));
    });
    if (recoveryHistoryRows(tables) === 0) return;

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
 * Called inside openDatabase before recovery checks and the ready boundary.
 */
export async function flushPendingSnapshot(): Promise<void> {
  if (!pendingSnapshot) return;
  const snapshot = pendingSnapshot;
  await db.transaction('rw', db.snapshots, async () => {
    await db.snapshots.add(snapshot);
    await pruneSnapshots();
  });
  pendingSnapshot = null;
}

/** Export the raw payload of a snapshot so the learner can save it off-device. */
export async function exportSnapshot(id: number): Promise<string | null> {
  const snapshot = await db.snapshots.get(id);
  return snapshot?.payload ?? null;
}
