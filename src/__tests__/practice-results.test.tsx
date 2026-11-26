import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestHistory } from '../db/schema';
import type { Question } from '../lib/test-questions';

const hooks = vi.hoisted(() => {
  let state: unknown[] = [];
  let cursor = 0;
  return {
    reset() { state = []; cursor = 0; },
    render<T>(component: () => T) { cursor = 0; return component(); },
    state<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [state[index] as T, (next: T | ((previous: T) => T)) => {
        state[index] = typeof next === 'function' ? (next as (value: T) => T)(state[index] as T) : next;
      }] as const;
    },
    ref<T>(initial: T) { const [value] = hooks.state({ current: initial }); return value; },
  };
});
const mocks = vi.hoisted(() => ({
  language: 'es' as string | undefined, requested: 'es', questions: [] as Question[], history: [] as TestHistory[],
  isGuided: false, completionError: '',
  add: vi.fn(), addXP: vi.fn(), complete: vi.fn(),
  recordGuidedAttempt: vi.fn(), completeMilestone: vi.fn(),
  effects: [] as (() => void | (() => void))[],
}));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(), useState: hooks.state, useRef: hooks.ref,
  useCallback: <T,>(fn: T) => fn, useMemo: <T,>(make: () => T) => make(),
  useEffect: (effect: () => void) => { mocks.effects.push(effect); },
}));
vi.mock('react-router-dom', async (original) => ({
  ...await original<typeof import('react-router-dom')>(),
  useLocation: () => ({
    key: 'practice-check',
    search: '?guided=tests:practice-check&guidedLanguage=es&guidedMin=10&guidedTarget=20&guidedMax=50',
  }),
}));
vi.mock('../db/schema', () => ({
  db: { testHistory: {
    add: mocks.add,
    where: () => ({ equals: () => ({ reverse: () => ({ sortBy: async () => mocks.history }) }) }),
  } },
}));
vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => ({ language: mocks.language, requested: mocks.requested, setLanguage: () => {}, options: mocks.language ? [mocks.language] : [] }),
}));
vi.mock('../hooks/useGuidedPractice', () => ({
  useGuidedPractice: () => ({
    descriptor: null, complete: mocks.complete, isGuided: mocks.isGuided,
    completionError: mocks.completionError,
  }),
}));
vi.mock('../db/guided-activities', () => ({
  guidedActivityProgressId: (language: string, milestoneId: string) => `${language}/${milestoneId}`,
  recordGuidedActivityAttempt: mocks.recordGuidedAttempt,
  completeGuidedActivityMilestone: mocks.completeMilestone,
}));
vi.mock('../stores/xpStore', () => ({
  useXPStore: { getState: () => ({ addXP: mocks.addXP }) },
}));
vi.mock('../lib/test-questions', async (original) => ({
  ...await original<typeof import('../lib/test-questions')>(),
  generateTestQuestions: async () => mocks.questions,
}));

import TestsPage from '../pages/Tests';
import { summarizePracticeResult, PRACTICE_RESULT_MARKER } from '../lib/test-scoring';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { GuidedCompletionActions } from '../components/learn/GuidedPractice';

type Props = { children?: ReactNode; onClick?: () => unknown; [key: string]: unknown };
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return isValidElement<Props>(node) ? [node, ...elements(node.props.children)] : [];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<Props>(node)) return text(node.props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function click(tree: ReactNode, label: string) {
  const control = elements(tree).find((element) => element.type === 'button' && text(element) === label);
  if (!control?.props.onClick) throw new Error(`Missing control ${label}`);
  return control.props.onClick();
}
function render() {
  mocks.effects = [];
  return hooks.render(TestsPage);
}
const sample: Question[] = [
  { id: 0, category: 'vocabulary', question: 'Which word means "cat"?',
    options: ['gato', 'perro'], correctIndex: 0, lessonId: 'animals', lessonTitle: 'Animals' },
  { id: 1, category: 'grammar', question: 'Pick the article.',
    options: ['el', 'un'], correctIndex: 0 },
];
async function start(untimed = true) {
  let tree = render();
  if (untimed) { click(tree, 'Untimed'); tree = render(); }
  await click(tree, 'Start practice check');
  return render();
}
beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  vi.useFakeTimers();
  mocks.language = 'es';
  mocks.requested = 'es';
  mocks.questions = sample;
  mocks.history = [];
  mocks.isGuided = false;
  mocks.completionError = '';
  mocks.add.mockReset().mockResolvedValue(1);
  mocks.addXP.mockReset();
  mocks.complete.mockReset().mockResolvedValue(undefined);
  mocks.recordGuidedAttempt.mockReset().mockResolvedValue({});
  mocks.completeMilestone.mockReset().mockResolvedValue({});
});
afterEach(() => { vi.useRealTimers(); });

describe('scoped practice summaries', () => {
  it('separates sampled, attempted, correct and unattempted without deriving a language level', () => {
    expect(summarizePracticeResult(sample, [1, null])).toEqual({
      totalQuestions: 2, attemptedQuestions: 1, correctAnswers: 0, unansweredQuestions: 1, score: 0,
      categories: [
        { category: 'vocabulary', sampled: 1, attempted: 1, correct: 0 },
        { category: 'grammar', sampled: 1, attempted: 0, correct: 0 },
      ],
    });
    expect(summarizePracticeResult([], [])).toEqual({
      totalQuestions: 0, attemptedQuestions: 0, correctAnswers: 0, unansweredQuestions: 0, score: 0,
      categories: [],
    });
  });
});

describe('practice check UI', () => {
  it('describes practice rather than promising proficiency on entry', () => {
    const tree = render();
    expect(text(tree)).toContain('Practice checks');
    expect(text(tree)).not.toMatch(/proficiency tests|full proficiency|track your level/i);
    expect(text(tree)).toContain('Not a language-level assessment');
  });

  it.each(['es', 'ja'])('shows %s scope, missed references and only real source links', async (language) => {
    mocks.language = language;
    let tree = await start();
    click(tree, 'perro');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    click(tree, 'el');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    expect(text(tree)).toContain('1/2 correct among attempted questions');
    expect(text(tree)).toContain('Vocabulary: 0/1 correct');
    expect(text(tree)).toContain('Grammar: 1/1 correct');
    expect(text(tree)).toContain('Reference answer: gato');
    expect(text(tree)).toContain('Your choice: perro');
    expect(text(tree)).not.toMatch(/JLPT|CEFR|Beginner|Intermediate|Advanced/);
    const destinations = elements(tree).flatMap((element) => element.props.to ? [element.props.to] : []);
    expect(destinations).toContain('/vocab-lessons?lesson=animals');
    expect(destinations.some((to) => String(to).startsWith('/grammar?lesson='))).toBe(false);
    expect(mocks.add).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      score: 50, totalQuestions: 2, correctAnswers: 1, level: PRACTICE_RESULT_MARKER,
    }));
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(33);
  });

  it('explains partial mixed content and does not fabricate the absent category', async () => {
    mocks.questions = [sample[0]];
    let tree = await start();
    expect(text(tree)).toContain('Grammar: 0 of 10 requested');
    click(tree, 'gato');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    expect(text(tree)).toContain('Vocabulary: 1/1 correct');
    expect(text(tree)).not.toContain('Grammar: 0/0 correct');
    expect(text(tree)).toContain('Only these questions were checked');
  });

  it('offers an inline empty state instead of saving an empty check', async () => {
    mocks.questions = [];
    const tree = await start();
    expect(text(tree)).toContain('No questions could be loaded');
    expect(text(tree)).toContain('Start practice check');
    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.addXP).not.toHaveBeenCalled();
  });

  it('does not silently replace an unsupported language', () => {
    mocks.language = undefined;
    mocks.requested = 'de';
    const tree = render();
    const unavailable = elements(tree).find((element) => element.type === LanguageUnavailable);
    expect(unavailable?.props.requested).toBe('de');
    expect(text(tree)).not.toContain('Start practice check');
  });

  it.each([false, true])('reports timed unattempted questions honestly (answer submitted: %s)', async (answered) => {
    let tree = await start(false);
    // Start the active countdown; the harness leaves effect scheduling explicit.
    mocks.effects[2]();
    await vi.advanceTimersByTimeAsync(599_500);
    tree = render();
    if (answered) {
      click(tree, 'gato');
      tree = render();
    }
    await vi.advanceTimersByTimeAsync(500);
    render();
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(1_000);
    tree = render();
    expect(text(tree)).toContain(answered ? '1/1 correct among attempted questions' : 'No questions answered');
    expect(text(tree)).toContain('Grammar: no questions attempted');
    expect(text(tree)).not.toContain('0/0 correct');
    expect(text(tree)).toContain(answered ? '1 not attempted' : '2 not attempted');
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({
      correctAnswers: answered ? 1 : 0, totalQuestions: 2, score: answered ? 50 : 0,
    }));
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(answered ? 33 : 30);
  });

  it('lets a failed timed history save retry without replaying completed work or changing the result', async () => {
    mocks.add.mockRejectedValueOnce(new Error('IndexedDB write rejected'));
    await start(false);
    mocks.effects[2]();
    await vi.advanceTimersByTimeAsync(600_000);
    render();
    const expiredTimerEffect = mocks.effects[3];
    expiredTimerEffect();
    await vi.advanceTimersByTimeAsync(0);
    let tree = render();
    expect(text(tree)).toContain('Your result could not be saved');
    expect(text(tree)).toContain('No questions answered');
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.addXP).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();

    // A rerender with the expired timer must not automatically retry the write.
    expiredTimerEffect();
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(10_000);
    tree = render();
    expect(mocks.add).toHaveBeenCalledTimes(1);
    await Promise.all([click(tree, 'Retry saving result'), click(tree, 'Retry saving result')]);
    tree = render();
    expect(text(tree)).not.toContain('Your result could not be saved');
    expect(mocks.add).toHaveBeenCalledTimes(2);
    expect(mocks.add.mock.calls[1][0]).toEqual(mocks.add.mock.calls[0][0]);
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(30);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });

  it('surfaces the guided hook’s resolved error without replaying a partly saved path attempt', async () => {
    mocks.isGuided = true;
    mocks.complete.mockImplementation(async () => {
      mocks.completionError = 'Your path progress could not be saved locally. Free some device storage and finish the session again.';
    });
    mocks.questions = [sample[0]];
    let tree = await start();
    click(tree, 'gato');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    const actions = elements(tree).find((element) => element.type === GuidedCompletionActions)!;
    const renderedActions = GuidedCompletionActions(actions.props as unknown as Parameters<typeof GuidedCompletionActions>[0]);
    expect(text(renderedActions)).toContain('Path step not saved.');
    expect(text(renderedActions)).toContain('Return to learning path');
    expect(text(tree)).toContain('1/1 correct among attempted questions');
    expect(text(tree)).not.toContain('Retry saving result');
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(33);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });

  it('contains an unexpected guided rejection after history and XP without repeating either', async () => {
    mocks.complete.mockRejectedValueOnce(new Error('Unexpected guided completion rejection'));
    await start(false);
    mocks.effects[2]();
    await vi.advanceTimersByTimeAsync(600_000);
    render();
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(0);
    let tree = render();
    expect(text(tree)).toContain('path progress could not be confirmed');
    expect(text(tree)).toContain('No questions answered');
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(1_000);
    tree = render();
    expect(text(tree)).toContain('path progress could not be confirmed');
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(30);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });

  it('does not reapply XP when persistence throws after the in-memory award', async () => {
    let awarded = 0;
    mocks.addXP.mockImplementation((xp: number) => {
      awarded += xp;
      throw new Error('localStorage write rejected');
    });
    mocks.questions = [sample[0]];
    let tree = await start();
    click(tree, 'gato');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    expect(text(tree)).toContain('XP could not be confirmed');
    expect(text(tree)).toContain('1/1 correct among attempted questions');
    mocks.effects[3]();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(awarded).toBe(33);
    expect(mocks.add).toHaveBeenCalledTimes(1);
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });

  it('uses RTL for Arabic prompts and answer inspection', async () => {
    mocks.language = 'ar';
    mocks.questions = [{
      id: 0, category: 'grammar', question: 'ما هذا؟', questionDirection: 'target',
      options: ['بيت', 'كتاب'], correctIndex: 0, targetOptionIndices: [0, 1],
    }];
    let tree = await start();
    expect(elements(tree).find((element) => text(element) === 'ما هذا؟')?.props.dir).toBe('rtl');
    expect(elements(tree).find((element) => element.type === 'button' && text(element) === 'كتاب')?.props.dir).toBe('rtl');
    click(tree, 'كتاب');
    await vi.advanceTimersByTimeAsync(800);
    tree = render();
    expect(elements(tree).filter((element) => element.type === 'bdi').every((element) => element.props.dir === 'rtl')).toBe(true);
    expect(text(tree)).toContain('Reference answer: بيت');
  });

  it('keeps legacy labels, marks them as estimates and never fabricates past answers', async () => {
    mocks.history = [
      { id: 1, language: 'es', type: 'vocabulary', score: 20, level: 'beginner',
        totalQuestions: 20, correctAnswers: 4, durationSeconds: 30, date: '2026-11-01' },
      { id: 2, language: 'es', type: 'mixed', score: 50, level: PRACTICE_RESULT_MARKER,
        totalQuestions: 2, correctAnswers: 1, durationSeconds: 30, date: '2026-11-02' },
    ];
    render();
    mocks.effects[0]();
    await Promise.resolve();
    const tree = render();
    expect(text(tree)).toContain('Legacy estimate: beginner');
    expect(text(tree)).toContain('4/20 correct in the sampled set');
    expect(text(tree)).toContain('Question and answer details were not saved');
    expect(text(tree)).not.toContain(PRACTICE_RESULT_MARKER);
    expect(text(tree)).not.toContain('Reference answer:');
    expect(mocks.add).not.toHaveBeenCalled();
  });
});

describe('actual guided hook failure contract', () => {
  it.each(['attempt', 'milestone'])('reports %s persistence failure as state, not a rejected completion', async (stage) => {
    const { useGuidedPractice } = await vi.importActual<typeof import('../hooks/useGuidedPractice')>('../hooks/useGuidedPractice');
    if (stage === 'attempt') mocks.recordGuidedAttempt.mockRejectedValueOnce(new Error('Write rejected'));
    else mocks.completeMilestone.mockRejectedValueOnce(new Error('Write rejected'));
    const guided = hooks.render(() => useGuidedPractice('tests', 'es'));
    await expect(guided.complete({ itemsCompleted: 20, score: 50 })).resolves.toBeUndefined();
    const after = hooks.render(() => useGuidedPractice('tests', 'es'));
    expect(after.completionError).toContain('path progress could not be saved locally');
    expect(after.completedNow).toBe(false);
    expect(after.completionPending).toBe(false);
    expect(mocks.recordGuidedAttempt).toHaveBeenCalledTimes(1);
    expect(mocks.completeMilestone).toHaveBeenCalledTimes(stage === 'attempt' ? 0 : 1);
  });
});
