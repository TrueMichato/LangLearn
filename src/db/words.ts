import { db, type Word, type Review } from './schema';

export async function addWord(
  word: Omit<Word, 'id' | 'createdAt'>
): Promise<number> {
  const id = await db.words.add({
    ...word,
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

export interface WordFilter {
  language?: string;
  search?: string;
  status?: 'learning' | 'mature' | 'due';
  tag?: string;
  sortBy?: 'createdAt' | 'word' | 'nextReview';
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
    return cmp * dir;
  });

  return results;
}

export async function updateWord(id: number, updates: Partial<Word>): Promise<void> {
  await db.words.update(id, updates);
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
