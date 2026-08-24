import type { BackupPayload, BackupTableName } from './backup';
import {
  BACKUP_PAYLOAD_VERSION,
  normalizePayload,
} from './backup';
import { CURRENT_SCHEMA_VERSION, db } from './schema';

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
] as const satisfies readonly BackupTableName[];

const RECOVERY_PROGRESS_TABLES = [
  'words',
  'reviews',
  'studySessions',
  'dailyActivity',
  'lessonProgress',
  'characterProgress',
  'testHistory',
  'badges',
  'guidedActivityProgress',
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
  | { kind: 'unavailable' }
  | { kind: 'failed'; error: Error };

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

function progressRows(payload: BackupPayload): number {
  return RECOVERY_PROGRESS_TABLES.reduce(
    (sum, name) => sum + (payload.tables[name]?.length ?? 0),
    0,
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
    const requiredTables =
      raw.schemaVersion >= 11
        ? RECOVERY_CAPSULE_TABLES
        : RECOVERY_CAPSULE_TABLES.filter(
            (name) => name !== 'guidedActivityProgress',
          );
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
      progressRows: progressRows(capsule.payload),
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
  if (progressRows(capsule.payload) === 0) return { kind: 'empty' };

  try {
    const serialized = JSON.stringify(capsule);
    const sizeBytes = serializedBytes(serialized);
    if (sizeBytes > maxBytes) return { kind: 'too-large', sizeBytes };
    storage.setItem(RECOVERY_CAPSULE_KEY, serialized);
    return { kind: 'saved', capsule, sizeBytes };
  } catch (error) {
    return {
      kind: 'failed',
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function buildRecoveryCapsule(): Promise<RecoveryCapsule> {
  const tables: BackupPayload['tables'] = {};
  const dexieTables = RECOVERY_CAPSULE_TABLES.map((name) => db.table(name));

  await db.transaction('r', dexieTables, async () => {
    await Promise.all(
      RECOVERY_CAPSULE_TABLES.map(async (name) => {
        tables[name] = await db.table(name).toArray();
      }),
    );
  });

  const createdAt = new Date().toISOString();
  return {
    version: RECOVERY_CAPSULE_VERSION,
    createdAt,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    payload: {
      version: BACKUP_PAYLOAD_VERSION,
      exportedAt: createdAt,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      tables,
      localStorage: {},
    },
  };
}

export async function refreshRecoveryCapsule(
  storage: CapsuleStorage | null = browserStorage(),
): Promise<CapsuleWriteResult> {
  try {
    const result = storeRecoveryCapsule(await buildRecoveryCapsule(), storage);
    lastWriteResult = result;
    return result;
  } catch (error) {
    const result: CapsuleWriteResult = {
      kind: 'failed',
      error: error instanceof Error ? error : new Error(String(error)),
    };
    lastWriteResult = result;
    return result;
  }
}
