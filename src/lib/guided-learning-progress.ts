import { markLessonComplete } from '../db/lessons';

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

  if (groups.length > 0 && groups.every((group) => completed.has(group))) {
    await markLessonComplete(language, guidedLessonId(alphabetName), 100);
  }
}
