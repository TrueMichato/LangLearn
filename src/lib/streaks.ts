import { db } from '../db/schema';
import type { DailyActivity } from '../db/schema';

/** Get today's date as YYYY-MM-DD in local timezone */
export function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate current streak: consecutive days backward from today where goalMet.
 * Allows 1 "freeze" per 7-day window — if 6+ of the last 7 days have goalMet,
 * a single missed day doesn't break the streak.
 */
export function calculateCurrentStreak(activities: DailyActivity[]): number {
  if (activities.length === 0) return 0;

  const metDates = new Set(
    activities.filter((a) => a.goalMet).map((a) => a.date)
  );
  const allDates = new Set(activities.map((a) => a.date));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = fmtDate(today);
  // If today has no activity at all, start counting from yesterday
  const startDate = allDates.has(todayKey) ? today : addDays(today, -1);

  // If the start date also has no met goal and no freeze possible, streak is 0
  if (!metDates.has(fmtDate(startDate)) && !allDates.has(fmtDate(startDate))) {
    return 0;
  }

  let streak = 0;
  let freezesUsed = 0;
  const cursor = new Date(startDate);

  for (let i = 0; i < 10000; i++) {
    const key = fmtDate(cursor);

    if (metDates.has(key)) {
      streak++;
    } else {
      if (canFreeze(cursor, metDates, freezesUsed)) {
        freezesUsed++;
      } else {
        break;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Calculate longest streak from all data */
export function calculateLongestStreak(activities: DailyActivity[]): number {
  if (activities.length === 0) return 0;

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;

  for (const a of sorted) {
    if (a.goalMet) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

/** Get or create today's activity record */
export async function getTodayActivity(): Promise<DailyActivity> {
  const date = todayStr();
  const existing = await db.dailyActivity.get(date);
  if (existing) return existing;

  const record: DailyActivity = {
    date,
    studySeconds: 0,
    cardsReviewed: 0,
    wordsAdded: 0,
    goalMet: false,
  };
  await db.dailyActivity.put(record);
  return record;
}

/** Update today's activity (called when study session ends) */
export async function updateDailyActivity(updates: {
  addSeconds?: number;
  addCardsReviewed?: number;
  addWordsAdded?: number;
  weeklyGoalMinutes: number;
}): Promise<void> {
  const record = await getTodayActivity();

  record.studySeconds += updates.addSeconds ?? 0;
  record.cardsReviewed += updates.addCardsReviewed ?? 0;
  record.wordsAdded += updates.addWordsAdded ?? 0;

  // daily target = weeklyGoalMinutes * 60 / 7 seconds
  const dailyTargetSeconds = (updates.weeklyGoalMinutes * 60) / 7;
  record.goalMet = record.studySeconds >= dailyTargetSeconds;

  await db.dailyActivity.put(record);
}

// --- helpers ---

function fmtDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

/**
 * Check if we can use a freeze for the given date.
 * A freeze is allowed if 6+ of the surrounding 7-day window have goalMet.
 * Only 1 freeze per 7-day window.
 */
function canFreeze(
  date: Date,
  metDates: Set<string>,
  freezesAlreadyUsed: number
): boolean {
  // Only allow 1 freeze per 7-day window
  if (freezesAlreadyUsed > 0) return false;

  // Count goalMet days in the 7-day window ending at this date
  let metCount = 0;
  for (let i = 1; i <= 6; i++) {
    const d = addDays(date, -i);
    if (metDates.has(fmtDate(d))) metCount++;
  }
  // Also check days after (up to make a 7-day window)
  for (let i = 1; i <= 6; i++) {
    const d = addDays(date, i);
    if (metDates.has(fmtDate(d))) metCount++;
  }

  return metCount >= 6;
}
