import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateTestQuestions } from '../lib/test-questions';

afterEach(() => vi.unstubAllGlobals());

describe('practice question source identity', () => {
  it('retains the actual vocabulary, fill-blank and grammar lesson identity', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('index.json')
        ? [{ id: 'real-lesson', title: 'The authored title' }]
        : { id: 'not-the-requested-id',
          words: ['بيت', 'كتاب', 'قلم', 'باب'].map((word, i) => ({ word, reading: '', meaning: `meaning${i}`, example: '', exampleMeaning: '' })),
          exercises: [{ type: 'fill-blank', items: [{ sentence: 'هذا ___', answer: 'بيت', hint: 'house', translation: 'This is a house.' }] }] },
      text: async () => '<!-- quiz: {"type":"multiple-choice","question":"ما هذا؟","options":["بيت","كتاب","قلم","باب"],"answer":0} -->',
    })));
    const questions = await generateTestQuestions('ar', 'mixed', () => 0.9);
    expect(questions.length).toBeGreaterThan(1);
    expect(questions.some((q) => q.question === 'Fill in the blank: هذا ___ (“This is a house.”)')).toBe(true);
    for (const question of questions) {
      expect(question.lessonId).toBe('real-lesson');
      expect(question.lessonTitle).toBe('The authored title');
      expect(question.targetOptionIndices).toEqual([0, 1, 2, 3]);
    }
    expect(questions.find((q) => q.category === 'grammar')?.questionDirection).toBe('target');
  });

  it('does not present malformed grammar or duplicate-only vocabulary as answerable content', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      json: async () => url.endsWith('index.json') ? [{ id: 'empty' }] : {
        id: 'empty', words: Array.from({ length: 4 }, () => ({ word: 'same', reading: '', meaning: 'same' })), exercises: [],
      },
      text: async () => '<!-- quiz: {"type":"multiple-choice","question":"Broken?","options":["only"],"answer":4} -->',
    })));
    expect(await generateTestQuestions('es', 'mixed', () => 0.2)).toEqual([]);
  });
});
