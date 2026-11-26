import { markLessonComplete } from '../db/lessons';
import { db } from '../db/schema';
import { NEXT_GUIDED_GROUP } from './routes';
import { notifyBackupSourceChanged } from './backup-source';

const GROUP_ORDER = [
  'Vowels',
  'K-row',
  'S-row',
  'T-row',
  'N-row',
  'H-row',
  'M-row',
  'Y-row',
  'R-row',
  'W-row',
  'Dakuten',
  'Handakuten',
  'Yōon',
  'Yōon-Dakuten',
  'Yōon-Handakuten',
  'Sokuon',
];

function storageKey(alphabetName: string, language: string): string {
  return `langlearn-guided-${language}-${alphabetName}`;
}

function scriptDeferralKey(language: string): string {
  return `guided-script-deferred-v1/${language}`;
}

export async function loadScriptPreparationDeferred(language: string): Promise<boolean> {
  return (await db.settings.get(scriptDeferralKey(language)))?.value === 'true';
}

/** Choosing lessons changes recommendations, never script progress or evidence. */
export async function deferScriptPreparation(language: string): Promise<void> {
  await db.settings.put({ key: scriptDeferralKey(language), value: 'true' });
  notifyBackupSourceChanged();
}

export function guidedLessonId(alphabetName: string): string {
  return `letters/${alphabetName}`;
}

export function getOrderedGuidedGroups(groups: Iterable<string>): string[] {
  const groupSet = new Set(groups);
  const ordered = GROUP_ORDER.filter((group) => groupSet.has(group));
  for (const group of groupSet) {
    if (!ordered.includes(group)) ordered.push(group);
  }
  return ordered;
}

export function getGuidedGroupStatus(
  group: string,
  groups: readonly string[],
  completed: ReadonlySet<string>,
): 'completed' | 'unlocked' | 'locked' {
  if (!groups.includes(group)) return 'locked';
  if (completed.has(group)) return 'completed';
  const index = groups.indexOf(group);
  return index === 0 || completed.has(groups[index - 1]) ? 'unlocked' : 'locked';
}

/** Query values are persisted group names, never positions in the catalog. */
export function resolveGuidedGroupEntry(
  requested: string | undefined,
  groups: readonly string[],
  completed: ReadonlySet<string>,
): { group: string; error: string } {
  if (requested === undefined) return { group: '', error: '' };
  const group = requested === NEXT_GUIDED_GROUP
    ? groups.find((item) => getGuidedGroupStatus(item, groups, completed) === 'unlocked') ?? groups[0]
    : requested;
  if (!group || !groups.includes(group)) {
    return { group: '', error: 'That column could not be found. Choose an available column below.' };
  }
  if (getGuidedGroupStatus(group, groups, completed) === 'locked') {
    return { group: '', error: 'That column is still locked. Complete the earlier columns first.' };
  }
  return { group, error: '' };
}

export function loadCompletedGuidedGroups(
  alphabetName: string,
  language: string,
): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(alphabetName, language));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function isGuidedAlphabetComplete(
  alphabetName: string,
  language: string,
  groups: readonly string[],
): boolean {
  if (groups.length === 0) return false;
  const completed = loadCompletedGuidedGroups(alphabetName, language);
  return groups.every((group) => completed.has(group));
}

export async function saveCompletedGuidedGroups(
  alphabetName: string,
  language: string,
  completed: Set<string>,
  groups: readonly string[],
): Promise<void> {
  localStorage.setItem(
    storageKey(alphabetName, language),
    JSON.stringify([...completed]),
  );
  notifyBackupSourceChanged();

  if (groups.length > 0 && groups.every((group) => completed.has(group))) {
    await markLessonComplete(language, guidedLessonId(alphabetName), 100);
  }
}
