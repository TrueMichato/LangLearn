import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import aspects from '../../public/content/grammar/ru/verb-aspects.md?raw';
import spelling from '../../public/content/grammar/ru/spelling-rules.md?raw';
import { db } from '../db/schema';
import { addWord } from '../db/words';
import { saveLessonReviewItems } from '../db/lesson-cards';
import { refreshSavedGrammarCards } from '../db/refresh-grammar';
import { reviewedGrammarLessonId } from '../lib/grammar-review-scope';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import type { GrammarReviewItem } from '../lib/lesson-review';
import { useXPStore } from '../stores/xpStore';

const legacy = {
  rule: 'A completed result calls for the perfective', hint: 'читать / прочитать',
  example: 'Я ___ книгу.', answer: 'прочитал',
  explanation: 'Прочитал says the book was finished, whereas читал would only say it was being read.',
};
const revised = {
  ...legacy, id: 'finished-reading', kind: 'rule', format: 'cloze', priority: 'essential',
  sourceSection: 'Results', example: 'Анна ___ всю книгу. (finished)', answer: 'прочитала',
  legacyAliases: [{ rule: legacy.rule, example: legacy.example }],
};
const block = (source: object) => `<!-- grammar-card: ${JSON.stringify(source)} -->`;
const read = (markdown: string) => parseLessonReviewItems(markdown).items.filter((item) => item.kind !== 'vocabulary');
const run = async () => refreshSavedGrammarCards(await db.words.toArray());

beforeEach(async () => {
  await Promise.all([db.words.clear(), db.reviews.clear(), db.reviewLog.clear()]);
});
afterEach(() => vi.unstubAllGlobals());

describe('explicit refresh of saved reviewed Russian grammar', () => {
  it('repairs a baseline-backed exact alias without adding declined items or touching tags, dates, schedules, logs or XP', async () => {
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'verb-aspects');
    const old = (await db.words.toArray())[0];
    await db.words.update(old.id!, { tags: ['grammar', 'my-set'] });
    const review = (await db.reviews.toArray())[0];
    await db.reviews.update(review.id!, { repetitions: 7, interval: 60, stability: 55, difficulty: 2 });
    await db.reviewLog.add({ reviewId: review.id!, wordId: old.id!, grade: 4, isLapse: false, language: 'ru', date: '2026-01-01' });
    const schedules = await db.reviews.toArray();
    const history = await db.reviewLog.toArray();
    const xp = useXPStore.getState().bonusXP;
    const successor = read(aspects).find((item) => item.id === 'finished-book')!;
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => aspects });
    vi.stubGlobal('fetch', fetcher);
    expect(await run()).toEqual({ updated: 1, unchanged: 0, skipped: 0, unavailable: 0 });
    expect(fetcher.mock.calls).toEqual([[`${import.meta.env.BASE_URL}content/grammar/ru/verb-aspects.md`]]);
    const saved = await db.words.toArray();
    expect(saved).toEqual([expect.objectContaining({
      id: old.id, createdAt: old.createdAt, tags: ['grammar', 'my-set'], contextSentence: successor.prompt,
      word: successor.answer, lessonSource: expect.objectContaining({ itemId: successor.id }),
    })]);
    expect(await run()).toEqual({ updated: 0, unchanged: 1, skipped: 0, unavailable: 0 });
    expect(await db.words.toArray()).toEqual(saved);
    expect(await db.reviews.toArray()).toEqual(schedules);
    expect(await db.reviewLog.toArray()).toEqual(history);
    expect(useXPStore.getState().bonusXP).toBe(xp);
  });

  it('leaves edited, custom, uncertain old, and retired cards entirely intact; never infers ownership from similar wording', async () => {
    const [source] = read(block(revised));
    const edits: GrammarReviewItem[] = [
      { ...source, learnerEdited: true, answer: 'my chosen answer' },
      { ...source, id: 'custom:one', provenance: 'custom' },
      { ...source, id: 'retired' },
      { ...source, id: 'out-of-band' },
    ];
    await saveLessonReviewItems(edits, 'ru', 'verb-aspects');
    const saved = await db.words.toArray();
    await db.words.update(saved.find((word) => word.lessonSource?.itemId === 'out-of-band')!.id!, { meaning: 'my note' });
    const old = { ...saved[0], lessonSource: undefined, lessonSourceSnapshot: undefined, learnerEdited: false };
    delete old.id;
    // Historical tag but no snapshot; an exact pair alone can't prove unedited wording.
    await addWord({ ...old, grammarRule: legacy.rule, contextSentence: legacy.example, tags: ['grammar', 'verb-aspects'] });
    await addWord({ ...old, tags: ['my-set'] });
    await addWord({ ...old, type: 'word', tags: ['grammar', 'lesson:verb-aspects'] });
    await addWord({ ...old, language: 'es', tags: ['grammar', 'lesson:verb-aspects'] });
    await addWord({ ...old, tags: ['lesson:verb-aspects', 'lesson:gender'] });
    await addWord({ ...old, tags: ['lesson:instrumental'] });
    const before = await db.words.toArray();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => block(revised) });
    vi.stubGlobal('fetch', fetcher);
    expect(await run()).toEqual({ updated: 0, unchanged: 0, skipped: 5, unavailable: 0 });
    expect(await db.words.toArray()).toEqual(before);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('skips a saved legacy item claimed by two sources and two saved rows claiming one source', async () => {
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'verb-aspects');
    let before = await db.words.toArray();
    let markdown = [block(revised), block({ ...revised, id: 'other-target', example: 'Another ___.' })].join('\n');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => markdown })));
    expect(await run()).toEqual({ updated: 0, unchanged: 0, skipped: 1, unavailable: 0 });
    expect(await db.words.toArray()).toEqual(before);
    const duplicate = { ...before[0] };
    delete duplicate.id;
    await addWord(duplicate);
    before = await db.words.toArray();
    markdown = block(revised);
    expect(await run()).toEqual({ updated: 0, unchanged: 0, skipped: 2, unavailable: 0 });
    expect(await db.words.toArray()).toEqual(before);
  });

  it('uses available local content offline, reports missing or invalid lessons separately, and can retry', async () => {
    const realSpelling = read(spelling).find((item) => item.id === 'seven-letter-plural')!;
    await saveLessonReviewItems([{ ...realSpelling, prompt: 'Old spelling prompt ___.' }], 'ru', 'spelling-rules');
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'verb-aspects');
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'gender');
    let retry = false;
    const fetcher = vi.fn(async (url: string, options?: RequestInit) => {
      if (retry) return { ok: true, text: async () => url.endsWith('spelling-rules.md') ? spelling : block(revised) };
      if (url.endsWith('gender.md')) {
        return { ok: true, text: async () => block(revised) + '\n<!-- grammar-card: {bad json} -->' };
      }
      if (options?.cache === 'only-if-cached' && url.endsWith('spelling-rules.md')) {
        return { ok: true, text: async () => spelling };
      }
      throw new TypeError('Offline');
    });
    vi.stubGlobal('fetch', fetcher);
    expect(await run()).toEqual({ updated: 1, unchanged: 0, skipped: 0, unavailable: 2 });
    const checked = await db.words.toArray();
    expect(checked.filter((word) => reviewedGrammarLessonId(word) !== 'spelling-rules').every((word) => word.word === legacy.answer)).toBe(true);
    retry = true;
    expect(await run()).toEqual({ updated: 2, unchanged: 1, skipped: 0, unavailable: 0 });
    expect(await db.words.count()).toBe(3);
  });

  it('checks the live row after loading and rolls back all lessons on storage failure', async () => {
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'verb-aspects');
    await saveLessonReviewItems(read(block(legacy)), 'ru', 'gender');
    const before = await db.words.toArray();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => block(revised) })));
    let writes = 0;
    const failSecond = () => { if (++writes === 2) throw new Error('Storage full'); };
    db.words.hook('updating', failSecond);
    try {
      await expect(run()).rejects.toThrow('Storage full');
    } finally {
      db.words.hook('updating').unsubscribe(failSecond);
    }
    expect(await db.words.toArray()).toEqual(before);
    await db.words.update(before[0].id!, { meaning: 'Just edited on another tab' });
    expect(await refreshSavedGrammarCards(before)).toEqual({ updated: 1, unchanged: 0, skipped: 1, unavailable: 0 });
    expect(await db.words.get(before[0].id!)).toMatchObject({ meaning: 'Just edited on another tab', contextSentence: legacy.example });
  });
});
