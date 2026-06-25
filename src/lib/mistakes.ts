import { db } from '../db/schema';
import type { Word, Review, ReviewLogEntry } from '../db/schema';

/**
 * Pure helper: from a set of review-log entries, return the wordIds whose
 * MOST RECENT entry (within the provided list) is a lapse — i.e. the last time
 * the learner saw the card, they missed it. Ordered by most-recent lapse first.
 *
 * Because a successful re-review writes a later non-lapse entry, recovered
 * cards naturally drop out of the deck without any extra bookkeeping.
 */
export function selectMistakeWordIds(logs: ReviewLogEntry[]): number[] {
  const latestByWord = new Map<number, ReviewLogEntry>();

  for (const entry of logs) {
    const existing = latestByWord.get(entry.wordId);
    if (!existing || entry.date > existing.date) {
      latestByWord.set(entry.wordId, entry);
    }
  }

  return Array.from(latestByWord.values())
    .filter((e) => e.isLapse)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => e.wordId);
}

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/**
 * Build a "Fix your misses" deck: recently-lapsed cards independent of due date.
 * Excludes cards whose current review is mature (interval >= 21), since those
 * have already been re-learned successfully.
 */
export async function getMistakeDeck(
  languages?: string[],
  withinDays = 14,
  limit?: number
): Promise<Array<{ word: Word; review: Review }>> {
  const since = daysAgoIso(withinDays);
  const logs = await db.reviewLog
    .where('date')
    .aboveOrEqual(since)
    .toArray();

  const langSet = languages && languages.length > 0 ? new Set(languages) : null;
  const relevant = langSet ? logs.filter((l) => langSet.has(l.language)) : logs;

  const wordIds = selectMistakeWordIds(relevant);

  const results: Array<{ word: Word; review: Review }> = [];
  for (const wordId of wordIds) {
    const word = await db.words.get(wordId);
    if (!word) continue;
    if (langSet && !langSet.has(word.language)) continue;
    const review = await db.reviews.where('wordId').equals(wordId).first();
    if (!review) continue;
    if (review.interval >= 21) continue; // already re-mastered
    results.push({ word, review });
    if (limit && results.length >= limit) break;
  }
  return results;
}

/** Count of cards currently in the mistake deck (for Dashboard badge). */
export async function getMistakeCount(
  languages?: string[],
  withinDays = 14
): Promise<number> {
  const deck = await getMistakeDeck(languages, withinDays);
  return deck.length;
}

/**
 * Pure helper: count lapses per word within a log set. Used by leech detection.
 */
export function countLapsesByWord(logs: ReviewLogEntry[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const entry of logs) {
    if (!entry.isLapse) continue;
    counts.set(entry.wordId, (counts.get(entry.wordId) ?? 0) + 1);
  }
  return counts;
}
