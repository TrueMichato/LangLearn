import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

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
    ref<T>(initial: T) {
      const [value] = hooks.state({ current: initial });
      return value;
    },
  };
});
const mocks = vi.hoisted(() => ({
  tests: vi.fn(), daily: vi.fn(), add: vi.fn(), put: vi.fn(), get: vi.fn(), addXP: vi.fn(), complete: vi.fn(),
  adapt: vi.fn(),
  descriptor: null as unknown,
  collectEffects: false,
  effects: [] as (() => void)[],
}));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(), useState: hooks.state, useRef: hooks.ref,
  useCallback: <T,>(fn: T) => fn, useMemo: <T,>(make: () => T) => make(),
  useEffect: (effect: () => void) => { if (mocks.collectEffects) mocks.effects.push(effect); },
}));
vi.mock('../db/schema', () => ({
  db: { testHistory: { add: mocks.add }, dailyActivity: { get: mocks.get, put: mocks.put } },
}));
vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => ({ language: 'ja', setLanguage: () => {}, options: ['ja'], isSupported: true }),
}));
vi.mock('../hooks/useGuidedPractice', () => ({
  useGuidedPractice: () => ({ descriptor: mocks.descriptor, complete: mocks.complete }),
}));
vi.mock('../stores/xpStore', () => ({
  useXPStore: Object.assign((select: (state: { addXP: typeof mocks.addXP }) => unknown) =>
    select({ addXP: mocks.addXP }), { getState: () => ({ addXP: mocks.addXP }) }),
}));
vi.mock('../lib/test-questions', () => ({ generateTestQuestions: mocks.tests }));
vi.mock('../lib/daily-challenge', () => ({ loadDailyChallengeAttempt: mocks.daily }));
vi.mock('../hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: () => ({ start: mocks.adapt, selection: null, status: 'ready', error: '' }),
}));
vi.mock('../stores/timerStore', () => ({
  useTimerStore: (select: (state: { start: () => void; isRunning: boolean }) => unknown) =>
    select({ start: () => {}, isRunning: true }),
}));
vi.mock('../lib/tts', () => ({ speakWithSpeed: async () => {} }));
vi.mock('react-router-dom', async (original) => ({
  ...await original<typeof import('react-router-dom')>(),
  useSearchParams: () => [new URLSearchParams()],
}));

import TestsPage from '../pages/Tests';
import DailyChallengePage from '../pages/DailyChallenge';
import ListeningPage from '../pages/Listening';
import DictationDrill from '../components/drills/DictationDrill';
import type { GuidedPracticeDescriptor } from '../lib/guided-practice';
import PracticeWordCapture from '../components/common/PracticeWordCapture';

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
function captures(tree: ReactNode) {
  return elements(tree).filter((element) => element.type === PracticeWordCapture);
}
beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 9, 23, 55));
  mocks.get.mockResolvedValue(undefined);
  mocks.add.mockResolvedValue(1);
  mocks.put.mockResolvedValue(undefined);
  mocks.descriptor = null;
  mocks.collectEffects = false;
  mocks.effects = [];
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('practice page reveal boundaries and unchanged assessment semantics', () => {
  it('lets guided listening rank the full scoped pool rather than a pre-truncated random sample', async () => {
    const descriptor = {
      activity: 'listening', milestoneId: 'fixture', language: 'ja', seed: 'guided',
      scope: { difficulty: 'easy' }, session: { minItems: 1, targetItems: 2, maxItems: 3 },
    } satisfies GuidedPracticeDescriptor;
    mocks.descriptor = descriptor;
    mocks.adapt.mockImplementation(async (pool: unknown[]) => pool.slice(0, 2));
    const outer = ListeningPage();
    const attempt = outer.type as (props: typeof outer.props) => ReactNode;
    const tree = hooks.render(() => attempt(outer.props));
    await click(tree, 'Start Listening Practice');
    const [pool, options] = mocks.adapt.mock.calls[0] as [{ difficulty: string }[], { session: unknown }];
    expect(pool.length).toBeGreaterThan(descriptor.session.targetItems);
    expect(pool.every((item) => item.difficulty === 'easy')).toBe(true);
    expect(options.session).toEqual(descriptor.session);
  });

  it('ranks the entire guided dictation scope and mounts capture only after submission', async () => {
    vi.stubGlobal('window', { speechSynthesis: { cancel: () => {} } });
    mocks.collectEffects = true;
    mocks.adapt.mockImplementation(async (pool: string[]) => pool.slice(0, 2));
    const render = () => hooks.render(() => DictationDrill({
      language: 'ja', difficulty: 'all', onComplete: () => {}, onBack: () => {},
      guidedDescriptor: {
        activity: 'dictation', milestoneId: 'fixture', language: 'ja', seed: 'guided',
        scope: { difficulty: 'easy' }, session: { minItems: 1, targetItems: 2, maxItems: 3 },
      },
    }));
    render();
    mocks.effects[0]();
    await Promise.resolve();
    await Promise.resolve();
    let tree = render();
    const pool = mocks.adapt.mock.calls[0][0] as string[];
    expect(pool.length).toBeGreaterThan(2);
    expect(captures(tree)).toHaveLength(0);
    const textarea = elements(tree).find((element) => element.type === 'textarea')!;
    (textarea.props.onChange as (event: { target: { value: string } }) => void)({ target: { value: pool[0] } });
    tree = render();
    const form = elements(tree).find((element) => element.type === 'form')!;
    (form.props.onSubmit as (event: { preventDefault: () => void }) => void)({ preventDefault: () => {} });
    tree = render();
    expect(captures(tree)).toHaveLength(1);
    expect(captures(tree)[0].props.text).toBe(pool[0]);
  });

  it('adapts within the chosen listening level once, withholding transcript capture until every question is done', async () => {
    const passage = {
      id: 'listening-fixture', title: 'A cat', difficulty: 'easy', text: '猫がいます。',
      questions: [
        { question: 'First question', options: ['cat', 'dog'], correctIndex: 0 },
        { question: 'Second question', options: ['home', 'park'], correctIndex: 1 },
      ],
    };
    mocks.adapt.mockResolvedValue([passage]);
    const outer = ListeningPage();
    const attempt = outer.type as (props: typeof outer.props) => ReactNode;
    const render = () => hooks.render(() => attempt(outer.props));
    let tree = render();
    click(tree, 'easy');
    tree = render();
    await click(tree, 'Start Listening Practice');
    tree = render();
    const pool = mocks.adapt.mock.calls[0][0] as { language?: string; difficulty: string }[];
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((item) => item.difficulty === 'easy')).toBe(true);
    expect(captures(tree)).toHaveLength(0);
    await click(tree, '▶️');
    tree = render();
    click(tree, 'Answer Questions →');
    tree = render();
    click(tree, 'cat');
    tree = render();
    expect(captures(tree)).toHaveLength(0);
    expect(text(tree)).not.toContain(passage.text);
    click(tree, 'Next Question →');
    tree = render();
    click(tree, 'park');
    tree = render();
    expect(captures(tree)).toHaveLength(0);
    click(tree, 'See Results');
    tree = render();
    expect(captures(tree)[0].props.text).toBe(passage.text);
    expect(mocks.adapt).toHaveBeenCalledTimes(1);
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(35);
  });

  it('passes the unchanged proficiency pool through all questions; saves only on final results', async () => {
    const questions = Array.from({ length: 20 }, (_, index) => ({
      id: index, category: index < 10 ? 'vocabulary' : 'grammar',
      question: `What does "語${index}" (reading) mean?`, options: [`answer${index}`, `other${index}`], correctIndex: 0,
    }));
    mocks.tests.mockResolvedValue(questions);
    const render = () => hooks.render(TestsPage);
    let tree = render();
    click(tree, 'Untimed');
    tree = render();
    await click(tree, 'Start Test');
    tree = render();
    for (let index = 0; index < questions.length; index++) {
      expect(captures(tree)).toHaveLength(0);
      click(tree, index < 12 ? `answer${index}` : `other${index}`);
      tree = render();
      expect(captures(tree)).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(800);
      tree = render();
    }
    expect(mocks.tests).toHaveBeenCalledWith('ja', 'mixed', expect.any(Function));
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({
      language: 'ja', type: 'mixed', totalQuestions: 20, correctAnswers: 12, score: 60,
    }));
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(66);
    expect(captures(tree)).toHaveLength(1);
    expect(captures(tree)[0].props.words).toHaveLength(10);
  });

  it('reveals daily capture after an answer and preserves its starting date and multiplier across midnight', async () => {
    mocks.daily.mockResolvedValue({ notices: ['Grammar pool limited: fixture'], questions: Array.from({ length: 7 }, (_, index) => ({
      id: `item:${index}`, type: index < 3 ? 'vocab' : index < 5 ? 'grammar' : 'letter',
      question: `Question ${index}`, options: [`answer${index}`, `other${index}`], correctIndex: 0,
      ...(index < 3 ? { word: { word: `語${index}`, reading: '', meaning: `meaning${index}` } } : {}),
    })) });
    const outer = DailyChallengePage();
    const attempt = outer.type as (props: typeof outer.props) => ReactNode;
    const render = () => hooks.render(() => attempt(outer.props));
    let tree = render();
    await click(tree, 'Start Challenge');
    tree = render();
    expect(mocks.daily).toHaveBeenCalledWith('ja', '2026-11-09');
    expect(text(tree)).toContain('Today’s content limits');
    expect(text(tree)).toContain('Grammar pool limited: fixture');
    vi.setSystemTime(new Date(2026, 10, 10, 0, 5));
    for (let index = 0; index < 7; index++) {
      expect(captures(tree)).toHaveLength(0);
      click(tree, `answer${index}`);
      tree = render();
      expect(captures(tree)).toHaveLength(index < 3 ? 1 : 0);
      await click(tree, index < 6 ? 'Next question' : 'See results');
      tree = render();
    }
    expect(mocks.put).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-11-09', challengeComplete: true }));
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(98);
    expect(text(tree)).toContain('Daily Challenge Complete!');
  });
});
