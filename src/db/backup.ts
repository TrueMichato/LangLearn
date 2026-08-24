/**
 * Export and import of *everything* the learner has.
 *
 * The previous implementation covered five of eleven tables and none of the
 * localStorage state. That is worse than it sounds: `importAllData` cleared the
 * tables it knew about, so a learner restoring a backup after a wipe got their
 * vocabulary back and permanently lost their streak, lesson progress, badges,
 * character mastery and test history — the backup itself completed the data
 * loss it was meant to prevent.
 *
 * The rules here are:
 *
 *  1. Export every table and every persisted store. A backup that silently
 *     omits data is a trap.
 *  2. Only ever clear a table that the incoming payload actually carries.
 *     Restoring a partial or older backup must never zero out data that file
 *     has nothing to say about.
 *  3. Offer a merge mode, so a learner can fold an old export into a live
 *     install without choosing which half of their progress to keep.
 */

import { db, CURRENT_SCHEMA_VERSION } from './schema';

/** Table name → whether Dexie assigns its primary key (`++id`). */
const TABLES = {
  words: { autoIncrement: true },
  reviews: { autoIncrement: true },
  texts: { autoIncrement: true },
  studySessions: { autoIncrement: true },
  settings: { autoIncrement: false },
  dailyActivity: { autoIncrement: false },
  lessonProgress: { autoIncrement: false },
  characterProgress: { autoIncrement: false },
  testHistory: { autoIncrement: true },
  badges: { autoIncrement: false },
  reviewLog: { autoIncrement: true },
  guidedActivityProgress: { autoIncrement: false },
} as const;

export type BackupTableName = keyof typeof TABLES;

export const BACKUP_TABLE_NAMES = Object.keys(TABLES) as BackupTableName[];

/**
 * Persisted Zustand stores. These hold bonus XP, unlocked badges, every setting
 * and the learner's study sets — losing them resets visible progress to zero
 * even when IndexedDB is intact, so they belong in the backup.
 *
 * `snapshots` is deliberately absent from both lists: a backup of the backups
 * would balloon the file and restoring stale snapshots helps nobody.
 */
export const BACKUP_STORAGE_KEYS = [
  'langlearn-settings',
  'langlearn-xp',
  'langlearn-badges',
  'langlearn-study-sets',
] as const;

export const BACKUP_PAYLOAD_VERSION = 2;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  schemaVersion: number;
  tables: Partial<Record<BackupTableName, unknown[]>>;
  localStorage: Record<string, string>;
}

export type ImportMode = 'replace' | 'merge';

export interface ImportResult {
  mode: ImportMode;
  /** Rows written per table. */
  written: Partial<Record<BackupTableName, number>>;
  /** Rows skipped because an equivalent row already existed (merge only). */
  skipped: Partial<Record<BackupTableName, number>>;
  restoredStorageKeys: string[];
  /** Tables the payload did not carry, and which were therefore left alone. */
  untouchedTables: BackupTableName[];
}

// ─── Export ───

function readLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof localStorage === 'undefined') return out;
  for (const key of BACKUP_STORAGE_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value != null) out[key] = value;
    } catch {
      /* private mode or a blocked origin — skip the key rather than fail the export */
    }
  }
  return out;
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const tables: Partial<Record<BackupTableName, unknown[]>> = {};
  for (const name of BACKUP_TABLE_NAMES) {
    tables[name] = await db.table(name).toArray();
  }
  return {
    version: BACKUP_PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tables,
    localStorage: readLocalStorage(),
  };
}

export async function exportAllData(): Promise<string> {
  return JSON.stringify(await buildBackupPayload(), null, 2);
}

// ─── Payload normalisation ───

/**
 * Read either payload shape.
 *
 * Version 1 was a flat object with five table arrays hanging off the root and
 * no localStorage. Those files are still on learners' disks, so they must keep
 * restoring — and, critically, must not be treated as "the other six tables are
 * empty".
 */
export function normalizePayload(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Backup file is not a valid JSON object');
  }
  const obj = raw as Record<string, unknown>;

  if (obj.version === 1 || (!obj.tables && Array.isArray(obj.words))) {
    const tables: Partial<Record<BackupTableName, unknown[]>> = {};
    for (const name of ['words', 'reviews', 'texts', 'studySessions', 'settings'] as const) {
      if (Array.isArray(obj[name])) tables[name] = obj[name] as unknown[];
    }
    return {
      version: 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
      schemaVersion: 0,
      tables,
      localStorage: {},
    };
  }

  if (!obj.tables || typeof obj.tables !== 'object') {
    throw new Error('Backup file has no recognisable table data');
  }

  const source = obj.tables as Record<string, unknown>;
  const tables: Partial<Record<BackupTableName, unknown[]>> = {};
  for (const name of BACKUP_TABLE_NAMES) {
    if (Array.isArray(source[name])) tables[name] = source[name] as unknown[];
  }

  const storage: Record<string, string> = {};
  const rawStorage = obj.localStorage;
  if (rawStorage && typeof rawStorage === 'object') {
    for (const [key, value] of Object.entries(rawStorage as Record<string, unknown>)) {
      // Only restore keys we own. A backup file must not be able to write
      // arbitrary origin storage.
      if ((BACKUP_STORAGE_KEYS as readonly string[]).includes(key) && typeof value === 'string') {
        storage[key] = value;
      }
    }
  }

  return {
    version: typeof obj.version === 'number' ? obj.version : BACKUP_PAYLOAD_VERSION,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : '',
    schemaVersion: typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 0,
    tables,
    localStorage: storage,
  };
}

/** Which tables a payload carries, and which it leaves untouched. */
export function tablesInPayload(payload: BackupPayload): {
  present: BackupTableName[];
  untouched: BackupTableName[];
} {
  const present = BACKUP_TABLE_NAMES.filter((n) => payload.tables[n] !== undefined);
  const untouched = BACKUP_TABLE_NAMES.filter((n) => payload.tables[n] === undefined);
  return { present, untouched };
}

// ─── Merge keys ───

type Row = Record<string, unknown>;

function numericMax(left: unknown, right: unknown): number | undefined {
  const values = [left, right].filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  );
  return values.length > 0 ? Math.max(...values) : undefined;
}

function earliestDate(left: unknown, right: unknown): string | null {
  const dates = [left, right].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
  return dates.sort()[0] ?? null;
}

export function mergeGuidedActivityProgress(
  existing: Row,
  incoming: Row,
): Row {
  return {
    ...incoming,
    ...existing,
    completedAt: earliestDate(existing.completedAt, incoming.completedAt),
    attempts: numericMax(existing.attempts, incoming.attempts) ?? 0,
    itemsCompleted:
      numericMax(existing.itemsCompleted, incoming.itemsCompleted) ?? 0,
    bestScore: numericMax(existing.bestScore, incoming.bestScore),
  };
}

/**
 * A stable identity for a row, used by merge mode to recognise something the
 * learner already has. Returns null when the row cannot be identified, in which
 * case merge treats it as new.
 */
export function mergeKey(table: BackupTableName, row: Row): string | null {
  switch (table) {
    case 'words':
      return row.word != null && row.language != null ? `${row.language}\u0000${row.word}` : null;
    case 'settings':
      return row.key != null ? String(row.key) : null;
    case 'dailyActivity':
      return row.date != null ? String(row.date) : null;
    case 'lessonProgress':
    case 'characterProgress':
    case 'badges':
    case 'guidedActivityProgress':
      return row.id != null ? String(row.id) : null;
    case 'studySessions':
      return row.startTime != null ? String(row.startTime) : null;
    case 'testHistory':
      return row.date != null ? `${row.language}\u0000${row.date}` : null;
    case 'texts':
      return row.title != null && row.createdAt != null
        ? `${row.title}\u0000${row.createdAt}`
        : null;
    // reviews and reviewLog are keyed off their parent word rather than
    // identified in their own right; they are handled during the word merge.
    default:
      return null;
  }
}

// ─── Import ───

function restoreLocalStorage(payload: BackupPayload): string[] {
  if (typeof localStorage === 'undefined') return [];
  const restored: string[] = [];
  for (const [key, value] of Object.entries(payload.localStorage)) {
    try {
      localStorage.setItem(key, value);
      restored.push(key);
    } catch {
      /* quota or private mode — keep going, the IndexedDB restore still counts */
    }
  }
  return restored;
}

function stripId(row: Row): Row {
  const copy = { ...row };
  delete copy.id;
  return copy;
}

/**
 * Overwrite the tables the payload carries, and only those.
 *
 * Primary keys are preserved so that `review.wordId`, `reviewLog.wordId` and
 * every other cross-table reference still resolves after the restore.
 */
async function importReplace(payload: BackupPayload): Promise<ImportResult> {
  const { present, untouched } = tablesInPayload(payload);
  const written: Partial<Record<BackupTableName, number>> = {};

  await db.transaction('rw', present.map((n) => db.table(n)), async () => {
    for (const name of present) {
      const rows = payload.tables[name] ?? [];
      await db.table(name).clear();
      if (rows.length) await db.table(name).bulkPut(rows as never[]);
      written[name] = rows.length;
    }
  });

  return {
    mode: 'replace',
    written,
    skipped: {},
    restoredStorageKeys: restoreLocalStorage(payload),
    untouchedTables: untouched,
  };
}

/**
 * Fold the payload into what is already there, keeping both.
 *
 * Words are matched on `[word+language]` and imported ones get fresh ids, so
 * their reviews and review-log entries are re-pointed at the new id rather than
 * colliding with an unrelated local row that happens to share a number.
 */
async function importMerge(payload: BackupPayload): Promise<ImportResult> {
  const { present, untouched } = tablesInPayload(payload);
  const written: Partial<Record<BackupTableName, number>> = {};
  const skipped: Partial<Record<BackupTableName, number>> = {};

  // Words, reviews and reviewLog move together so ids stay consistent.
  const relational: BackupTableName[] = ['words', 'reviews', 'reviewLog'];
  const standalone = present.filter((n) => !relational.includes(n));
  const tablesToLock = Array.from(new Set([...present, ...relational]));

  await db.transaction('rw', tablesToLock.map((n) => db.table(n)), async () => {
    // ─ Words (and everything hanging off them) ─
    const wordIdRemap = new Map<number, number>();
    if (payload.tables.words) {
      const incoming = payload.tables.words as Row[];
      const existing = await db.words.toArray();
      const existingKeys = new Set(
        existing
          .map((w) => mergeKey('words', w as unknown as Row))
          .filter((k): k is string => k !== null),
      );

      let added = 0;
      let dupes = 0;
      for (const row of incoming) {
        const key = mergeKey('words', row);
        if (key !== null && existingKeys.has(key)) {
          dupes++;
          continue;
        }
        const oldId = typeof row.id === 'number' ? row.id : null;
        const newId = (await db.words.add(stripId(row) as never)) as number;
        if (oldId !== null) wordIdRemap.set(oldId, newId);
        if (key !== null) existingKeys.add(key);
        added++;
      }
      written.words = added;
      skipped.words = dupes;
    }

    // ─ Reviews: only for words we actually imported ─
    if (payload.tables.reviews) {
      const incoming = payload.tables.reviews as Row[];
      let added = 0;
      let dropped = 0;
      for (const row of incoming) {
        const oldWordId = typeof row.wordId === 'number' ? row.wordId : null;
        const newWordId = oldWordId !== null ? wordIdRemap.get(oldWordId) : undefined;
        if (newWordId === undefined) {
          // The word was a duplicate we kept locally; its existing review
          // schedule is the live one and must win.
          dropped++;
          continue;
        }
        await db.reviews.add({ ...stripId(row), wordId: newWordId } as never);
        added++;
      }
      written.reviews = added;
      skipped.reviews = dropped;
    }

    if (payload.tables.reviewLog) {
      const incoming = payload.tables.reviewLog as Row[];
      let added = 0;
      let dropped = 0;
      for (const row of incoming) {
        const oldWordId = typeof row.wordId === 'number' ? row.wordId : null;
        const newWordId = oldWordId !== null ? wordIdRemap.get(oldWordId) : undefined;
        if (newWordId === undefined) {
          dropped++;
          continue;
        }
        await db.reviewLog.add({ ...stripId(row), wordId: newWordId } as never);
        added++;
      }
      written.reviewLog = added;
      skipped.reviewLog = dropped;
    }

    // ─ Everything else: add what is not already present ─
    for (const name of standalone) {
      const rows = (payload.tables[name] ?? []) as Row[];
      const existing = (await db.table(name).toArray()) as Row[];
      if (name === 'guidedActivityProgress') {
        const existingByKey = new Map(
          existing
            .map((row) => [mergeKey(name, row), row] as const)
            .filter(
              (entry): entry is readonly [string, Row] => entry[0] !== null,
            ),
        );
        for (const row of rows) {
          const key = mergeKey(name, row);
          const current = key == null ? undefined : existingByKey.get(key);
          const merged = current
            ? mergeGuidedActivityProgress(current, row)
            : row;
          await db.table(name).put(merged as never);
          if (key != null) existingByKey.set(key, merged);
        }
        written[name] = rows.length;
        skipped[name] = 0;
        continue;
      }
      const existingKeys = new Set(
        existing.map((r) => mergeKey(name, r)).filter((k): k is string => k !== null),
      );

      let added = 0;
      let dupes = 0;
      for (const row of rows) {
        const key = mergeKey(name, row);
        if (key !== null && existingKeys.has(key)) {
          dupes++;
          continue;
        }
        if (TABLES[name].autoIncrement) {
          await db.table(name).add(stripId(row) as never);
        } else {
          await db.table(name).put(row as never);
        }
        if (key !== null) existingKeys.add(key);
        added++;
      }
      written[name] = added;
      skipped[name] = dupes;
    }
  });

  return {
    mode: 'merge',
    written,
    skipped,
    // Merge never overwrites live settings/XP/badges from a file — that would
    // silently roll back progress made since the export.
    restoredStorageKeys: [],
    untouchedTables: untouched,
  };
}

export async function importAllData(
  json: string,
  mode: ImportMode = 'replace',
): Promise<ImportResult> {
  const payload = normalizePayload(JSON.parse(json));
  const { present } = tablesInPayload(payload);
  if (present.length === 0 && Object.keys(payload.localStorage).length === 0) {
    throw new Error('Backup file contains no data');
  }
  return mode === 'merge' ? importMerge(payload) : importReplace(payload);
}

export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
