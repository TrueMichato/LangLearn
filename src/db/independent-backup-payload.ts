import { BACKUP_STORAGE_KEYS, BACKUP_TABLE_NAMES, type BackupTableName } from './backup';
import { CURRENT_SCHEMA_VERSION, db } from './schema';
import { BackupError, isISO, isRecord, isSafeCount } from '../lib/backup-crypto';
import { recoveryHistoryRows } from './recovery-history';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { useBadgeStore } from '../stores/badgeStore';
import { useStudySetsStore } from '../stores/studySetsStore';
import { isAssessmentDraft } from '../lib/lesson-assessment-draft';

export interface IndependentBackupPayload {
  version: 1;
  schemaVersion: number;
  capturedAt: string;
  tables: Record<BackupTableName, Record<string, unknown>[]>;
  localStorage: Record<string, string>;
}

export const DEVICE_ONLY_SETTINGS = new Set(['push-endpoint', 'push-last-worker-check', 'push-last-sync-at']);
export const ASSESSMENT_STORAGE_KEY = 'langlearn-assessment-drafts';
export function isIndependentStorageKey(key: string): boolean {
  return (BACKUP_STORAGE_KEYS as readonly string[]).includes(key) ||
    key === ASSESSMENT_STORAGE_KEY || /^langlearn-guided-[a-z]{2}-[^/]{1,120}$/.test(key);
}

const numericIds = new Set<BackupTableName>(['words', 'reviews', 'texts', 'studySessions', 'testHistory', 'reviewLog']);
const stringArray = (v: unknown) => Array.isArray(v) && v.every((item) => typeof item === 'string');
const finite = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const boolean = (v: unknown) => typeof v === 'boolean';
const text = (v: unknown) => typeof v === 'string';
type Check = (v: unknown) => boolean;

const rowFields: Record<BackupTableName, Record<string, Check>> = {
  words: { language: text, word: text, reading: text, meaning: text, contextSentence: text,
    sourceTextId: (v) => v === null || (isSafeCount(v) && v > 0), tags: stringArray,
    type: (v) => ['word', 'letter', 'grammar'].includes(v as string), createdAt: text },
  reviews: { wordId: (v) => isSafeCount(v) && v > 0, ease: finite, interval: finite,
    repetitions: isSafeCount, nextReviewDate: text, lastReviewDate: text },
  texts: { language: text, title: text, content: text, createdAt: text },
  studySessions: { startTime: text, endTime: (v) => v === null || text(v), durationSeconds: finite, activity: text, xpEarned: finite },
  settings: { key: text, value: text },
  dailyActivity: { date: (v) => typeof v === 'string' && /^\d{4}-\d\d-\d\d$/.test(v),
    studySeconds: finite, cardsReviewed: isSafeCount, wordsAdded: isSafeCount, goalMet: boolean },
  lessonProgress: { language: text, lessonId: text, completed: boolean, quizScore: finite, completedAt: text, attempts: isSafeCount },
  characterProgress: { language: text, character: text, romanji: text, correctCount: isSafeCount,
    totalAttempts: isSafeCount, lastPracticed: text, mastery: (v) => ['new', 'learning', 'mastered'].includes(v as string) },
  testHistory: { language: text, type: (v) => ['vocabulary', 'grammar', 'mixed', 'full'].includes(v as string),
    score: finite, level: text, totalQuestions: isSafeCount, correctAnswers: isSafeCount, durationSeconds: finite, date: text },
  badges: { unlockedAt: text },
  reviewLog: { reviewId: (v) => isSafeCount(v) && v > 0, wordId: (v) => isSafeCount(v) && v > 0,
    language: text, grade: (v) => isSafeCount(v) && v <= 5, isLapse: boolean, date: text },
  guidedActivityProgress: { language: text, milestoneId: text, activity: text,
    completedAt: (v) => v === null || text(v), attempts: isSafeCount, itemsCompleted: isSafeCount },
  skillProgress: { language: text, activity: (v) => ['minimal-pairs', 'numbers'].includes(v as string),
    skill: text, attempts: isSafeCount, correct: isSafeCount },
};

function validFields(value: unknown, required: Record<string, Check>, optional: Record<string, Check> = {}): boolean {
  return isRecord(value) && Object.entries(required).every(([key, check]) => check(value[key])) &&
    Object.entries(optional).every(([key, check]) => !Object.hasOwn(value, key) || check(value[key]));
}

const grammarMetadata: Record<string, Check> = {
  grammarRule: text,
  grammarKind: (value) => value === 'rule' || value === 'concept',
  grammarFormat: (value) => value === 'qa' || value === 'cloze',
};
const validLessonSource = (value: unknown) => validFields(value, {
  lessonId: text, itemId: text, provenance: (v) => ['authored', 'legacy', 'formatting', 'custom'].includes(v as string),
}, {
  sourceSection: text,
  legacyAliases: (v) => Array.isArray(v) && v.every((alias) => validFields(alias, { rule: text, example: text })),
});

const wordOptionalFields: Record<string, Check> = {
  ...grammarMetadata,
  learnerEdited: boolean,
  lessonSource: validLessonSource,
  lessonSources: (value) => Array.isArray(value) && value.every(validLessonSource),
  lessonSourceSnapshot: (value) => validFields(value, {
    word: text, reading: text, meaning: text, contextSentence: text,
  }, grammarMetadata),
};

function invalid(message: string): never {
  throw new BackupError('invalid-payload', `${message} Nothing was restored. Keep the original file unchanged.`);
}

function assertSafeJSON(value: unknown, depth = 0): void {
  if (depth > 40) invalid('The backup has excessively nested data.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || finite(value)) return;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) invalid('The backup has a sparse array.');
      assertSafeJSON(value[index], depth + 1);
    }
    return;
  }
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) invalid('The backup has an invalid value.');
  for (const [key, v] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid('The backup has unsafe object keys.');
    assertSafeJSON(v, depth + 1);
  }
}

/** Capture only: IndexedDB retains explicit undefined optionals that JSON objects omit. */
function normalizeCapturedJSON(value: unknown, depth = 0): unknown {
  if (depth > 40) invalid('The captured data has excessively nested values.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || finite(value)) return value;
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).some((key) =>
      key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))) {
      invalid('The captured data has an unsupported array property.');
    }
    return Array.from({ length: value.length }, (_, index) => {
      const property = Object.getOwnPropertyDescriptor(value, index);
      if (!property || !('value' in property) || property.value === undefined) {
        invalid('The captured data has an undefined or sparse array entry.');
      }
      return normalizeCapturedJSON(property.value, depth + 1);
    });
  }
  if (!isRecord(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    invalid('The captured data has a nonfinite number or unsupported value.');
  }
  const out: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) {
      invalid('The captured data has unsafe object keys.');
    }
    const property = Object.getOwnPropertyDescriptor(value, key)!;
    if (!property.enumerable || !('value' in property)) invalid('The captured data has an unsupported object property.');
    if (property.value !== undefined) out[key] = normalizeCapturedJSON(property.value, depth + 1);
  }
  return out;
}

const storeVersions: Record<string, number> = {
  'langlearn-settings': 1, 'langlearn-xp': 2, 'langlearn-badges': 1, 'langlearn-study-sets': 2,
};
function defaultStoreValues(): Record<string, object> {
  return {
    'langlearn-settings': useSettingsStore.getInitialState(),
    'langlearn-xp': useXPStore.getInitialState(),
    'langlearn-badges': useBadgeStore.getInitialState(),
    'langlearn-study-sets': useStudySetsStore.getInitialState(),
  };
}

function validateStorage(key: string, raw: string): void {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { invalid('A saved browser state is not valid JSON.'); }
  assertSafeJSON(value);
  if (key.startsWith('langlearn-guided-')) {
    if (!stringArray(value)) invalid('Saved letter progress is malformed.');
    return;
  }
  if (!isRecord(value)) invalid('A saved browser state is malformed.');
  if (key === ASSESSMENT_STORAGE_KEY) {
    if (value.version !== 1 || !Array.isArray(value.drafts) || !value.drafts.every(isAssessmentDraft)) {
      invalid('The assessment drafts are malformed or need a newer app.');
    }
    return;
  }
  if (value.version !== storeVersions[key] || !isRecord(value.state)) {
    invalid('A saved store needs a different app version or is malformed.');
  }
  const state = value.state;
  // Persisted functions must never shadow the live store's actions on hydration.
  if (Object.keys(state).some((name) => /^(set[A-Z]|add[A-Z]|remove[A-Z]|toggle[A-Z]|complete[A-Z]|consume[A-Z]|grant[A-Z]|credit[A-Z]|unlock[A-Z]|clear[A-Z]|isUnlocked$|updateSet$|deleteSet$|ensureDefaults$)/.test(name))) {
    invalid('A saved store contains an invalid action field.');
  }
  if (key === 'langlearn-xp' && (!isSafeCount(state.bonusXP) || !isRecord(state.creditedVocabAttempts) ||
    Object.values(state.creditedVocabAttempts).some((v) => !isSafeCount(v)))) invalid('Saved XP or reward tokens are malformed.');
  if (key === 'langlearn-settings' && (!stringArray(state.activeLanguages) || !text(state.currentLanguage) ||
    !boolean(state.onboardingComplete))) invalid('Saved learning settings are malformed.');
  if (key === 'langlearn-settings') {
    for (const [field, v] of Object.entries(state)) {
      const expected = (defaultStoreValues()[key] as Record<string, unknown>)[field];
      if (expected !== undefined && typeof expected !== 'function' &&
        (Array.isArray(expected) ? !stringArray(v) : typeof expected !== typeof v || (typeof v === 'number' && !finite(v)))) {
        invalid('Saved learning settings contain an invalid value.');
      }
    }
  }
  if (key === 'langlearn-badges' && (!isRecord(state.unlockedBadges) ||
    Object.values(state.unlockedBadges).some((v) => !text(v)))) invalid('Saved badges are malformed.');
  if (key === 'langlearn-study-sets' && (!Array.isArray(state.sets) || state.sets.some((set) =>
    !isRecord(set) || !text(set.id) || !text(set.name) || !text(set.description) ||
    !['custom', 'smart'].includes(set.type as string) || !stringArray(set.tags) ||
    (set.wordIds !== undefined && (!Array.isArray(set.wordIds) || set.wordIds.some((id) => !isSafeCount(id) || id === 0))) ||
    (set.selectionMode !== undefined && !['manual', 'tags'].includes(set.selectionMode as string))))) {
    invalid('Saved study sets are malformed.');
  }
}

/** Unlike legacy import, this never normalizes, drops unknown tables, or fills absent history. */
export function validateIndependentPayload(raw: unknown): IndependentBackupPayload {
  if (!isRecord(raw) || raw.version !== 1 || raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new BackupError('unsupported-payload', 'This checkpoint needs a different app/schema version. Update LangLearn; keep the checkpoint unchanged.');
  }
  if (Object.keys(raw).sort().join() !== ['version', 'schemaVersion', 'capturedAt', 'tables', 'localStorage'].sort().join() ||
    !isISO(raw.capturedAt) || !isRecord(raw.tables) || !isRecord(raw.localStorage) ||
    Object.keys(raw.tables).sort().join() !== [...BACKUP_TABLE_NAMES].sort().join()) invalid('The full backup is incomplete or has unknown tables.');
  if (BACKUP_STORAGE_KEYS.some((key) => !Object.hasOwn(raw.localStorage as object, key))) invalid('The full backup is missing a persisted learning store.');
  assertSafeJSON(raw);
  for (const name of BACKUP_TABLE_NAMES) {
    const rows = raw.tables[name];
    if (!Array.isArray(rows) || rows.length > 500_000) invalid('A backup table is missing or too large.');
    const keys = new Set<unknown>();
    for (const row of rows) {
      if (!isRecord(row)) invalid('A backup table contains an invalid row.');
      const key = row[name === 'settings' ? 'key' : name === 'dailyActivity' ? 'date' : 'id'];
      if (numericIds.has(name) ? !isSafeCount(key) || key === 0 : typeof key !== 'string' || !key) invalid('A saved row has an invalid primary key.');
      if (keys.has(key)) invalid('A backup table has duplicate primary keys.');
      keys.add(key);
      if (Object.entries(rowFields[name]).some(([field, check]) => !check(row[field]))) invalid(`The ${name} table contains malformed data.`);
      if (name === 'words' && !validFields(row, {}, wordOptionalFields)) invalid('A saved card contains malformed lesson metadata.');
      if (name === 'reviews' && !validFields(row, {}, { stability: finite, difficulty: finite })) invalid('A saved review contains malformed scheduling metadata.');
      if (name === 'settings' && DEVICE_ONLY_SETTINGS.has(row.key as string)) invalid('The checkpoint contains device-only push credentials.');
    }
  }
  const wordIds = new Set((raw.tables.words as Record<string, unknown>[]).map((row) => row.id));
  if ((raw.tables.reviews as Record<string, unknown>[]).some((row) => !wordIds.has(row.wordId))) {
    invalid('An active review points to a missing vocabulary card. Preserve a local export and repair the source or choose another checkpoint.');
  }
  // reviewLog, deleted source texts, and manual sets are historical references:
  // a missing target is retained as-is, never replaced with an invented card.
  for (const [key, value] of Object.entries(raw.localStorage)) {
    if (!isIndependentStorageKey(key) || typeof value !== 'string' || value.length > 4_000_000) invalid('The checkpoint contains an unsupported browser state.');
    validateStorage(key, value);
  }
  return raw as unknown as IndependentBackupPayload;
}

export function readIndependentStorage(storage: Storage, includeDefaults = true): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = new Set<string>(BACKUP_STORAGE_KEYS);
  keys.add(ASSESSMENT_STORAGE_KEY);
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && isIndependentStorageKey(key)) keys.add(key);
  }
  for (const key of [...keys].sort()) {
    const value = storage.getItem(key);
    if (value !== null) out[key] = value;
    else if (includeDefaults && Object.hasOwn(storeVersions, key)) {
      out[key] = JSON.stringify({ version: storeVersions[key], state: defaultStoreValues()[key] });
    }
  }
  return out;
}

export async function readIndependentPayload(storage: Storage): Promise<IndependentBackupPayload> {
  const tables = {} as IndependentBackupPayload['tables'];
  await db.transaction('r', BACKUP_TABLE_NAMES.map((name) => db.table(name)), async () => {
    await Promise.all(BACKUP_TABLE_NAMES.map(async (name) => {
      const rows = await db.table(name).toArray() as Record<string, unknown>[];
      tables[name] = name === 'settings' ? rows.filter((row) => !DEVICE_ONLY_SETTINGS.has(row.key as string)) : rows;
    }));
  });
  return { version: 1, schemaVersion: CURRENT_SCHEMA_VERSION, capturedAt: new Date().toISOString(),
    tables, localStorage: readIndependentStorage(storage) };
}

function canonicalTables(payload: IndependentBackupPayload) {
  return Object.fromEntries(BACKUP_TABLE_NAMES.map((name) => {
    const key = name === 'settings' ? 'key' : name === 'dailyActivity' ? 'date' : 'id';
    const rows = [...payload.tables[name]].sort((a, b) => typeof a[key] === 'number'
      ? (a[key] as number) - (b[key] as number) : String(a[key]) < String(b[key]) ? -1 : String(a[key]) > String(b[key]) ? 1 : 0);
    return [name, rows];
  }));
}

export function independentTablesContent(payload: IndependentBackupPayload): string {
  return stableBackupJSON([payload.schemaVersion, canonicalTables(payload)]);
}

export function payloadContent(payload: IndependentBackupPayload): string {
  return stableBackupJSON([payload.schemaVersion, canonicalTables(payload), payload.localStorage]);
}

export function stableBackupJSON(value: unknown): string {
  return JSON.stringify(value, (_key, v) => isRecord(v)
    ? Object.fromEntries(Object.keys(v).sort().map((key) => [key, v[key]])) : v);
}

export async function captureIndependentPayload(
  storage: Storage, revision: () => number,
): Promise<IndependentBackupPayload> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = revision();
    const storageBefore = JSON.stringify(readIndependentStorage(storage));
    const first = normalizeCapturedJSON(await readIndependentPayload(storage)) as IndependentBackupPayload;
    // Let committed-write observers and deferred Zustand persistence settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const second = normalizeCapturedJSON(await readIndependentPayload(storage)) as IndependentBackupPayload;
    if (before === revision() && storageBefore === JSON.stringify(second.localStorage) &&
      payloadContent(first) === payloadContent(second)) return validateIndependentPayload(second);
  }
  throw new BackupError('capture-busy', 'Your progress kept changing during capture. Pause study briefly and retry the backup; previous copies are safe.');
}

/** Conservative: a settings preference alone is harmless; learner work of any kind refuses replacement. */
export function assertFreshRestoreTarget(payload: IndependentBackupPayload): void {
  if (BACKUP_TABLE_NAMES.some((name) => name !== 'settings' && payload.tables[name].length > 0) ||
    payload.tables.settings.some((row) => !DEVICE_ONLY_SETTINGS.has(row.key as string)) ||
    Object.entries(payload.localStorage).some(([key, raw]) => {
      const value = JSON.parse(raw);
      if (key === 'langlearn-settings') return (value.state.lastFreezeGrantMilestone ?? 0) > 0 ||
        (value.state.streakFreezes !== undefined && value.state.streakFreezes !== useSettingsStore.getInitialState().streakFreezes);
      if (key === 'langlearn-xp') return value.state.bonusXP > 0 || Object.keys(value.state.creditedVocabAttempts).length > 0;
      if (key === 'langlearn-badges') return Object.keys(value.state.unlockedBadges).length > 0;
      if (key === 'langlearn-study-sets') return value.state.sets.some((set: { type: string }) => set.type !== 'smart');
      return key === ASSESSMENT_STORAGE_KEY ? value.drafts.length > 0 : value.length > 0;
    })) {
    throw new BackupError('existing-progress', 'This browser already has saved learning data. Nothing was replaced. Export its current data and use a fresh browser profile for this recovery kit; automatic merging is not safe.');
  }
}

/** Count all authoritative rows plus nonempty browser progress; never count device settings or snapshots. */
export function independentProgressRows(payload: IndependentBackupPayload): number {
  let count = recoveryHistoryRows(payload.tables);
  count += payload.tables.settings.filter((row) => String(row.key).startsWith('vocab-receipt:')).length;
  for (const [key, raw] of Object.entries(payload.localStorage)) {
    const value = JSON.parse(raw);
    if (key === 'langlearn-xp') count += value.state.bonusXP > 0 ? 1 : 0;
    else if (key === 'langlearn-study-sets') count += value.state.sets.filter((set: { type: string }) => set.type === 'custom').length;
    else if (key === 'langlearn-badges') count += Object.keys(value.state.unlockedBadges).length;
    else if (key === ASSESSMENT_STORAGE_KEY) count += value.drafts.length;
    else if (key.startsWith('langlearn-guided-')) count += value.length;
  }
  return count;
}
