import { db } from '../db/schema';
import type { Word, Review, ReviewLogEntry } from '../db/schema';
import { countLapsesByWord } from './mistakes';

export interface TopicRetention {
  topicId: string;
  language: string;
  cardCount: number;
  strongCount: number;     // cards with ease >= 2.5 and repetitions > 0
  retentionPercent: number;
  lapses: number;
}

/** Extract the lesson/topic id from a grammar card's tags (the non-marker tag). */
export function topicIdFromTags(tags: string[]): string | null {
  const marker = new Set(['grammar', 'sentence']);
  const topic = tags.find((t) => !marker.has(t));
  return topic ?? null;
}

/**
 * Pure helper: aggregate grammar-card performance by topic id.
 * A card counts as "strong" when its review ease >= 2.5 with at least one rep —
 * the same correctness signal used elsewhere in analytics.
 */
export function summarizeTopics(
  words: Word[],
  reviewByWordId: Map<number, Review>,
  lapsesByWord: Map<number, number>
): TopicRetention[] {
  const groups = new Map<string, TopicRetention>();

  for (const word of words) {
    if (word.type !== 'grammar') continue;
    const topicId = topicIdFromTags(word.tags);
    if (!topicId) continue;

    const key = `${word.language}/${topicId}`;
    let entry = groups.get(key);
    if (!entry) {
      entry = {
        topicId,
        language: word.language,
        cardCount: 0,
        strongCount: 0,
        retentionPercent: 0,
        lapses: 0,
      };
      groups.set(key, entry);
    }

    entry.cardCount++;
    const review = reviewByWordId.get(word.id!);
    if (review && review.repetitions > 0 && review.ease >= 2.5) {
      entry.strongCount++;
    }
    entry.lapses += lapsesByWord.get(word.id!) ?? 0;
  }

  for (const entry of groups.values()) {
    entry.retentionPercent =
      entry.cardCount > 0
        ? Math.round((entry.strongCount / entry.cardCount) * 100)
        : 0;
  }

  return Array.from(groups.values()).sort(
    (a, b) => a.retentionPercent - b.retentionPercent
  );
}

/** Per-topic retention for grammar cards in a language (weakest first). */
export async function getTopicRetention(
  language?: string
): Promise<TopicRetention[]> {
  const words = await db.words.where('type').equals('grammar').toArray();
  const filtered = language ? words.filter((w) => w.language === language) : words;

  const reviews = await db.reviews.toArray();
  const reviewByWordId = new Map<number, Review>(
    reviews.map((r) => [r.wordId, r])
  );

  const logs: ReviewLogEntry[] = await db.reviewLog.toArray();
  const lapsesByWord = countLapsesByWord(logs);

  return summarizeTopics(filtered, reviewByWordId, lapsesByWord);
}

/**
 * Focused review deck for a single grammar topic — all its cards regardless of
 * due date, so the learner can drill a weak area directly.
 */
export async function getTopicDeck(
  topicId: string,
  language?: string
): Promise<Array<{ word: Word; review: Review }>> {
  const words = await db.words.where('tags').equals(topicId).toArray();
  const results: Array<{ word: Word; review: Review }> = [];
  for (const word of words) {
    if (word.type !== 'grammar') continue;
    if (language && word.language !== language) continue;
    const review = await db.reviews.where('wordId').equals(word.id!).first();
    if (review) results.push({ word, review });
  }
  return results;
}
