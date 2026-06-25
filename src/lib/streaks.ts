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
 *
 * Two layers of forgiveness (kind learning):
 *  1. Implicit auto-freeze — allows 1 "freeze" per 7-day window when 6+ of the
 *     last 7 days have goalMet.
 *  2. Explicit freezes — a missed day is also bridged if it was already paid for
 *     with a freeze (`freezeUsed` on its activity record), or if the caller still
 *     has `availableFreezes` to spend proactively.
 */
export function calculateCurrentStreak(
  activities: DailyActivity[],
  availableFreezes = 0
): number {
  if (activities.length === 0) return 0;

  const metDates = new Set(
    activities.filter((a) => a.goalMet).map((a) => a.date)
  );
  const allDates = new Set(activities.map((a) => a.date));
  const frozenDates = new Set(
    activities.filter((a) => a.freezeUsed).map((a) => a.date)
  );
  const earliestDate = activities.reduce(
    (min, a) => (a.date < min ? a.date : min),
    activities[0].date
  );

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
  let explicitRemaining = availableFreezes;
  const cursor = new Date(startDate);

  for (let i = 0; i < 10000; i++) {
    const key = fmtDate(cursor);
    if (key < earliestDate) break;

    if (metDates.has(key)) {
      streak++;
    } else if (canFreeze(cursor, metDates, freezesUsed)) {
      freezesUsed++;
    } else if (frozenDates.has(key)) {
      // Already bridged with an explicit freeze on a previous reconcile
    } else if (explicitRemaining > 0) {
      explicitRemaining--;
    } else {
      break;
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
  /** Daily target in minutes. If omitted, falls back to weeklyGoalMinutes/7 for backward compatibility. */
  dailyGoalMinutes?: number;
  weeklyGoalMinutes?: number;
}): Promise<void> {
  const record = await getTodayActivity();

  record.studySeconds += updates.addSeconds ?? 0;
  record.cardsReviewed += updates.addCardsReviewed ?? 0;
  record.wordsAdded += updates.addWordsAdded ?? 0;

  const dailyTargetSeconds =
    updates.dailyGoalMinutes != null
      ? updates.dailyGoalMinutes * 60
      : ((updates.weeklyGoalMinutes ?? 0) * 60) / 7;
  record.goalMet = record.studySeconds >= dailyTargetSeconds;

  await db.dailyActivity.put(record);
}

/**
 * Pure helper: walking backward from today, return the gap dates that an
 * explicit freeze would need to bridge (i.e. not met, not auto-frozen, not
 * already paid for) up to `availableFreezes`. Used to persist freeze spending.
 */
export function computeFreezesToSpend(
  activities: DailyActivity[],
  availableFreezes: number
): string[] {
  if (availableFreezes <= 0 || activities.length === 0) return [];

  const metDates = new Set(
    activities.filter((a) => a.goalMet).map((a) => a.date)
  );
  const allDates = new Set(activities.map((a) => a.date));
  const frozenDates = new Set(
    activities.filter((a) => a.freezeUsed).map((a) => a.date)
  );
  const earliestDate = activities.reduce(
    (min, a) => (a.date < min ? a.date : min),
    activities[0].date
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmtDate(today);
  const startDate = allDates.has(todayKey) ? today : addDays(today, -1);

  if (!metDates.has(fmtDate(startDate)) && !allDates.has(fmtDate(startDate))) {
    return [];
  }

  const toSpend: string[] = [];
  let freezesUsed = 0;
  let remaining = availableFreezes;
  const cursor = new Date(startDate);

  for (let i = 0; i < 10000; i++) {
    const key = fmtDate(cursor);
    if (key < earliestDate) break;

    if (metDates.has(key)) {
      // met — continue
    } else if (canFreeze(cursor, metDates, freezesUsed)) {
      freezesUsed++;
    } else if (frozenDates.has(key)) {
      // already paid
    } else if (remaining > 0) {
      remaining--;
      toSpend.push(key);
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return toSpend;
}

/**
 * Persist explicit-freeze spending: marks bridged gap days with `freezeUsed`
 * and returns how many freezes were consumed so the caller can decrement the
 * user's freeze inventory. Only spends a freeze on a day with an existing
 * activity record OR creates a minimal frozen record for it.
 */
export async function reconcileFreezes(
  availableFreezes: number
): Promise<number> {
  const activities = await db.dailyActivity.toArray();
  const toSpend = computeFreezesToSpend(activities, availableFreezes);
  if (toSpend.length === 0) return 0;

  for (const date of toSpend) {
    const existing = await db.dailyActivity.get(date);
    if (existing) {
      existing.freezeUsed = true;
      await db.dailyActivity.put(existing);
    } else {
      await db.dailyActivity.put({
        date,
        studySeconds: 0,
        cardsReviewed: 0,
        wordsAdded: 0,
        goalMet: false,
        freezeUsed: true,
      });
    }
  }

  return toSpend.length;
}

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
