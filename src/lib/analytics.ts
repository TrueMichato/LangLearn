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

/** Get word IDs for a specific language (for filtering reviews). */
async function getWordIdsForLanguage(language: string): Promise<Set<number>> {
  const ids = await db.words.where('language').equals(language).primaryKeys();
  return new Set(ids as number[]);
}

/** Retention (% correct) per day for the last N days. */
export async function getRetentionData(
  days: number,
  language?: string
): Promise<{ date: string; percent: number }[]> {
  const start = daysAgo(days);
  let reviews = await db.reviews.toArray();

  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    reviews = reviews.filter(r => wordIds.has(r.wordId));
  }

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
  days: number,
  language?: string
): Promise<{ date: string; count: number }[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let reviews = await db.reviews.toArray();

  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    reviews = reviews.filter(r => wordIds.has(r.wordId));
  }

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
  limit: number,
  language?: string
): Promise<Array<{ word: Word; review: Review }>> {
  let reviews = await db.reviews.toArray();

  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    reviews = reviews.filter(r => wordIds.has(r.wordId));
  }

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
export async function getMasteryDistribution(language?: string): Promise<{
  new: number;
  learning: number;
  mastered: number;
}> {
  let reviews = await db.reviews.toArray();

  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    reviews = reviews.filter(r => wordIds.has(r.wordId));
  }

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
export async function get7DayRetention(language?: string): Promise<{
  percent: number;
  reviewCount: number;
}> {
  const start = daysAgo(7);
  const startStr = toDateString(start);
  let reviews = await db.reviews.toArray();

  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    reviews = reviews.filter(r => wordIds.has(r.wordId));
  }

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
export async function getOverallStats(language?: string): Promise<{
  totalWords: number;
  totalReviews: number;
  averageEase: number;
  totalStudyMinutes: number;
}> {
  const [words, reviews, sessions] = await Promise.all([
    language
      ? db.words.where('language').equals(language).count()
      : db.words.count(),
    db.reviews.toArray(),
    db.studySessions.toArray(),
  ]);

  let filteredReviews = reviews;
  if (language) {
    const wordIds = await getWordIdsForLanguage(language);
    filteredReviews = reviews.filter(r => wordIds.has(r.wordId));
  }

  const totalStudySeconds = sessions.reduce(
    (sum, s) => sum + s.durationSeconds,
    0
  );
  const averageEase =
    filteredReviews.length > 0
      ? filteredReviews.reduce((sum, r) => sum + r.ease, 0) / filteredReviews.length
      : 0;

  return {
    totalWords: words,
    totalReviews: filteredReviews.length,
    averageEase: Math.round(averageEase * 100) / 100,
    totalStudyMinutes: Math.round(totalStudySeconds / 60),
  };
}

/** Reading stats from studySessions with activity === 'reading'. */
export async function getReadingStats(language?: string): Promise<{
  totalTextsRead: number;
  totalReadingMinutes: number;
  averageSessionMinutes: number;
  readingByDay: { date: string; minutes: number; texts: number }[];
}> {
  const sessions = await db.studySessions
    .where('activity')
    .equals('reading')
    .toArray();

  const filtered = language
    ? sessions.filter(s => s.language === language)
    : sessions;

  const totalTextsRead = filtered.length;
  const totalSeconds = filtered.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalReadingMinutes = Math.round(totalSeconds / 60);
  const averageSessionMinutes =
    totalTextsRead > 0 ? Math.round(totalSeconds / totalTextsRead / 60) : 0;

  // Last 14 days bucketed
  const start = daysAgo(14);
  const buckets = new Map<string, { minutes: number; texts: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.set(toDateString(d), { minutes: 0, texts: 0 });
  }

  for (const s of filtered) {
    if (!s.startTime) continue;
    const key = s.startTime.slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.minutes += s.durationSeconds;
      bucket.texts += 1;
    }
  }

  const readingByDay = Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    minutes: Math.round(data.minutes / 60),
    texts: data.texts,
  }));

  return { totalTextsRead, totalReadingMinutes, averageSessionMinutes, readingByDay };
}
