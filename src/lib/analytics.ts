import { db } from '../db/schema';
import type { Word, Review } from '../db/schema';

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/** Retention (% correct) per day for the last N days. */
export async function getRetentionData(
  days: number
): Promise<{ date: string; percent: number }[]> {
  const start = daysAgo(days);
  const reviews = await db.reviews.toArray();

  // Bucket reviews by lastReviewDate
  const buckets = new Map<string, { total: number; correct: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(toDateString(d), { total: 0, correct: 0 });
  }

  for (const r of reviews) {
    if (!r.lastReviewDate) continue;
    const key = r.lastReviewDate.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total++;
    // A review with ease >= 2.5 and repetitions > 0 counts as correct
    if (r.repetitions > 0 && r.ease >= 2.5) {
      bucket.correct++;
    }
  }

  return Array.from(buckets.entries()).map(([date, { total, correct }]) => ({
    date,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
  }));
}

/** Number of cards due each day for the next N days. */
export async function getReviewForecast(
  days: number
): Promise<{ date: string; count: number }[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviews = await db.reviews.toArray();

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    buckets.set(toDateString(d), 0);
  }

  for (const r of reviews) {
    if (!r.nextReviewDate) continue;
    const key = r.nextReviewDate.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + 1);
    }
    // Cards already overdue count toward today
    if (new Date(r.nextReviewDate) < today) {
      const todayKey = toDateString(today);
      if (buckets.has(todayKey)) {
        buckets.set(todayKey, buckets.get(todayKey)! + 1);
      }
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

/** Top N weakest words (lowest ease factor). */
export async function getWeakestWords(
  limit: number
): Promise<Array<{ word: Word; review: Review }>> {
  const reviews = await db.reviews.toArray();
  // Sort by ease ascending (weakest first)
  reviews.sort((a, b) => a.ease - b.ease);
  const top = reviews.slice(0, limit);

  const result: Array<{ word: Word; review: Review }> = [];
  for (const review of top) {
    const word = await db.words.get(review.wordId);
    if (word) {
      result.push({ word, review });
    }
  }
  return result;
}

/** Distribution of cards by mastery level. */
export async function getMasteryDistribution(): Promise<{
  new: number;
  learning: number;
  mastered: number;
}> {
  const reviews = await db.reviews.toArray();
  let newCount = 0;
  let learning = 0;
  let mastered = 0;

  for (const r of reviews) {
    if (r.repetitions === 0) newCount++;
    else if (r.repetitions <= 3) learning++;
    else mastered++;
  }

  return { new: newCount, learning, mastered };
}

/** Study minutes per day for the last N days. */
export async function getStudyTimeTrend(
  days: number
): Promise<{ date: string; minutes: number }[]> {
  const start = daysAgo(days);
  const sessions = await db.studySessions.toArray();

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(toDateString(d), 0);
  }

  for (const s of sessions) {
    if (!s.startTime) continue;
    const key = s.startTime.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + s.durationSeconds);
    }
  }

  return Array.from(buckets.entries()).map(([date, seconds]) => ({
    date,
    minutes: Math.round(seconds / 60),
  }));
}

/** 7-day retention rate as a single percentage + review count. */
export async function get7DayRetention(): Promise<{
  percent: number;
  reviewCount: number;
}> {
  const start = daysAgo(7);
  const startStr = toDateString(start);
  const reviews = await db.reviews.toArray();

  let total = 0;
  let correct = 0;

  for (const r of reviews) {
    if (!r.lastReviewDate) continue;
    if (r.lastReviewDate.slice(0, 10) < startStr) continue;
    total++;
    if (r.repetitions > 0 && r.ease >= 2.5) {
      correct++;
    }
  }

  return {
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    reviewCount: total,
  };
}

/** Time spent per activity type over the last N days. */
export async function getActivityBalance(
  days: number
): Promise<{ activity: string; minutes: number }[]> {
  const start = daysAgo(days);
  const startStr = toDateString(start);
  const sessions = await db.studySessions.toArray();

  const buckets = new Map<string, number>();

  for (const s of sessions) {
    if (!s.startTime) continue;
    if (s.startTime.slice(0, 10) < startStr) continue;
    const key = s.activity;
    buckets.set(key, (buckets.get(key) ?? 0) + s.durationSeconds);
  }

  return Array.from(buckets.entries())
    .map(([activity, seconds]) => ({
      activity,
      minutes: Math.round(seconds / 60),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Aggregate stats for the summary section. */
export async function getOverallStats(): Promise<{
  totalWords: number;
  totalReviews: number;
  averageEase: number;
  totalStudyMinutes: number;
}> {
  const [words, reviews, sessions] = await Promise.all([
    db.words.count(),
    db.reviews.toArray(),
    db.studySessions.toArray(),
  ]);

  const totalStudySeconds = sessions.reduce(
    (sum, s) => sum + s.durationSeconds,
    0
  );
  const averageEase =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.ease, 0) / reviews.length
      : 0;

  return {
    totalWords: words,
    totalReviews: reviews.length,
    averageEase: Math.round(averageEase * 100) / 100,
    totalStudyMinutes: Math.round(totalStudySeconds / 60),
  };
}
