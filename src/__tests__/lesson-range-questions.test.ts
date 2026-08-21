/**
 * Coverage-guarantee and lesson-attribution tests for the scoped test-out
 * question generator. These only exercise `generateLessonRangeQuestions`
 * and its helpers (added for issue #36) — `generateTestQuestions`, the
 * full-language Proficiency Tests generator, is untouched by this feature
 * and is intentionally not touched by these tests either.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateLessonRangeQuestions } from '../lib/test-questions';

const VOCAB_LESSONS: Record<string, unknown> = {
  'l1': {
    id: 'l1',
    words: [
      { word: '猫', reading: 'ねこ', meaning: 'cat', example: '', exampleMeaning: '' },
      { word: '犬', reading: 'いぬ', meaning: 'dog', example: '', exampleMeaning: '' },
      { word: 'うさぎ', reading: 'うさぎ', meaning: 'rabbit', example: '', exampleMeaning: '' },
      { word: 'きつね', reading: 'きつね', meaning: 'fox', example: '', exampleMeaning: '' },
    ],
    exercises: [],
  },
  'l2': {
    id: 'l2',
    words: [{ word: '鳥', reading: 'とり', meaning: 'bird', example: '', exampleMeaning: '' }],
    exercises: [],
  },
  // Only one word anywhere in the fixture set means there are no distractor
  // candidates outside this lesson's own word — buildVocabQuestion needs 3
  // distinct distractors, so this lesson can never produce a question.
  'empty-lesson': {
    id: 'empty-lesson',
    words: [],
    exercises: [],
  },
};

const GRAMMAR_QUIZZES: Record<string, string> = {
  particles: `# Particles\n\n<!-- quiz: {"type":"multiple-choice","question":"Which particle marks the topic?","options":["は","が","を","に"],"answer":0} -->\n\n<!-- quiz: {"type":"multiple-choice","question":"Which particle marks the object?","options":["は","が","を","に"],"answer":2} -->\n`,
  'verb-forms': `# Verb forms\n\n<!-- quiz: {"type":"multiple-choice","question":"Which is the polite form of 食べる?","options":["食べます","食べた","食べて","食べない"],"answer":0} -->\n`,
  'no-quiz': `# No quiz\n\nJust prose, no quiz blocks at all.\n`,
};

function mockFetch() {
  return vi.fn(async (url: string) => {
    const vocabMatch = url.match(/content\/vocab\/[^/]+\/([^/]+)\.json$/);
    if (vocabMatch) {
      const lesson = VOCAB_LESSONS[vocabMatch[1]];
      if (!lesson) return { ok: false } as Response;
      return { ok: true, json: async () => lesson } as Response;
    }
    const grammarMatch = url.match(/content\/grammar\/[^/]+\/([^/]+)\.md$/);
    if (grammarMatch) {
      const text = GRAMMAR_QUIZZES[grammarMatch[1]];
      if (text === undefined) return { ok: false } as Response;
      return { ok: true, text: async () => text } as Response;
    }
    return { ok: false } as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateLessonRangeQuestions (vocab)', () => {
  it('covers every requested lesson that has assessable words', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', ['l1', 'l2']);
    expect(result.missingLessonIds).toEqual([]);
    expect(result.coveredLessonIds.sort()).toEqual(['l1', 'l2']);
  });

  it('attributes every question to one of the requested lessons', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', ['l1', 'l2']);
    expect(result.questions.length).toBeGreaterThan(0);
    for (const q of result.questions) {
      expect(['l1', 'l2']).toContain(q.lessonId);
      expect(q.category).toBe('vocabulary');
    }
  });

  it('surfaces a lesson with no assessable words as missing rather than silently skipping it', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', ['l1', 'empty-lesson']);
    expect(result.missingLessonIds).toEqual(['empty-lesson']);
    // The covered lesson's questions must never be attributed to the
    // missing one, and vice versa.
    expect(result.questions.every((q) => q.lessonId !== 'empty-lesson')).toBe(true);
  });

  it('surfaces a lesson id whose content failed to load as missing', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', ['l1', 'does-not-exist']);
    expect(result.missingLessonIds).toEqual(['does-not-exist']);
    expect(result.coveredLessonIds).toEqual(['l1']);
  });

  it('returns an empty result for an empty lesson list without fetching anything', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await generateLessonRangeQuestions('ja', 'vocab', []);
    expect(result).toEqual({ questions: [], coveredLessonIds: [], missingLessonIds: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('generateLessonRangeQuestions (grammar)', () => {
  it('covers every requested lesson that has quiz blocks', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', ['particles', 'verb-forms']);
    expect(result.missingLessonIds).toEqual([]);
    expect(result.coveredLessonIds.sort()).toEqual(['particles', 'verb-forms']);
  });

  it('attributes every question to one of the requested lessons, preserving correctIndex', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', ['particles', 'verb-forms']);
    expect(result.questions.length).toBeGreaterThan(0);
    for (const q of result.questions) {
      expect(['particles', 'verb-forms']).toContain(q.lessonId);
      expect(q.category).toBe('grammar');
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('surfaces a lesson with no quiz blocks as missing', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', ['particles', 'no-quiz']);
    expect(result.missingLessonIds).toEqual(['no-quiz']);
    expect(result.questions.every((q) => q.lessonId !== 'no-quiz')).toBe(true);
  });

  it('assigns sequential ids to the final question set', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', ['particles']);
    expect(result.questions.map((q) => q.id)).toEqual(result.questions.map((_, i) => i));
  });
});
