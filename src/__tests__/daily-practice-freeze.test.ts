import 'fake-indexeddb/auto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/schema';
import { generateDailyChallenge, loadDailyChallengeAttempt } from '../lib/daily-challenge';
import { generateTestQuestions } from '../lib/test-questions';
import { createSeededRandom } from '../lib/guided-practice';
import { calculateXP } from '../lib/test-scoring';

const words = Array.from({ length: 24 }, (_, index) => ({
  word: `語${index}`, reading: `reading${index}`, meaning: `meaning${index}`,
  example: '', exampleMeaning: '',
}));
const grammar = Array.from({ length: 24 }, (_, index) =>
  `<!-- quiz: ${JSON.stringify({ type: 'multiple-choice', question: `Grammar ${index}`,
    options: ['one', 'two', 'three', 'four'], answer: index % 4 })} -->`).join('\n');

beforeEach(async () => {
  await Promise.all([db.words.clear(), db.reviews.clear(), db.lessonProgress.clear(), db.settings.clear()]);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => url.endsWith('index.json') ? [{ id: 'intro' }] : { id: 'intro', words, exercises: [] },
    text: async () => grammar,
  })));
});
afterEach(() => vi.unstubAllGlobals());

async function seed(language: string) {
  await db.words.bulkAdd(words.map((word) => ({
    language, word: word.word, reading: word.reading, meaning: word.meaning,
    contextSentence: '', sourceTextId: null, tags: [], type: 'word' as const,
    createdAt: new Date().toISOString(),
  })));
  await db.lessonProgress.put({
    id: `${language}/intro`, language, lessonId: 'intro', completed: true,
    completedAt: new Date().toISOString(), quizScore: 100, attempts: 1,
  });
}

describe('persisted daily practice', () => {
  it('freezes IDs and prompts across vocabulary edits and reopening the local database', async () => {
    await seed('ja');
    const original = await generateDailyChallenge('ja', '2026-11-09');
    expect(original.filter((q) => q.type === 'vocab')).toHaveLength(3);
    expect(original.filter((q) => q.type === 'grammar')).toHaveLength(2);
    expect(original.filter((q) => q.type === 'letter')).toHaveLength(2);
    expect(original.every((q) => q.id)).toBe(true);
    await db.words.clear();
    await db.lessonProgress.clear();
    db.close();
    await db.open();
    expect(await generateDailyChallenge('ja', '2026-11-09')).toEqual(original);
    const record = await db.settings.get('daily-practice:v1:2026-11-09:ja');
    expect(JSON.parse(record!.value).snapshotRevision).toEqual(expect.any(String));
    expect(await db.dailyActivity.get('2026-11-09')).toBeUndefined();
  });

  it('scopes frozen attempts to both date and language, including concurrent starts', async () => {
    await seed('ja');
    await seed('ru');
    const first = loadDailyChallengeAttempt('ja', '2026-11-09');
    const concurrent = loadDailyChallengeAttempt('ja', '2026-11-09');
    expect(concurrent).toBe(first);
    await Promise.all([first, concurrent, generateDailyChallenge('ja', '2026-11-10'),
      generateDailyChallenge('ru', '2026-11-09')]);
    expect((await db.settings.toArray()).map((row) => row.key).sort()).toEqual([
      'daily-practice:v1:2026-11-09:ja', 'daily-practice:v1:2026-11-09:ru',
      'daily-practice:v1:2026-11-10:ja',
    ]);
  });

  it('never silently rerolls a damaged saved attempt', async () => {
    await db.settings.put({ key: 'daily-practice:v1:2026-11-09:ja', value: '{broken' });
    await expect(generateDailyChallenge('ja', '2026-11-09')).rejects.toThrow();
    expect((await db.settings.get('daily-practice:v1:2026-11-09:ja'))!.value).toBe('{broken');
  });

  it('also recognizes legacy grammar-prefixed progress without changing the mix', async () => {
    await seed('ja');
    await db.lessonProgress.clear();
    await db.lessonProgress.put({
      id: 'ja/grammar/intro', language: 'ja', lessonId: 'grammar/intro', completed: true,
      completedAt: new Date().toISOString(), quizScore: 100, attempts: 1,
    });
    const attempt = await loadDailyChallengeAttempt('ja', '2026-11-09');
    expect(attempt.questions.filter((question) => question.type === 'grammar')).toHaveLength(2);
    expect(attempt.notices).toEqual([]);
  });

  it('propagates lesson load failures instead of freezing a success-shaped partial fallback', async () => {
    await seed('ja');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    await expect(loadDailyChallengeAttempt('ja', '2026-11-09')).rejects.toThrow('Grammar lesson index');
    expect(await db.settings.get('daily-practice:v1:2026-11-09:ja')).toBeUndefined();
  });

  it('persists explicit pool-limit notices for real missing progress, not invented knowledge', async () => {
    const attempt = await loadDailyChallengeAttempt('ja', '2026-11-09');
    expect(attempt.questions).toHaveLength(7);
    expect(attempt.notices).toEqual(expect.arrayContaining([
      expect.stringContaining('Vocabulary pool limited: 0/3'),
      expect.stringContaining('Grammar pool limited: 0/2'),
    ]));
    expect(await loadDailyChallengeAttempt('ja', '2026-11-09')).toEqual(attempt);
  });

  it('keeps proficiency distribution, deterministic prompts and scoring independent of knowledge', async () => {
    const first = await generateTestQuestions('ja', 'mixed', createSeededRandom('assessment'));
    await seed('ja');
    const afterKnowledge = await generateTestQuestions('ja', 'mixed', createSeededRandom('assessment'));
    expect(afterKnowledge).toEqual(first);
    expect(first.filter((q) => q.category === 'vocabulary')).toHaveLength(10);
    expect(first.filter((q) => q.category === 'grammar')).toHaveLength(10);
    expect(calculateXP(12)).toBe(66);
  });
});
