import { db, type Word, type Review } from './schema';
import { getFrequencyRank } from '../data/frequency';

export async function addWord(
  word: Omit<Word, 'id' | 'createdAt' | 'type'> & { type?: Word['type'] }
): Promise<number> {
  const id = await db.words.add({
    ...word,
    type: word.type ?? 'word',
    createdAt: new Date().toISOString(),
  }) as number;

  await db.reviews.add({
    wordId: id,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewDate: new Date().toISOString(),
  });

  return id;
}

export async function getWordsByLanguage(language: string): Promise<Word[]> {
  return db.words.where('language').equals(language).toArray();
}

export async function getWordWithReview(
  wordId: number
): Promise<{ word: Word; review: Review } | undefined> {
  const word = await db.words.get(wordId);
  if (!word) return undefined;
  const review = await db.reviews.where('wordId').equals(wordId).first();
  if (!review) return undefined;
  return { word, review };
}

export async function getDueReviews(language?: string): Promise<
  Array<{ word: Word; review: Review }>
> {
  const now = new Date().toISOString();
  const reviews = await db.reviews
    .where('nextReviewDate')
    .belowOrEqual(now)
    .toArray();

  const results: Array<{ word: Word; review: Review }> = [];
  for (const review of reviews) {
    const word = await db.words.get(review.wordId);
    if (word && (!language || word.language === language)) {
      results.push({ word, review });
    }
  }
  return results;
}

export async function deleteWord(wordId: number): Promise<void> {
  await db.reviews.where('wordId').equals(wordId).delete();
  await db.words.delete(wordId);
}

export async function getTotalWordCount(language?: string): Promise<number> {
  if (language) {
    return db.words.where('language').equals(language).count();
  }
  return db.words.count();
}

export async function wordExists(word: string, language: string): Promise<boolean> {
  const match = await db.words.where({ word, language }).first();
  return !!match;
}

/** Stable key for a `[word+language]` pair, used to report per-word outcomes. */
export function saveWordsKey(word: string, language: string): string {
  return `${language}\u0000${word}`;
}

export interface SaveWordsResult {
  /** Rows newly created by this call. */
  added: number;
  /** Rows that already existed for `[word+language]` and were left untouched. */
  alreadySaved: number;
  /** Per-row outcome keyed by `saveWordsKey(word, language)`. */
  outcomes: Record<string, 'added' | 'exists'>;
}

/**
 * Save a batch of words to the vocabulary deck, skipping anything that already
 * exists for the same `[word+language]` pair, and return honest counts of what
 * happened.
 *
 * This runs as a single Dexie (IndexedDB) transaction rather than a per-word
 * "check, then act" pair of calls. Two separate calls racing on the same word
 * (an individual "Save to flashcards" click landing while a bulk "Add all"
 * pass is also saving it) could previously both see "not found" and both
 * insert, creating a duplicate word+review pair. Inside one transaction every
 * read sees every earlier write in the same transaction, so a word that
 * appears twice in `words` (or is already being added elsewhere in the same
 * call) is only ever created once, and callers cannot observe a half-applied
 * batch.
 */
export async function saveWordsToVocabulary(
  words: Array<Omit<Word, 'id' | 'createdAt' | 'type'> & { type?: Word['type'] }>
): Promise<SaveWordsResult> {
  const result: SaveWordsResult = { added: 0, alreadySaved: 0, outcomes: {} };
  if (words.length === 0) return result;

  await db.transaction('rw', [db.words, db.reviews], async () => {
    for (const w of words) {
      const key = saveWordsKey(w.word, w.language);

      const existing = await db.words
        .where('[word+language]')
        .equals([w.word, w.language])
        .first();

      if (existing) {
        result.alreadySaved++;
        result.outcomes[key] = 'exists';
        continue;
      }

      const id = (await db.words.add({
        ...w,
        type: w.type ?? 'word',
        createdAt: new Date().toISOString(),
      })) as number;

      await db.reviews.add({
        wordId: id,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
        lastReviewDate: new Date().toISOString(),
      });

      result.added++;
      result.outcomes[key] = 'added';
    }
  });

  return result;
}

export interface WordFilter {
  language?: string;
  search?: string;
  status?: 'learning' | 'mature' | 'due';
  tag?: string;
  sortBy?: 'createdAt' | 'word' | 'nextReview' | 'frequency';
  sortDir?: 'asc' | 'desc';
}

export async function searchWords(
  filter: WordFilter
): Promise<Array<{ word: Word; review: Review }>> {
  let wordsQuery = db.words.toCollection();

  if (filter.language) {
    wordsQuery = db.words.where('language').equals(filter.language);
  }

  let words = await wordsQuery.toArray();

  // Grammar cards are SRS-only and not part of the vocabulary browser.
  words = words.filter((w) => w.type !== 'grammar');

  if (filter.search) {
    const q = filter.search.toLowerCase();
    words = words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q)
    );
  }

  if (filter.tag) {
    words = words.filter((w) => w.tags.includes(filter.tag!));
  }

  const results: Array<{ word: Word; review: Review }> = [];
  const now = new Date().toISOString();

  for (const word of words) {
    const review = await db.reviews.where('wordId').equals(word.id!).first();
    if (!review) continue;

    if (filter.status === 'learning' && review.interval >= 21) continue;
    if (filter.status === 'mature' && review.interval < 21) continue;
    if (filter.status === 'due' && review.nextReviewDate > now) continue;

    results.push({ word, review });
  }

  const sortBy = filter.sortBy ?? 'createdAt';
  const dir = filter.sortDir === 'asc' ? 1 : -1;

  results.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'createdAt') cmp = a.word.createdAt.localeCompare(b.word.createdAt);
    else if (sortBy === 'word') cmp = a.word.word.localeCompare(b.word.word);
    else if (sortBy === 'nextReview') cmp = a.review.nextReviewDate.localeCompare(b.review.nextReviewDate);
    else if (sortBy === 'frequency') {
      const ra = getFrequencyRank(a.word.word, a.word.language) ?? Infinity;
      const rb = getFrequencyRank(b.word.word, b.word.language) ?? Infinity;
      cmp = ra - rb;
    }
    return cmp * dir;
  });

  return results;
}

export interface WordCountByLanguage {
  language: string;
  known: number;
  learning: number;
  total: number;
}

export async function getKnownWordCount(language?: string): Promise<WordCountByLanguage[]> {
  const words = language
    ? await db.words.where('language').equals(language).toArray()
    : await db.words.toArray();

  const reviews = await db.reviews.toArray();
  const reviewByWordId = new Map(reviews.map((r) => [r.wordId, r]));

  const grouped = new Map<string, { known: number; learning: number; total: number }>();

  for (const word of words) {
    const lang = word.language;
    if (!grouped.has(lang)) {
      grouped.set(lang, { known: 0, learning: 0, total: 0 });
    }
    const counts = grouped.get(lang)!;
    counts.total++;

    const review = reviewByWordId.get(word.id!);
    if (review) {
      if (review.interval >= 21) {
        counts.known++;
      } else {
        counts.learning++;
      }
    }
  }

  return Array.from(grouped.entries()).map(([lang, counts]) => ({
    language: lang,
    ...counts,
  }));
}

export async function updateWord(id: number, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates);
}

export async function bulkAddWords(
  words: Omit<Word, 'id' | 'createdAt'>[]
): Promise<number> {
  let added = 0;
  await db.transaction('rw', [db.words, db.reviews], async () => {
    for (const w of words) {
      const id = (await db.words.add({
        ...w,
        createdAt: new Date().toISOString(),
      })) as number;
      await db.reviews.add({
        wordId: id,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
        lastReviewDate: new Date().toISOString(),
      });
      added++;
    }
  });
  return added;
}

export async function getRandomWords(
  language: string,
  exclude: number[],
  count: number
): Promise<Word[]> {
  const all = await db.words
    .where('language')
    .equals(language)
    .filter((w) => !exclude.includes(w.id!))
    .toArray();

  // Fisher-Yates shuffle and take first `count`
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}
