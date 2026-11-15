import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, CURRENT_SCHEMA_VERSION, type Word } from '../db/schema';
import { addWord, saveWordsToVocabulary } from '../db/words';
import { saveLessonReviewItems } from '../db/lesson-cards';
import { buildBackupPayload, exportAllData, importAllData, mergeKey } from '../db/backup';
import { restoreSnapshot, takeSnapshot } from '../db/recovery';
import type { GrammarReviewItem, VocabularyReviewItem } from '../lib/lesson-review';

function grammar(overrides: Partial<GrammarReviewItem> = {}): GrammarReviewItem {
  return {
    id: 'profession', kind: 'rule', source: 'grammar-card',
    provenance: 'authored', priority: 'essential', sourceSection: 'Ser',
    format: 'cloze', rule: 'Professions use ser', hint: '',
    prompt: 'Ella ___ profesora.', answer: 'es', explanation: 'A profession describes identity.',
    legacyAliases: [], ...overrides,
  };
}

function vocabulary(): VocabularyReviewItem {
  return {
    id: 'is', kind: 'vocabulary', source: 'vocab-card',
    provenance: 'authored', priority: 'essential', sourceSection: 'Words',
    word: 'es', reading: '', meaning: 'is', contextSentence: '',
    isSentence: false, sourceText: '',
  };
}

async function clearDatabase() {
  await Promise.all(db.tables.map((table) => table.clear()));
}

async function recordReviews() {
  for (const review of await db.reviews.toArray()) {
    await db.reviews.update(review.id!, { interval: 35, stability: 18, difficulty: 4, repetitions: 7 });
    await db.reviewLog.add({
      wordId: review.wordId, reviewId: review.id!, language: 'es',
      grade: 4, isLapse: false, date: '2026-01-02T00:00:00.000Z',
    });
  }
}

function legacy(item: GrammarReviewItem): Omit<Word, 'id' | 'createdAt'> {
  return {
    word: item.answer, reading: item.hint, meaning: item.explanation,
    contextSentence: item.prompt, grammarRule: item.rule, language: 'es',
    sourceTextId: null, tags: ['grammar', 'ser'], type: 'grammar',
  };
}

function backup(tables: Record<string, unknown[]>): string {
  return JSON.stringify({
    version: 2, schemaVersion: CURRENT_SCHEMA_VERSION, tables, localStorage: {},
  });
}

beforeEach(clearDatabase);
afterEach(clearDatabase);

describe('durable lesson backup identities', () => {
  it('round-trips full replace and snapshot recovery without losing presentation, provenance or learner edits', async () => {
    await saveLessonReviewItems([
      grammar(),
      grammar({ id: 'concept', kind: 'concept', format: 'qa', prompt: 'When is ser used?', answer: 'For identity — not temporary condition.' }),
      grammar({ id: 'custom:one', provenance: 'custom', learnerEdited: true, answer: 'My answer' }),
      vocabulary(),
    ], 'es', 'ser');
    await recordReviews();
    const original = await buildBackupPayload();
    const exported = await exportAllData();
    const snapshot = await takeSnapshot('lesson retention safety copy');
    expect(snapshot?.id).toBeDefined();

    await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);
    await importAllData(exported, 'replace');
    expect((await buildBackupPayload()).tables).toEqual(original.tables);

    await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);
    await restoreSnapshot(snapshot!.id!);
    expect((await buildBackupPayload()).tables).toEqual(original.tables);
  });

  it('merges independent same-answer questions, lexical cards and custom identities, remapping word and review IDs', async () => {
    const first = grammar();
    const second = grammar({ id: 'event-location', prompt: 'La fiesta ___ aquí.', rule: 'Event locations use ser' });
    const custom = grammar({ id: 'custom:import', provenance: 'custom' });
    await saveLessonReviewItems([first, second, vocabulary(), custom], 'es', 'ser');
    await recordReviews();
    const exported = await exportAllData();
    await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);

    await saveLessonReviewItems([
      grammar({ prompt: 'Él ___ profesor.', explanation: 'Live wording wins.' }),
      grammar({ id: 'custom:local', provenance: 'custom' }),
    ], 'es', 'ser');
    const localFirst = (await db.words.toArray()).find((word) => word.lessonSource?.itemId === first.id)!;
    const localReview = await db.reviews.where('wordId').equals(localFirst.id!).first();
    await db.reviews.update(localReview!.id!, { interval: 91, stability: 55 });
    const liveReview = await db.reviews.get(localReview!.id!);

    const result = await importAllData(exported, 'merge');
    expect(result.written.words).toBe(3);
    expect(result.skipped.words).toBe(1);
    expect(await db.words.count()).toBe(5);
    expect(await db.reviews.count()).toBe(5);
    expect(await db.words.get(localFirst.id!)).toMatchObject({
      contextSentence: 'Él ___ profesor.', meaning: 'Live wording wins.',
    });
    expect(await db.reviews.get(localReview!.id!)).toEqual(liveReview);

    const logs = await db.reviewLog.toArray();
    expect(logs).toHaveLength(3);
    for (const log of logs) {
      expect(await db.words.get(log.wordId)).toBeDefined();
      expect(await db.reviews.get(log.reviewId)).toMatchObject({
        wordId: log.wordId, stability: 18, difficulty: 4, interval: 35,
      });
    }
    const repeat = await importAllData(exported, 'merge');
    expect(repeat.written.words).toBe(0);
    expect(repeat.skipped.words).toBe(4);
    expect(await db.reviewLog.count()).toBe(3);
  });

  it('adopts an incoming authored identity onto a tagged legacy row through an explicit alias, keeping live history', async () => {
    const old = grammar();
    const revised = grammar({
      prompt: 'Ella ___ médica.',
      legacyAliases: [{ rule: old.rule, example: old.prompt }],
    });
    await saveLessonReviewItems([revised], 'es', 'ser');
    const exported = await exportAllData();
    await Promise.all([db.words.clear(), db.reviews.clear()]);
    const localId = await addWord(legacy(old));
    await recordReviews();
    const reviews = await db.reviews.toArray();
    const logs = await db.reviewLog.toArray();

    const result = await importAllData(exported, 'merge');
    expect(result.skipped.words).toBe(1);
    expect(await db.words.count()).toBe(1);
    expect(await db.words.get(localId)).toMatchObject({
      contextSentence: old.prompt, lessonSource: { itemId: old.id, provenance: 'authored' },
      tags: expect.arrayContaining(['grammar', 'ser', 'lesson:ser']),
    });
    expect(await db.reviews.toArray()).toEqual(reviews);
    expect(await db.reviewLog.toArray()).toEqual(logs);
  });

  it('recognises incoming legacy rows after a source upgrade but never collapses another question sharing the answer', async () => {
    const old = grammar();
    const revised = grammar({
      prompt: 'Ella ___ médica.',
      legacyAliases: [{ rule: old.rule, example: old.prompt }],
    });
    await saveLessonReviewItems([revised], 'es', 'ser');
    const first = (await db.words.toArray())[0];
    const anotherQuestion = legacy(grammar({ rule: 'Event location', prompt: 'La fiesta ___ aquí.' }));
    const result = await importAllData(backup({
      words: [
        { ...legacy(old), id: 700, createdAt: '2025-01-01' },
        { ...anotherQuestion, id: 701, createdAt: '2025-01-01' },
        { ...vocabulary(), type: 'word', language: 'es', sourceTextId: null, tags: [], id: 702, createdAt: '2025-01-01' },
      ],
      reviews: [
        { id: 700, wordId: 700, interval: 1 },
        { id: 701, wordId: 701, interval: 2 },
        { id: 702, wordId: 702, interval: 3 },
      ],
    }), 'merge');
    expect(result.written.words).toBe(2);
    expect(result.skipped.words).toBe(1);
    expect(await db.words.count()).toBe(3);
    expect(await db.reviews.count()).toBe(3);
    expect(await db.words.get(first.id!)).toMatchObject({ contextSentence: revised.prompt });
  });

  it('adds restored lesson provenance to existing vocabulary without replacing learner text or schedules', async () => {
    await saveLessonReviewItems([vocabulary()], 'es', 'ser');
    const exported = await exportAllData();
    await Promise.all([db.words.clear(), db.reviews.clear()]);
    await saveWordsToVocabulary([{
      word: 'es', language: 'es', reading: 'my reading', meaning: 'my gloss',
      contextSentence: 'my example', sourceTextId: null, tags: ['mine'],
    }]);
    const word = (await db.words.toArray())[0];
    const review = (await db.reviews.toArray())[0];
    await importAllData(exported, 'merge');
    expect(await db.words.get(word.id!)).toMatchObject({
      reading: 'my reading', meaning: 'my gloss', contextSentence: 'my example',
      tags: expect.arrayContaining(['mine', 'lesson:ser']),
      lessonSources: [expect.objectContaining({ itemId: 'is', lessonId: 'ser' })],
    });
    expect(await db.reviews.toArray()).toEqual([review]);
  });

  it('uses typed source/question merge keys instead of answer-only keys', () => {
    const lexical = { language: 'es', word: 'es', type: 'word' };
    const questionA = { ...lexical, type: 'grammar', grammarRule: 'A', contextSentence: 'A?', tags: ['grammar', 'ser'] };
    const questionB = { ...questionA, grammarRule: 'B', contextSentence: 'B?' };
    expect(mergeKey('words', lexical)).not.toBe(mergeKey('words', questionA));
    expect(mergeKey('words', questionA)).not.toBe(mergeKey('words', questionB));
    const sourced = { ...questionA, lessonSource: { lessonId: 'ser', itemId: 'stable', provenance: 'authored' } };
    expect(mergeKey('words', sourced)).toBe(mergeKey('words', { ...sourced, word: 'different answer', contextSentence: 'new wording' }));
  });

  it('restores pre-v9 grammar layouts without collapsing distinct rules sharing an answer', async () => {
    const old = {
      language: 'es', type: 'grammar', reading: '', meaning: 'legacy explanation',
      contextSentence: 'es', sourceTextId: null, tags: ['grammar', 'ser'], createdAt: '2024-01-01',
    };
    const exported = JSON.stringify({
      version: 1,
      words: [{ ...old, id: 1, word: 'Professions' }, { ...old, id: 2, word: 'Event locations' }],
      reviews: [{ id: 1, wordId: 1, interval: 20 }, { id: 2, wordId: 2, interval: 30 }],
    });
    await importAllData(exported, 'merge');
    expect((await db.words.toArray()).map((word) => ({
      word: word.word, rule: word.grammarRule, prompt: word.contextSentence,
    }))).toEqual([
      { word: 'es', rule: 'Professions', prompt: '' },
      { word: 'es', rule: 'Event locations', prompt: '' },
    ]);
    expect(await db.reviews.count()).toBe(2);
    const repeat = await importAllData(exported, 'merge');
    expect(repeat.written.words).toBe(0);
    expect(repeat.skipped.words).toBe(2);
  });
});
