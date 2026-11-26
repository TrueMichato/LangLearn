import Dexie, { type ObservabilitySet } from 'dexie';
import type { BackupPayload, BackupTableName } from './backup';
import {
  BACKUP_PAYLOAD_VERSION,
  normalizePayload,
} from './backup';
import { CURRENT_SCHEMA_VERSION, db } from './schema';
import { hasMissingRecoveryHistory, recoveryHistoryRows } from './recovery-history';
export { countVocabAttemptRows } from './recovery-history';

export const RECOVERY_CAPSULE_KEY = 'langlearn-recovery-capsule-v1';
export const RECOVERY_CAPSULE_VERSION = 1;

/**
 * localStorage is commonly capped near 5 MiB and already holds app settings.
 * Staying below 2.5 MiB leaves room for those stores and avoids a failed write
 * evicting the last useful recovery point.
 */
export const MAX_RECOVERY_CAPSULE_BYTES = 2_500_000;

export const RECOVERY_CAPSULE_TABLES = [
  'words',
  'reviews',
  'texts',
  'studySessions',
  'settings',
  'dailyActivity',
  'lessonProgress',
  'characterProgress',
  'testHistory',
  'badges',
  'guidedActivityProgress',
  'skillProgress',
  'readingProgress',
] as const satisfies readonly BackupTableName[];

export interface RecoveryCapsule {
  version: typeof RECOVERY_CAPSULE_VERSION;
  createdAt: string;
  schemaVersion: number;
  payload: BackupPayload;
}

export interface RecoveryCapsuleInfo {
  createdAt: string;
  sizeBytes: number;
  progressRows: number;
}

export type CapsuleWriteResult =
  | { kind: 'saved'; capsule: RecoveryCapsule; sizeBytes: number }
  | { kind: 'empty' }
  | { kind: 'too-large'; sizeBytes: number }
  | { kind: 'kept'; reason: 'missing-history' | 'newer-copy' }
  | { kind: 'kept'; reason: 'unreadable-copy'; error: Error }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' }
  | { kind: 'failed'; error: Error; phase?: 'read' | 'write' };

export interface CapsuleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let lastWriteResult: CapsuleWriteResult | null = null;

export function getLastRecoveryCapsuleWriteResult(): CapsuleWriteResult | null {
  return lastWriteResult;
}

function browserStorage(): CapsuleStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function serializedBytes(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength;
  }
  return value.length * 2;
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

export function parseRecoveryCapsule(
  serialized: string,
): RecoveryCapsule | null {
  try {
    const raw = JSON.parse(serialized) as Record<string, unknown>;
    if (
      raw.version !== RECOVERY_CAPSULE_VERSION ||
      !isIsoDate(raw.createdAt) ||
      typeof raw.schemaVersion !== 'number' ||
      raw.schemaVersion > CURRENT_SCHEMA_VERSION
    ) {
      return null;
    }

    const payload = normalizePayload(raw.payload);
    const schemaVersion = raw.schemaVersion;
    const requiredTables = RECOVERY_CAPSULE_TABLES.filter((name) =>
      (name !== 'guidedActivityProgress' || schemaVersion >= 11) &&
      (name !== 'skillProgress' || schemaVersion >= 12) &&
      (name !== 'readingProgress' || schemaVersion >= 13));
    if (
      payload.schemaVersion !== raw.schemaVersion ||
      requiredTables.some(
        (name) => !Array.isArray(payload.tables[name]),
      )
    ) {
      return null;
    }
    return {
      version: RECOVERY_CAPSULE_VERSION,
      createdAt: raw.createdAt,
      schemaVersion: raw.schemaVersion,
      payload,
    };
  } catch {
    return null;
  }
}

export function readRecoveryCapsule(
  storage: CapsuleStorage | null = browserStorage(),
): RecoveryCapsule | null {
  if (!storage) return null;
  try {
    const serialized = storage.getItem(RECOVERY_CAPSULE_KEY);
    return serialized ? parseRecoveryCapsule(serialized) : null;
  } catch {
    return null;
  }
}

export function getRecoveryCapsuleInfo(
  storage: CapsuleStorage | null = browserStorage(),
): RecoveryCapsuleInfo | null {
  if (!storage) return null;
  try {
    const serialized = storage.getItem(RECOVERY_CAPSULE_KEY);
    if (!serialized) return null;
    const capsule = parseRecoveryCapsule(serialized);
    if (!capsule) return null;
    return {
      createdAt: capsule.createdAt,
      sizeBytes: serializedBytes(serialized),
      progressRows: recoveryHistoryRows(capsule.payload.tables),
    };
  } catch {
    return null;
  }
}

/**
 * Store a complete capsule atomically from the caller's perspective.
 * `setItem` either replaces the key or throws, so quota and private-mode
 * failures leave the previous known-good capsule untouched.
 */
export function storeRecoveryCapsule(
  capsule: RecoveryCapsule,
  storage: CapsuleStorage | null = browserStorage(),
  maxBytes = MAX_RECOVERY_CAPSULE_BYTES,
): CapsuleWriteResult {
  if (!storage) return { kind: 'unavailable' };

  try {
    // Do not turn a quiet reset (or a small amount of new activity afterwards)
    // into the only remaining recovery copy.
    const serializedPrevious = storage.getItem(RECOVERY_CAPSULE_KEY);
    const previous = serializedPrevious ? parseRecoveryCapsule(serializedPrevious) : null;
    if (serializedPrevious !== null && !previous) {
      return {
        kind: 'kept', reason: 'unreadable-copy',
        error: new Error(
          'This version of LangLearn cannot safely read the existing recovery copy. It was kept unchanged. ' +
          'Update the app and export current data before retrying; do not clear site data.',
        ),
      };
    }
    if (previous && hasMissingRecoveryHistory(capsule.payload.tables, previous.payload.tables)) {
      return { kind: 'kept', reason: 'missing-history' };
    }
    if (previous && previous.createdAt > capsule.createdAt) {
      return { kind: 'kept', reason: 'newer-copy' };
    }
    if (recoveryHistoryRows(capsule.payload.tables) === 0) return { kind: 'empty' };
    const serialized = JSON.stringify(capsule);
    const sizeBytes = serializedBytes(serialized);
    if (sizeBytes > maxBytes) return { kind: 'too-large', sizeBytes };
    storage.setItem(RECOVERY_CAPSULE_KEY, serialized);
    return { kind: 'saved', capsule, sizeBytes };
  } catch (error) {
    return {
      kind: 'failed',
      phase: 'write',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function buildRecoveryCapsule(): Promise<RecoveryCapsule> {
  const createdAt = new Date().toISOString();
  const tables: BackupPayload['tables'] = {};
  const dexieTables = RECOVERY_CAPSULE_TABLES.map((name) => db.table(name));

  await db.transaction('r', dexieTables, async () => {
    await Promise.all(
      RECOVERY_CAPSULE_TABLES.map(async (name) => {
        tables[name] = await db.table(name).toArray();
      }),
    );
  });

  // Pending vocabulary receipts live in settings; their idempotency tokens
  // must travel with the XP total, including the cross-store failure window.
  const storage: Record<string, string> = {};
  const xp = browserStorage()?.getItem('langlearn-xp');
  if (xp != null) storage['langlearn-xp'] = xp;
  return {
    version: RECOVERY_CAPSULE_VERSION,
    createdAt,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    payload: {
      version: BACKUP_PAYLOAD_VERSION,
      exportedAt: createdAt,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tables,
      localStorage: storage,
    },
  };
}

let captureQueue: Promise<unknown> = Promise.resolve();

export function refreshRecoveryCapsule(
  storage: CapsuleStorage | null = browserStorage(),
  shouldWrite: () => boolean = () => true,
): Promise<CapsuleWriteResult> {
  // Capture inside the queue as well as writing inside it: an older read must
  // never finish last and overwrite a newer copy.
  const captureOnce = async (): Promise<CapsuleWriteResult> => {
    if (!shouldWrite()) return { kind: 'cancelled' };
    let result: CapsuleWriteResult;
    try {
      const capsule = await buildRecoveryCapsule();
      if (!shouldWrite()) return { kind: 'cancelled' };
      result = storeRecoveryCapsule(capsule, storage);
    } catch (error) {
      result = {
        kind: 'failed',
        phase: 'read',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
    lastWriteResult = result;
    return result;
  };
  const capture = captureQueue.then(() => {
    const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
    return locks
      ? locks.request('langlearn-recovery-capsule', captureOnce)
      : captureOnce();
  }).catch((error: unknown): CapsuleWriteResult => {
    const result: CapsuleWriteResult = {
      kind: 'failed', phase: 'write',
      error: error instanceof Error ? error : new Error(String(error)),
    };
    lastWriteResult = result;
    return result;
  });
  captureQueue = capture;
  return capture;
}

/**
 * Dexie's supported global event runs after a write transaction commits,
 * including writes from other tabs. Ignore snapshots and coalesce timer ticks
 * and multi-table activity into one capture, with no overlapping reads/writes.
 */
export function startRecoveryCapsuleLifecycle(options: {
  storage?: CapsuleStorage;
  delayMs?: number;
  visibilityTarget?: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
} = {}) {
  let active = true;
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<unknown> | null = null;
  const target = options.visibilityTarget ??
    (typeof document === 'undefined' ? undefined : document);
  const prefixes = RECOVERY_CAPSULE_TABLES.map((name) => `idb://${db.name}/${name}/`);

  const schedule = () => {
    if (!active || timer || running) return;
    timer = setTimeout(() => { timer = undefined; void flush(); }, options.delayMs ?? 1000);
  };
  const flush = async (): Promise<void> => {
    if (timer) { clearTimeout(timer); timer = undefined; }
    if (running) {
      await running;
      if (active && dirty) await flush();
      return;
    }
    if (!active || !dirty) return;
    dirty = false;
    running = refreshRecoveryCapsule(options.storage, () => active);
    await running;
    running = null;
    if (dirty) schedule();
  };
  const changed = (parts: ObservabilitySet) => {
    if (!Object.keys(parts).some((part) => prefixes.some((prefix) => part.startsWith(prefix)))) return;
    dirty = true;
    schedule();
  };
  const hidden = () => { if (target?.visibilityState === 'hidden') void flush(); };
  Dexie.on('storagemutated', changed);
  target?.addEventListener('visibilitychange', hidden);

  return {
    flush,
    async stop() {
      active = false;
      if (timer) clearTimeout(timer);
      Dexie.on('storagemutated').unsubscribe(changed);
      target?.removeEventListener('visibilitychange', hidden);
      await running;
    },
  };
}
