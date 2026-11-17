import type { BackupPayload, BackupTableName } from './backup';
import type { Word } from './schema';
import { storedCardKey } from '../lib/card-identity';

type Tables = BackupPayload['tables'];
type Row = Record<string, unknown>;

export function countVocabAttemptRows(rows: unknown): number {
  return Array.isArray(rows) ? rows.filter((row) =>
    !!row && typeof row === 'object' && typeof row.key === 'string' &&
    row.key.startsWith('vocab-attempt:v1:')).length : 0;
}

function meaningfulRows(name: BackupTableName, rows: unknown[] = []): number {
  const positive = (row: Row, fields: string[]) =>
    fields.some((field) => typeof row[field] === 'number' && row[field] > 0);
  switch (name) {
    case 'badges': return 0; // Can survive independently of the underlying history.
    case 'settings': return countVocabAttemptRows(rows);
    case 'studySessions':
      return rows.filter((row) => row && positive(row as Row, ['durationSeconds', 'xpEarned'])).length;
    case 'dailyActivity':
      return rows.filter((value) => {
        const row = value as Row | null;
        return row && (positive(row, ['studySeconds', 'cardsReviewed', 'wordsAdded']) ||
          row.goalMet || row.challengeComplete || row.freezeUsed);
      }).length;
    case 'lessonProgress':
      return rows.filter((value) => {
        const row = value as Row | null;
        return row && (row.completed || positive(row, ['attempts']));
      }).length;
    case 'characterProgress':
      return rows.filter((value) => {
        const row = value as Row | null;
        return row && (positive(row, ['totalAttempts', 'correctCount']) ||
          row.mastery === 'learning' || row.mastery === 'mastered');
      }).length;
    case 'guidedActivityProgress':
      return rows.filter((value) => {
        const row = value as Row | null;
        return row && (row.completedAt || positive(row, ['attempts', 'itemsCompleted']));
      }).length;
    case 'skillProgress':
      return rows.filter((row) => row && positive(row as Row, ['attempts', 'correct'])).length;
    default: return rows.length;
  }
}

export function recoveryHistoryRows(tables: Tables): number {
  return (Object.keys(tables) as BackupTableName[]).reduce(
    (sum, name) => sum + meaningfulRows(name, tables[name]), 0,
  );
}

/**
 * An entirely vanished history area is evidence only when an older copy
 * actually contains it. Decreasing counts alone are not loss: learners delete
 * words and edit their data. Keep the older copy when an area disappears.
 */
export function hasMissingRecoveryHistory(live: Tables, previous: Tables): boolean {
  if ((Object.keys(previous) as BackupTableName[]).some((name) =>
    live[name] !== undefined &&
    meaningfulRows(name, previous[name]) > 0 && meaningfulRows(name, live[name]) === 0,
  )) return true;

  // A little new progress after a reset must not erase the old copy, including
  // when IndexedDB has reused its numeric word IDs. A retained creation time
  // also recognises ordinary learner edits without treating them as a wipe.
  const liveWords = (live.words ?? []) as Word[];
  const oldWords = (previous.words ?? []) as Word[];
  const liveKeys = new Set(liveWords.map(storedCardKey));
  const liveById = new Map(liveWords.map((word) => [word.id, word]));
  if (oldWords.length && live.words !== undefined && !oldWords.some((word) => {
    const current = liveById.get(word.id);
    return liveKeys.has(storedCardKey(word)) ||
      (word.createdAt && current?.createdAt === word.createdAt);
  })) return true;

  return (['lessonProgress', 'characterProgress', 'guidedActivityProgress', 'skillProgress'] as const)
    .some((name) => {
      if (!live[name] || meaningfulRows(name, previous[name]) === 0) return false;
      const currentIds = new Set((live[name] as Row[]).map((row) => row.id));
      return !(previous[name] as Row[]).some((row) => currentIds.has(row.id));
    });
}
