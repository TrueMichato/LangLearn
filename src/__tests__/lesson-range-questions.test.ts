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
    words: [
      { word: '鳥', reading: 'とり', meaning: 'bird', example: '', exampleMeaning: '' },
      { word: '魚', reading: 'さかな', meaning: 'fish', example: '', exampleMeaning: '' },
      { word: '馬', reading: 'うま', meaning: 'horse', example: '', exampleMeaning: '' },
      { word: '牛', reading: 'うし', meaning: 'cow', example: '', exampleMeaning: '' },
    ],
    exercises: [],
  },
  'sparse-lesson': {
    id: 'sparse-lesson',
    words: [
      { word: '鳥', reading: 'とり', meaning: 'bird', example: '', exampleMeaning: '' },
    ],
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
  particles: `# Particles

<!-- quiz: {"type":"multiple-choice","question":"Which particle marks the topic?","options":["は","が","を","に"],"answer":0} -->
<!-- quiz: {"type":"multiple-choice","question":"Which particle marks the object?","options":["は","が","を","に"],"answer":2} -->
<!-- grammar-card: {"rule":"topic marker","example":"私＿＿学生です。","answer":"は","explanation":"Marks the topic."} -->
<!-- grammar-card: {"rule":"subject marker","example":"猫＿＿います。","answer":"が","explanation":"Marks the subject."} -->
<!-- grammar-card: {"rule":"location marker","example":"学校＿＿勉強します。","answer":"で","explanation":"Marks the action location."} -->
`,
  'verb-forms': `# Verb forms

<!-- quiz: {"type":"multiple-choice","question":"Which is the polite form of 食べる?","options":["食べます","食べた","食べて","食べない"],"answer":0} -->
<!-- quiz: {"type":"multiple-choice","question":"Which form links actions?","options":["ます","て","た","ない"],"answer":1} -->
<!-- grammar-card: {"rule":"polite present","hint":"Use ます","example":"毎日食べ＿＿。","answer":"ます","explanation":"ます marks polite non-past speech."} -->
<!-- grammar-card: {"rule":"linking form","hint":"Use て","example":"朝ご飯を食べ＿＿、学校へ行きます。","answer":"て","explanation":"The て-form links actions."} -->
<!-- grammar-card: {"rule":"plain past","hint":"Use た","example":"昨日食べ＿＿。","answer":"た","explanation":"た marks the plain past."} -->
`,
  'arabic-particles': `# Arabic particles

<!-- quiz: {"type":"multiple-choice","question":"Which word means house?","options":["بيت","كتاب","قلم","باب"],"answer":0} -->
<!-- grammar-card: {"rule":"Relative مَا introduces a clause","hint":"Look for مَا before a verb","example":"أَحْفَظُ مَا تَقُولُ","answer":"I remember what you say","explanation":"مَا introduces the relative clause."} -->
`,
  'three-quizzes': `# Sparse lesson

<!-- quiz: {"type":"multiple-choice","question":"Question one?","options":["A","B","C","D"],"answer":0} -->
<!-- quiz: {"type":"multiple-choice","question":"Question two?","options":["A","B","C","D"],"answer":1} -->
<!-- quiz: {"type":"multiple-choice","question":"Question three?","options":["A","B","C","D"],"answer":2} -->
`,
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
    if (/content\/grammar\/[^/]+\/index\.json$/.test(url)) {
      return {
        ok: true,
        json: async () => [
          { id: 'particles', title: 'Particles' },
          { id: 'verb-forms', title: 'Verb Forms' },
          { id: 'arabic-particles', title: 'Arabic Particles' },
          { id: 'three-quizzes', title: 'Sparse Grammar' },
          { id: 'other-one', title: 'Other Topic One' },
          { id: 'other-two', title: 'Other Topic Two' },
          { id: 'other-three', title: 'Other Topic Three' },
        ],
      } as Response;
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

  it('builds a five-question check for a lesson with enough vocabulary', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', ['l1']);
    expect(result.questions).toHaveLength(5);
    expect(new Set(result.questions.map((q) => q.question))).toHaveLength(5);
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

  it('rejects a lesson that cannot supply five meaningful questions', async () => {
    const result = await generateLessonRangeQuestions('ja', 'vocab', [
      'sparse-lesson',
    ]);
    expect(result.questions).toEqual([]);
    expect(result.coveredLessonIds).toEqual([]);
    expect(result.missingLessonIds).toEqual(['sparse-lesson']);
  });

  it('returns an empty result for an empty lesson list without fetching anything', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await generateLessonRangeQuestions('ja', 'vocab', []);
    expect(result).toEqual({ questions: [], coveredLessonIds: [], missingLessonIds: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a range larger than the 40-question coverage cap', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const lessonIds = Array.from({ length: 41 }, (_, index) => `lesson-${index}`);
    const result = await generateLessonRangeQuestions(
      'ja',
      'vocab',
      lessonIds,
    );

    expect(result.questions).toEqual([]);
    expect(result.coveredLessonIds).toEqual([]);
    expect(result.missingLessonIds).toEqual(lessonIds);
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

  it('uses grammar-card prompts to reach five questions when quiz blocks are sparse', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', ['particles']);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.some((q) => q.question.startsWith('Complete the example:'))).toBe(
      true,
    );
  });

  it('falls back to lesson-local prompts when the grammar index request fails', async () => {
    const fetchContent = mockFetch();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (/content\/grammar\/[^/]+\/index\.json$/.test(url)) {
          throw new Error('offline');
        }
        return fetchContent(url);
      }),
    );

    const result = await generateLessonRangeQuestions('ja', 'grammar', [
      'particles',
    ]);
    expect(result.questions).toHaveLength(5);
    expect(result.missingLessonIds).toEqual([]);
  });

  it('rejects a grammar lesson with fewer than five valid candidates', async () => {
    const result = await generateLessonRangeQuestions('ja', 'grammar', [
      'three-quizzes',
    ]);
    expect(result.questions).toEqual([]);
    expect(result.coveredLessonIds).toEqual([]);
    expect(result.missingLessonIds).toEqual(['three-quizzes']);
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

  it('marks Arabic answer options as target text without reversing English framing', async () => {
    const result = await generateLessonRangeQuestions('ar', 'grammar', [
      'arabic-particles',
    ]);

    expect(result.questions).toHaveLength(5);
    expect(result.questions.every((question) => question.questionDirection === undefined)).toBe(
      true,
    );
    const targetOptionQuestion = result.questions.find(
      (question) => question.question === 'Which word means house?',
    );
    expect(targetOptionQuestion?.targetOptionIndices).toEqual([0, 1, 2, 3]);
    expect(
      result.questions.some((question) =>
        question.question.startsWith('Complete the example:'),
      ),
    ).toBe(false);
  });
});
