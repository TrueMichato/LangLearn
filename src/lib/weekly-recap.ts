import { db } from '../db/schema';
import type { Word, Review, StudySession, ReviewLogEntry, DailyActivity } from '../db/schema';
import { getWeakestWords } from './analytics';

export interface WeeklyRecap {
  wordsLearned: number;
  reviews: number;
  studyMinutes: number;
  xp: number;
  activeDays: number;
  topFocus: Array<{ word: Word; review: Review }>;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Stable key for the current ISO week (e.g. "2026-W26"), used to gate the recap. */
export function currentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Pure helper: build the 7-day recap from already-fetched data.
 * `sinceIso` is the inclusive lower bound (ISO) for "this week".
 */
export function summarizeWeek(input: {
  words: Word[];
  sessions: StudySession[];
  logs: ReviewLogEntry[];
  activities: DailyActivity[];
  topFocus: Array<{ word: Word; review: Review }>;
  sinceIso: string;
}): WeeklyRecap {
  const { words, sessions, logs, activities, topFocus, sinceIso } = input;
  const sinceDate = sinceIso.slice(0, 10);

  const wordsLearned = words.filter((w) => w.createdAt >= sinceIso).length;
  const reviews = logs.filter((l) => l.date >= sinceIso).length;

  const weekSessions = sessions.filter((s) => s.startTime >= sinceIso);
  const studyMinutes = Math.round(
    weekSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );
  const xp = weekSessions.reduce((sum, s) => sum + s.xpEarned, 0);

  const activeDays = activities.filter(
    (a) => a.date >= sinceDate && (a.studySeconds > 0 || a.goalMet)
  ).length;

  return { wordsLearned, reviews, studyMinutes, xp, activeDays, topFocus };
}

/** Aggregate the last 7 days of activity into a recap. */
export async function getWeeklyRecap(languages?: string[]): Promise<WeeklyRecap> {
  const sinceIso = isoDaysAgo(7);

  const [words, sessions, logs, activities] = await Promise.all([
    db.words.toArray(),
    db.studySessions.toArray(),
    db.reviewLog.toArray(),
    db.dailyActivity.toArray(),
  ]);

  const langSet = languages && languages.length > 0 ? new Set(languages) : null;
  const filteredWords = langSet ? words.filter((w) => langSet.has(w.language)) : words;
  const filteredLogs = langSet ? logs.filter((l) => langSet.has(l.language)) : logs;

  const topFocus = await getWeakestWords(3, langSet && langSet.size === 1 ? languages![0] : undefined);

  return summarizeWeek({
    words: filteredWords,
    sessions,
    logs: filteredLogs,
    activities,
    topFocus,
    sinceIso,
  });
}
