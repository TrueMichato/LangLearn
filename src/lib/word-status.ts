import { db } from '../db/schema';

export type WordStatus = 'new' | 'seen' | 'learning' | 'known';

export interface WordStatusMap {
  getStatus(word: string): WordStatus;
  size: number;
  knownCount: number;
  learningCount: number;
  seenCount: number;
}

/**
 * Build a map of word → status for a given language.
 *
 * Status logic:
 * - 'known'    — word in db AND review interval ≥ 21 days
 * - 'learning' — word in db AND review exists with interval < 21
 * - 'seen'     — word in db but no review record
 * - 'new'      — word not in db
 */
export async function buildWordStatusMap(language: string): Promise<WordStatusMap> {
  // language is indexed — safe to .where()
  const words = await db.words.where('language').equals(language).toArray();

  const wordIds = words.map((w) => w.id!).filter((id) => id != null);

  // wordId is indexed — safe to .where()
  const reviews = wordIds.length > 0
    ? await db.reviews.where('wordId').anyOf(wordIds).toArray()
    : [];

  const reviewByWordId = new Map(reviews.map((r) => [r.wordId, r]));

  const statusMap = new Map<string, WordStatus>();
  let knownCount = 0;
  let learningCount = 0;
  let seenCount = 0;

  for (const w of words) {
    const key = w.word.toLowerCase();
    const review = reviewByWordId.get(w.id!);

    let status: WordStatus;
    if (review) {
      status = review.interval >= 21 ? 'known' : 'learning';
    } else {
      status = 'seen';
    }

    // Keep the highest status if duplicate words exist
    const existing = statusMap.get(key);
    if (!existing || statusRank(status) > statusRank(existing)) {
      statusMap.set(key, status);
    }
  }

  // Count after dedup
  for (const s of statusMap.values()) {
    if (s === 'known') knownCount++;
    else if (s === 'learning') learningCount++;
    else if (s === 'seen') seenCount++;
  }

  return {
    getStatus(word: string): WordStatus {
      return statusMap.get(word.toLowerCase()) ?? 'new';
    },
    size: statusMap.size,
    knownCount,
    learningCount,
    seenCount,
  };
}

function statusRank(s: WordStatus): number {
  switch (s) {
    case 'new': return 0;
    case 'seen': return 1;
    case 'learning': return 2;
    case 'known': return 3;
  }
}

export function getStatusColor(status: WordStatus): string {
  switch (status) {
    case 'new':
      return 'bg-yellow-100/60 dark:bg-yellow-900/30';
    case 'seen':
      return 'bg-blue-100/60 dark:bg-blue-900/30';
    case 'learning':
      return 'bg-orange-100/60 dark:bg-orange-900/30';
    case 'known':
      return '';
  }
}

export function getStatusLabel(status: WordStatus): string {
  switch (status) {
    case 'new': return 'New';
    case 'seen': return 'Seen';
    case 'learning': return 'Learning';
    case 'known': return 'Known';
  }
}

export function getStatusBadgeClass(status: WordStatus): string {
  switch (status) {
    case 'new':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    case 'seen':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
    case 'learning':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
    case 'known':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
  }
}
