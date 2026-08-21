/**
 * `saveWordsToVocabulary` is the transactional replacement for the old
 * "check with `wordExists`, then `addWord`" pattern used by both the
 * individual "Save to flashcards" button and the bulk "Add all to Words"
 * action in `VocabLessonView`. Two callers racing that old pattern on the
 * same word could both see "not found" and both insert, doubling the word
 * and its review row. These tests exercise the real IndexedDB transaction
 * (via fake-indexeddb) rather than mocking Dexie, so a regression in the
 * transaction boundary itself would actually be caught.
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// `db` is a module-level singleton opened lazily on first use, so each test
// gets a clean slate by clearing every table it touches rather than
// reimporting the module.
import { db } from '../db/schema';
import { saveWordsKey, saveWordsToVocabulary } from '../db/words';

function word(overrides: Partial<Parameters<typeof saveWordsToVocabulary>[0][number]> = {}) {
  return {
    language: 'ja',
    word: 'ねこ',
    reading: 'ねこ',
    meaning: 'cat',
    contextSentence: 'ねこがいます。',
    sourceTextId: null,
    tags: ['vocab-lesson', 'animals'],
    ...overrides,
  };
}

beforeEach(async () => {
  await db.words.clear();
  await db.reviews.clear();
});

afterEach(async () => {
  await db.words.clear();
  await db.reviews.clear();
});

describe('saveWordsToVocabulary', () => {
  it('creates a word plus a matching review row', async () => {
    const result = await saveWordsToVocabulary([word()]);

    expect(result).toEqual({
      added: 1,
      alreadySaved: 0,
      outcomes: { [saveWordsKey('ねこ', 'ja')]: 'added' },
    });

    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(words[0]).toMatchObject({ word: 'ねこ', language: 'ja', type: 'word' });

    const reviews = await db.reviews.toArray();
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({
      wordId: words[0].id,
      ease: 2.5,
      interval: 0,
      repetitions: 0,
    });
  });

  it('does nothing and reports zero counts for an empty batch', async () => {
    const result = await saveWordsToVocabulary([]);
    expect(result).toEqual({ added: 0, alreadySaved: 0, outcomes: {} });
    expect(await db.words.count()).toBe(0);
  });

  it('skips a word that already exists for the same [word+language] pair', async () => {
    await saveWordsToVocabulary([word()]);
    const result = await saveWordsToVocabulary([word()]);

    expect(result).toEqual({
      added: 0,
      alreadySaved: 1,
      outcomes: { [saveWordsKey('ねこ', 'ja')]: 'exists' },
    });
    // No duplicate word or orphaned review was created by the repeat call.
    expect(await db.words.count()).toBe(1);
    expect(await db.reviews.count()).toBe(1);
  });

  it('preserves the same word in a different language as a distinct identity', async () => {
    await saveWordsToVocabulary([word({ language: 'ja', word: 'no' })]);
    const result = await saveWordsToVocabulary([word({ language: 'es', word: 'no', meaning: 'no' })]);

    expect(result.added).toBe(1);
    expect(result.alreadySaved).toBe(0);
    expect(await db.words.count()).toBe(2);
  });

  it('reports an honest partial-overlap split for a mixed batch', async () => {
    await saveWordsToVocabulary([word({ word: 'いぬ', meaning: 'dog' })]);

    const result = await saveWordsToVocabulary([
      word({ word: 'いぬ', meaning: 'dog' }), // already saved
      word({ word: 'ねこ', meaning: 'cat' }), // new
      word({ word: 'とり', meaning: 'bird' }), // new
    ]);

    expect(result.added).toBe(2);
    expect(result.alreadySaved).toBe(1);
    expect(result.outcomes[saveWordsKey('いぬ', 'ja')]).toBe('exists');
    expect(result.outcomes[saveWordsKey('ねこ', 'ja')]).toBe('added');
    expect(result.outcomes[saveWordsKey('とり', 'ja')]).toBe('added');

    // Every word ends up with exactly one review row, including the one
    // that pre-existed the second call.
    const words = await db.words.toArray();
    const reviews = await db.reviews.toArray();
    expect(words).toHaveLength(3);
    expect(reviews).toHaveLength(3);
    const wordIds = new Set(words.map((w) => w.id));
    for (const review of reviews) {
      expect(wordIds.has(review.wordId)).toBe(true);
    }
  });

  it('collapses the same word appearing twice within a single call', async () => {
    const result = await saveWordsToVocabulary([
      word({ word: 'さかな', meaning: 'fish' }),
      word({ word: 'さかな', meaning: 'fish' }),
    ]);

    // The first occurrence creates it; the second sees it inside the same
    // transaction and is treated as already saved, never as a duplicate.
    expect(result.added).toBe(1);
    expect(result.alreadySaved).toBe(1);
    expect(await db.words.count()).toBe(1);
    expect(await db.reviews.count()).toBe(1);
  });

  it('is idempotent across repeated calls with the same input', async () => {
    const rows = [word({ word: 'みず', meaning: 'water' }), word({ word: 'ひ', meaning: 'fire' })];

    const first = await saveWordsToVocabulary(rows);
    const second = await saveWordsToVocabulary(rows);
    const third = await saveWordsToVocabulary(rows);

    expect(first.added).toBe(2);
    expect(second).toEqual({
      added: 0,
      alreadySaved: 2,
      outcomes: {
        [saveWordsKey('みず', 'ja')]: 'exists',
        [saveWordsKey('ひ', 'ja')]: 'exists',
      },
    });
    expect(third.alreadySaved).toBe(2);

    expect(await db.words.count()).toBe(2);
    expect(await db.reviews.count()).toBe(2);
  });
});
