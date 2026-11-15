import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, type Word } from '../db/schema';
import { addWord, saveWordsToVocabulary, updateWord } from '../db/words';
import { findSavedCandidates, findSavedLessonItems, reconcileSavedLessonItems, saveLessonReviewItems, syncLessonGrammarCards } from '../db/lesson-cards';
import type { GrammarReviewItem, VocabularyReviewItem } from '../lib/lesson-review';

function grammar(overrides: Partial<GrammarReviewItem> = {}): GrammarReviewItem {
  return {
    id: 'identity-rule', kind: 'rule', source: 'grammar-card',
    provenance: 'authored', priority: 'essential', sourceSection: 'Identity',
    format: 'cloze', rule: 'Use ser for identity', hint: '',
    prompt: 'Ella ___ profesora.', answer: 'es', explanation: 'A profession uses ser.',
    legacyAliases: [], ...overrides,
  };
}

function vocabulary(overrides: Partial<VocabularyReviewItem> = {}): VocabularyReviewItem {
  return {
    id: 'es-word', kind: 'vocabulary', source: 'vocab-card',
    provenance: 'authored', priority: 'essential', sourceSection: 'Words',
    word: 'es', reading: '', meaning: 'is', contextSentence: '',
    isSentence: false, sourceText: '', ...overrides,
  };
}

function legacyRow(item: GrammarReviewItem, tags = ['grammar', 'identity']): Omit<Word, 'id' | 'createdAt'> {
  return {
    type: 'grammar', language: 'es', word: item.answer, reading: item.hint,
    meaning: item.explanation, contextSentence: item.prompt, grammarRule: item.rule,
    sourceTextId: null, tags,
  };
}

beforeEach(async () => {
  await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);
});

describe('selected lesson review saves', () => {
  it('only saves the explicit selection, and grammar answers never mark vocabulary as saved', async () => {
    expect(await saveLessonReviewItems([], 'es', 'identity')).toEqual({
      added: 0, alreadySaved: 0, grammarAdded: 0,
    });
    await saveLessonReviewItems([grammar()], 'es', 'identity');
    expect(await findSavedLessonItems([vocabulary(), grammar()], 'es', 'identity'))
      .toEqual(new Set(['identity-rule']));
    expect(await findSavedCandidates([{
      id: 'word', source: 'list', word: 'es', reading: '', meaning: 'is',
      contextSentence: '', isSentence: false, sourceText: '',
    }], 'es')).toEqual(new Set());

    const result = await saveLessonReviewItems([
      vocabulary(),
      grammar({ id: 'location-rule', prompt: 'La fiesta ___ aquí.', rule: 'Events use ser' }),
    ], 'es', 'identity');
    expect(result).toEqual({ added: 2, alreadySaved: 0, grammarAdded: 1 });
    expect(await db.words.count()).toBe(3);
    expect(await db.reviews.count()).toBe(3);
    expect(await findSavedLessonItems([vocabulary(), grammar()], 'es', 'identity'))
      .toEqual(new Set(['es-word', 'identity-rule']));
  });

  it('serialises overlapping calls through independent IndexedDB connections and survives retry', async () => {
    vi.resetModules();
    const peer = await import('../db/lesson-cards');
    const { db: peerDb } = await import('../db/schema');
    expect(peerDb).not.toBe(db);
    try {
      const selected = [grammar(), vocabulary()];
      const results = await Promise.all([
        saveLessonReviewItems(selected, 'es', 'identity'),
        peer.saveLessonReviewItems(selected, 'es', 'identity'),
      ]);
      expect(results.map((result) => result.added).sort()).toEqual([0, 2]);
      expect(results.reduce((sum, result) => sum + result.grammarAdded, 0)).toBe(1);
      expect(await saveLessonReviewItems(selected, 'es', 'identity')).toEqual({
        added: 0, alreadySaved: 2, grammarAdded: 0,
      });
      expect(await db.words.count()).toBe(2);
      expect(await db.reviews.count()).toBe(2);
    } finally {
      peerDb.close();
    }
  });

  it('rolls back metadata, words and reviews together after an injected review failure', async () => {
    await saveWordsToVocabulary([{
      language: 'es', word: 'es', reading: 'my reading', meaning: 'my meaning',
      contextSentence: '', sourceTextId: null, tags: ['personal'],
    }]);
    const original = await db.words.toArray();
    let attempts = 0;
    const fail = () => {
      if (++attempts === 2) throw new Error('injected review failure');
    };
    db.reviews.hook('creating', fail);
    const selected = [vocabulary(), grammar(), grammar({ id: 'other', prompt: 'Esto ___ útil.' })];
    try {
      await expect(saveLessonReviewItems(selected, 'es', 'identity')).rejects.toThrow('injected review failure');
    } finally {
      db.reviews.hook('creating').unsubscribe(fail);
    }
    expect(await db.words.toArray()).toEqual(original);
    expect(await db.reviews.count()).toBe(1);
    expect(await saveLessonReviewItems(selected, 'es', 'identity')).toEqual({
      added: 2, alreadySaved: 1, grammarAdded: 2,
    });
    const lexical = await db.words.where('type').equals('word').first();
    expect(lexical).toMatchObject({
      reading: 'my reading', meaning: 'my meaning',
      tags: expect.arrayContaining(['personal', 'lesson:identity']),
      lessonSources: [expect.objectContaining({ lessonId: 'identity', itemId: 'es-word' })],
    });
  });

  describe('existing-only lesson reconciliation', () => {
    it('adopts legacy identities and repairs source-owned wording on reopen without adding declined items or touching history', async () => {
      const old = grammar();
      const legacyId = await addWord(legacyRow(old));
      const owned = grammar({ id: 'owned', rule: 'Events use ser', prompt: 'La fiesta ___ aquí.' });
      await saveLessonReviewItems([owned], 'es', 'identity');
      await saveWordsToVocabulary([{
        word: 'es', language: 'es', reading: 'my reading', meaning: 'my meaning',
        contextSentence: 'my example', sourceTextId: null, tags: ['mine'],
      }]);
      const review = (await db.reviews.toArray())[0];
      await db.reviews.update(review.id!, { interval: 70, stability: 40, difficulty: 4, repetitions: 8 });
      await db.reviewLog.add({
        wordId: legacyId, reviewId: review.id!, language: 'es', grade: 4,
        isLapse: false, date: '2026-01-01T00:00:00.000Z',
      });
      const reviews = await db.reviews.toArray();
      const logs = await db.reviewLog.toArray();
      const revised = { ...owned, prompt: 'El concierto ___ aquí.', explanation: 'Events use ser for their locations.' };
      const source = [
        old, revised, vocabulary(),
        grammar({ id: 'declined-rule', rule: 'A new rule', prompt: 'Unseen ___ prompt.' }),
        vocabulary({ id: 'declined-word', word: 'nuevo', meaning: 'new' }),
      ];

      expect(await reconcileSavedLessonItems(source, 'es', 'identity')).toEqual({ repaired: 3 });
      expect(await db.words.count()).toBe(3);
      expect(await db.words.get(legacyId)).toMatchObject({
        lessonSource: { itemId: old.id, provenance: 'authored' }, grammarFormat: 'cloze',
      });
      expect(await db.words.where('type').equals('word').first()).toMatchObject({
        reading: 'my reading', meaning: 'my meaning', contextSentence: 'my example',
        lessonSources: [expect.objectContaining({ itemId: 'es-word', lessonId: 'identity' })],
      });
      expect((await db.words.toArray()).find((word) => word.lessonSource?.itemId === owned.id))
        .toMatchObject({ contextSentence: revised.prompt, meaning: revised.explanation });
      expect(await db.reviews.toArray()).toEqual(reviews);
      expect(await db.reviewLog.toArray()).toEqual(logs);
      expect(await reconcileSavedLessonItems(source, 'es', 'identity')).toEqual({ repaired: 0 });

      const later = { ...old, prompt: 'Ella ___ médica.' };
      expect(await reconcileSavedLessonItems([later], 'es', 'identity')).toEqual({ repaired: 1 });
      expect(await db.words.get(legacyId)).toMatchObject({ contextSentence: later.prompt });
      expect(await db.words.count()).toBe(3);
      expect(await db.reviews.toArray()).toEqual(reviews);
      expect(await db.reviewLog.toArray()).toEqual(logs);
    });

    it('does not replace custom, explicitly edited, out-of-band edited or uncertain legacy wording', async () => {
      const edited = grammar({ id: 'edited', learnerEdited: true, answer: 'My answer' });
      const custom = grammar({ id: 'custom:protected', provenance: 'custom' });
      const external = grammar({ id: 'external' });
      await saveLessonReviewItems([edited, custom, external], 'es', 'identity');
      const words = await db.words.toArray();
      const externalId = words.find((word) => word.lessonSource?.itemId === external.id)!.id!;
      const originalCustom = words.find((word) => word.lessonSource?.itemId === custom.id)!;
      await db.words.update(externalId, { meaning: 'My out-of-band explanation' });
      const old = grammar({ id: 'legacy-edited', rule: 'Legacy rule', prompt: 'An old ___ prompt.' });
      const legacyId = await addWord({ ...legacyRow(old), word: 'My legacy answer' });

      await reconcileSavedLessonItems([
        { ...grammar(), id: edited.id, answer: 'Source correction' },
        { ...custom, answer: 'Changed custom answer' },
        { ...external, explanation: 'Changed source explanation' },
        old,
      ], 'es', 'identity');
      expect(await db.words.get(originalCustom.id!)).toEqual(originalCustom);
      expect((await db.words.toArray()).find((word) => word.lessonSource?.itemId === edited.id))
        .toMatchObject({ word: 'My answer', learnerEdited: true });
      expect(await db.words.get(externalId)).toMatchObject({ meaning: 'My out-of-band explanation' });
      expect(await db.words.get(legacyId)).toMatchObject({
        word: 'My legacy answer', learnerEdited: true, lessonSource: { itemId: old.id },
      });
      expect(await db.words.count()).toBe(4);
      expect(await db.reviews.count()).toBe(4);
    });

    it('rolls back every repair on failure and permits a clean retry', async () => {
      const first = grammar();
      const second = grammar({ id: 'second', rule: 'Second rule', prompt: 'Second ___ prompt.' });
      await saveLessonReviewItems([first, second], 'es', 'identity');
      const original = await db.words.toArray();
      const changed = [first, second].map((item) => ({ ...item, explanation: 'Corrected source explanation' }));
      let attempts = 0;
      const fail = () => {
        if (++attempts === 2) throw new Error('injected reconciliation failure');
      };
      db.words.hook('updating', fail);
      try {
        await expect(reconcileSavedLessonItems(changed, 'es', 'identity')).rejects.toThrow('injected reconciliation failure');
      } finally {
        db.words.hook('updating').unsubscribe(fail);
      }
      expect(await db.words.toArray()).toEqual(original);
      expect(await reconcileSavedLessonItems(changed, 'es', 'identity')).toEqual({ repaired: 2 });
      expect(await db.words.count()).toBe(2);
      expect(await db.reviews.count()).toBe(2);
    });
  });

  it('keeps stable identities across source wording repairs without resetting FSRS or logs', async () => {
    await saveLessonReviewItems([grammar()], 'es', 'identity');
    const word = (await db.words.toArray())[0];
    const review = (await db.reviews.toArray())[0];
    await db.reviews.update(review.id!, { interval: 42, stability: 17, difficulty: 4, repetitions: 7 });
    await db.reviewLog.add({
      reviewId: review.id!, wordId: word.id!, language: 'es', grade: 4,
      isLapse: false, date: '2026-01-01T00:00:00.000Z',
    });
    const beforeReview = await db.reviews.toArray();
    const beforeLog = await db.reviewLog.toArray();
    const changed = grammar({ prompt: 'Ella ___ médica.', explanation: 'A profession expresses identity.' });
    expect(await saveLessonReviewItems([changed], 'es', 'identity')).toEqual({
      added: 0, alreadySaved: 1, grammarAdded: 0,
    });
    expect(await db.words.get(word.id!)).toMatchObject({
      contextSentence: changed.prompt, meaning: changed.explanation,
      lessonSource: { itemId: 'identity-rule', provenance: 'authored' },
    });
    expect(await db.reviews.toArray()).toEqual(beforeReview);
    expect(await db.reviewLog.toArray()).toEqual(beforeLog);
  });

  it.each([['grammar', 'identity'], ['grammar', 'lesson:identity']])(
    'adopts exact legacy rules/prompts and authored aliases with tags %j',
    async (...tags) => {
      const old = grammar();
      const id = await addWord(legacyRow(old, tags));
      const review = (await db.reviews.toArray())[0];
      await db.reviews.update(review.id!, { interval: 80, stability: 25 });
      const revised = grammar({
        prompt: 'Ella ___ médica.',
        legacyAliases: [{ rule: old.rule, example: old.prompt }],
      });
      expect(await findSavedLessonItems([revised], 'es', 'identity'))
        .toEqual(new Set([revised.id]));
      expect(await saveLessonReviewItems([revised], 'es', 'identity')).toEqual({
        added: 0, alreadySaved: 1, grammarAdded: 0,
      });
      expect(await db.words.count()).toBe(1);
      expect(await db.words.get(id)).toMatchObject({
        contextSentence: old.prompt, lessonSource: { itemId: revised.id },
        tags: expect.arrayContaining(['lesson:identity']),
      });
      expect((await db.reviews.toArray())[0]).toMatchObject({ id: review.id, interval: 80, stability: 25 });
    },
  );

  it('protects explicit edits, out-of-band edits, and custom cards during compatibility sync', async () => {
    const authored = grammar();
    const custom = grammar({ id: 'custom:one', provenance: 'custom' });
    expect(await saveLessonReviewItems([authored, custom], 'es', 'identity'))
      .toEqual({ added: 2, alreadySaved: 0, grammarAdded: 1 });
    const words = await db.words.toArray();
    const savedAuthored = words.find((word) => word.lessonSource?.provenance === 'authored')!;
    const savedCustom = words.find((word) => word.lessonSource?.provenance === 'custom')!;
    await updateWord(savedAuthored.id!, { meaning: 'My explanation' });
    await syncLessonGrammarCards([{
      id: authored.id, kind: 'rule', format: 'cloze', priority: 'essential',
      sourceSection: 'Identity', rule: authored.rule, example: authored.prompt,
      answer: 'source correction', explanation: 'Source explanation',
    }], 'es', 'identity');
    expect(await db.words.get(savedAuthored.id!)).toMatchObject({
      meaning: 'My explanation', word: 'es', learnerEdited: true,
    });
    expect(await db.words.get(savedCustom.id!)).toEqual(savedCustom);
    expect(await db.words.count()).toBe(2);

    await db.words.update(savedAuthored.id!, { learnerEdited: false, word: 'out-of-band answer' });
    await saveLessonReviewItems([authored], 'es', 'identity');
    expect((await db.words.get(savedAuthored.id!))?.word).toBe('out-of-band answer');
  });

  it('deduplicates within a batch and preserves learner-edited and custom first-save metadata', async () => {
    const edited = grammar({ learnerEdited: true, answer: 'My own answer' });
    const custom = grammar({ id: 'custom:two', provenance: 'custom', kind: 'concept', format: 'qa' });
    const editedVocabulary = vocabulary({ learnerEdited: true });
    expect(await saveLessonReviewItems([edited, edited, custom, editedVocabulary], 'es', 'identity'))
      .toEqual({ added: 3, alreadySaved: 1, grammarAdded: 1 });
    await saveLessonReviewItems([grammar()], 'es', 'identity');
    expect((await db.words.toArray()).find((word) => word.lessonSource?.itemId === edited.id))
      .toMatchObject({ word: 'My own answer', learnerEdited: true, grammarFormat: 'cloze', grammarKind: 'rule' });
    expect((await db.words.toArray()).find((word) => word.lessonSource?.itemId === custom.id))
      .toMatchObject({ grammarFormat: 'qa', grammarKind: 'concept', lessonSource: { provenance: 'custom' } });
    expect((await db.words.toArray()).find((word) => word.type === 'word'))
      .toMatchObject({ learnerEdited: true, lessonSources: [expect.objectContaining({ itemId: editedVocabulary.id })] });
  });

  it('does not demote a stable authored identity when an old compatibility caller supplies a legacy block', async () => {
    const item = grammar();
    await saveLessonReviewItems([item], 'es', 'identity');
    await syncLessonGrammarCards([{
      rule: item.rule, example: item.prompt, answer: 'outdated answer', explanation: 'outdated explanation',
    }], 'es', 'identity');
    expect(await db.words.count()).toBe(1);
    expect((await db.words.toArray())[0]).toMatchObject({
      word: item.answer, meaning: item.explanation,
      lessonSource: { itemId: item.id, provenance: 'authored' },
    });
  });
});
