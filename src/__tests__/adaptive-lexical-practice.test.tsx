import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { buildKnowledgeSnapshot } from '../lib/knowledge';
import { segmentSurfaceText } from '../lib/lexical';
import type { PracticeSentence } from '../data/sentences';

// A hook-slot harness exercises event handlers and async attempts without a DOM dependency.
const hooks = vi.hoisted(() => {
  let slots: unknown[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  return {
    reset() { slots = []; cursor = 0; effects = []; },
    render<T>(component: () => T): T {
      cursor = 0;
      const result = component();
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
      return result;
    },
    state<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [slots[index] as T, (next: T | ((previous: T) => T)) => {
        slots[index] = typeof next === 'function' ? (next as (value: T) => T)(slots[index] as T) : next;
      }] as const;
    },
    ref<T>(initial: T) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index] as { current: T };
    },
    memo<T>(make: () => T, deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index] as { deps: readonly unknown[]; value: T } | undefined;
      if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
        slots[index] = { deps, value: make() };
      }
      return (slots[index] as { value: T }).value;
    },
    effect(effect: () => void, deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index] as readonly unknown[] | undefined;
      if (!previous || deps.some((value, i) => value !== previous[i])) effects.push(effect);
      slots[index] = deps;
    },
  };
});

const mocks = vi.hoisted(() => ({
  load: vi.fn(), tokenize: vi.fn(), addXP: vi.fn(), complete: vi.fn(),
  descriptor: null as unknown,
}));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useState: hooks.state, useRef: hooks.ref, useMemo: hooks.memo,
  useCallback: <T,>(callback: T, deps: readonly unknown[]) => hooks.memo(() => callback, deps),
  useEffect: hooks.effect,
}));
vi.mock('../db/knowledge', () => ({ loadKnowledgeSnapshot: mocks.load }));
vi.mock('../lib/tts', () => ({ speak: vi.fn() }));
vi.mock('../lib/lexical-tokenizer', () => ({ tokenizeLexicalText: mocks.tokenize }));
vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => ({ language: 'es', isSupported: true, options: ['es'], setLanguage: vi.fn() }),
}));
vi.mock('../hooks/useGuidedPractice', () => ({
  useGuidedPractice: () => ({ descriptor: mocks.descriptor, complete: mocks.complete }),
}));
vi.mock('../stores/xpStore', () => ({
  useXPStore: Object.assign((select: (state: { addXP: typeof mocks.addXP }) => unknown) => select({ addXP: mocks.addXP }),
    { getState: () => ({ addXP: mocks.addXP }) }),
}));

import { useAdaptivePractice } from '../hooks/useAdaptivePractice';
import { SentenceBuilderSession } from '../pages/SentenceBuilder';
import { ClozePracticeSession } from '../pages/ClozePractice';
import { TranslationPracticeSession } from '../pages/TranslationPractice';
import { ConjugationsSession } from '../pages/Conjugations';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import TileDrill, { type DrillQuestion } from '../components/drills/TileDrill';
import TypeDrill from '../components/drills/TypeDrill';
import { getPracticeSentences } from '../data/sentences';
import { esClozeSentences } from '../data/cloze';
import TypeBuilder from '../components/sentences/TypeBuilder';
import TileBuilder from '../components/sentences/TileBuilder';
import PracticeWordCapture from '../components/common/PracticeWordCapture';

const SentenceBuilder = () => SentenceBuilderSession({ current: useCurrentLanguage() });
const ClozePractice = () => ClozePracticeSession({ current: useCurrentLanguage() });
const TranslationPractice = () => TranslationPracticeSession({ current: useCurrentLanguage() });
const Conjugations = () => ConjugationsSession({ current: useCurrentLanguage() });

type Props = { children?: ReactNode; onClick?: () => unknown; onChange?: (event: { target: { value: string } }) => void; [key: string]: unknown };
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<Props>(node)) return text(node.props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function button(tree: ReactNode, label: string) {
  const found = elements(tree).find((element) => element.type === 'button' && text(element) === label);
  if (!found) throw new Error(`Missing button: ${label}`);
  return found.props.onClick!;
}
const bounds = { minItems: 1, targetItems: 1, maxItems: 1 };
const empty = () => buildKnowledgeSnapshot({ language: 'es' });
beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  mocks.descriptor = null;
  mocks.load.mockResolvedValue(empty());
  mocks.tokenize.mockImplementation(async (value: string, language: string) => segmentSurfaceText(value, language));
});

describe('adaptive attempt lifecycle', () => {
  const items = [
    { id: 'easy', language: 'es', difficulty: 'easy', text: 'agua', order: 0 },
    { id: 'hard', language: 'es', difficulty: 'hard', text: 'viajar lejos', order: 100 },
    { id: 'other', language: 'ru', difficulty: 'easy', text: 'вода', order: 0 },
  ];
  it('honors manual bounds and freezes evidence and IDs until a fresh retry', async () => {
    const render = () => hooks.render(() => useAdaptivePractice<typeof items[number]>('es'));
    let hook = render();
    expect(await hook.start(items, { seed: 'same', session: bounds, difficulties: ['hard'] }, (item) => item))
      .toEqual([items[1]]);
    hook = render();
    const frozen = hook.selection;
    mocks.load.mockResolvedValue(buildKnowledgeSnapshot({ language: 'es', lessonTargets: { es: { 'vocab/one': ['agua'] } },
      lessons: [{ id: 'es/vocab/one', language: 'es', lessonId: 'vocab/one', completed: true, quizScore: 100, attempts: 1, completedAt: '2026-01-01' }] }));
    expect(render().selection).toBe(frozen);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    await hook.start(items, { seed: 'same', session: bounds, difficulties: ['easy'] }, (item) => item);
    hook = render();
    expect(hook.selection?.snapshot.revision).not.toBe(frozen?.snapshot.revision);
    expect(hook.selection?.itemIds).toEqual(['easy']);
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });
  it('rejects short guided pools without silently changing difficulty', async () => {
    const render = () => hooks.render(() => useAdaptivePractice<typeof items[number]>('es'));
    const hook = render();
    expect(await hook.start(items, { seed: 'guided', session: { minItems: 2, targetItems: 2, maxItems: 3 }, difficulties: ['hard'] }, (item) => item)).toBeNull();
    expect(render().error).toContain('Not enough items');
    expect(render().selection?.itemIds).toEqual(['hard']);
  });
  it('cannot return another language when IDs overlap across language pools', async () => {
    const mixed = [items[0], { ...items[2], id: items[0].id }];
    const hook = hooks.render(() => useAdaptivePractice<typeof items[number]>('es'));
    expect(await hook.start(mixed, { seed: 'x', session: bounds }, (item) => item)).toEqual([items[0]]);
    expect(mocks.tokenize).toHaveBeenCalledTimes(1);
    expect(mocks.tokenize).toHaveBeenCalledWith('agua', 'es');
  });
  it('discards obsolete asynchronous attempts after reset', async () => {
    let resolve!: (value: ReturnType<typeof empty>) => void;
    mocks.load.mockReturnValue(new Promise((done) => { resolve = done; }));
    const render = () => hooks.render(() => useAdaptivePractice<typeof items[number]>('es'));
    const hook = render();
    const pending = hook.start(items, { seed: 'x', session: bounds }, (item) => item);
    hook.reset();
    resolve(empty());
    expect(await pending).toBeNull();
    expect(render().selection).toBeNull();
  });
  it('exposes loading and actionable failure instead of a failure-shaped beginner session', async () => {
    const render = () => hooks.render(() => useAdaptivePractice<typeof items[number]>('es'));
    const hook = render();
    mocks.load.mockRejectedValue(new Error('storage unavailable'));
    const pending = hook.start(items, { seed: 'x', session: bounds }, (item) => item);
    expect(render().status).toBe('loading');
    expect(await pending).toBeNull();
    expect(render().error).toContain('try starting again');
  });
  it('discards an old-language request and never exposes its evidence in the next language', async () => {
    let language = 'es';
    let resolve!: (value: ReturnType<typeof empty>) => void;
    mocks.load.mockReturnValue(new Promise((done) => { resolve = done; }));
    const render = () => hooks.render(() => useAdaptivePractice<typeof items[number]>(language));
    const hook = render();
    const pending = hook.start(items, { seed: 'x', session: bounds }, (item) => item);
    language = 'ru';
    expect(render().selection).toBeNull();
    resolve(empty());
    expect(await pending).toBeNull();
    expect(render().selection).toBeNull();
  });
});

describe('page and reveal regressions', () => {
  it('sentence builder preserves a manually chosen hard pool and grades without saving before reveal', async () => {
    let tree = hooks.render(SentenceBuilder);
    button(tree, 'hard')();
    tree = hooks.render(SentenceBuilder);
    await button(tree, 'Start Practice')();
    tree = hooks.render(SentenceBuilder);
    const builder = elements(tree).find((element) => element.type === TileBuilder)!;
    expect((builder.props.sentence as PracticeSentence).difficulty).toBe('hard');
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    const result = builder.props.onResult as (correct: boolean) => void;
    result(false);
    expect(mocks.addXP).not.toHaveBeenCalled();
  });
  it('guided sentence scope stays inside its exact IDs and participation completes with zero correct', async () => {
    mocks.descriptor = { seed: 'guided', language: 'es', session: bounds, scope: { difficulty: 'easy', itemIds: ['es-e01'] } };
    let tree = hooks.render(SentenceBuilder);
    await button(tree, 'Start Practice')();
    tree = hooks.render(SentenceBuilder);
    const builder = elements(tree).find((element) => element.type === TileBuilder)!;
    expect((builder.props.sentence as PracticeSentence).id).toBe('es-e01');
    (builder.props.onResult as (correct: boolean) => void)(false);
    expect(mocks.complete).toHaveBeenCalledWith({ itemsCompleted: 1, score: 0 });
    expect(mocks.addXP).toHaveBeenCalledWith(20);
  });
  it.each([
    { page: TranslationPractice, filter: 'hard', start: 'Start Practice', pool: getPracticeSentences('es').filter((item) => item.difficulty === 'hard') },
    { page: ClozePractice, filter: 'Advanced', start: 'Start Cloze Practice', pool: esClozeSentences.filter((item) => item.difficulty === 'advanced') },
  ])('manual $filter $start tokenizes only full target text inside the chosen difficulty', async ({ page, filter, start, pool }) => {
    let tree = hooks.render(page);
    const chosen = elements(tree).find((element) => element.type === 'button' && text(element).includes(filter))!;
    chosen.props.onClick!();
    tree = hooks.render(page);
    await button(tree, start)();
    const targets = new Set(pool.map((item) => item.target));
    expect(mocks.tokenize).toHaveBeenCalledTimes(pool.length);
    expect(mocks.tokenize.mock.calls.every(([value, language]) => targets.has(value) && language === 'es')).toBe(true);
  });
  it('translation reveals capture only after an answer and preserves self-grading XP', async () => {
    mocks.descriptor = { seed: 'guided', language: 'es', session: bounds, scope: { difficulty: 'easy' } };
    let tree = hooks.render(TranslationPractice);
    await button(tree, 'Start Practice')();
    tree = hooks.render(TranslationPractice);
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    elements(tree).find((element) => element.type === 'textarea')!.props.onChange!({ target: { value: 'attempt' } });
    tree = hooks.render(TranslationPractice);
    button(tree, 'Check')();
    tree = hooks.render(TranslationPractice);
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(true);
    const grade = elements(tree).find((element) => element.type === 'button' && text(element).includes('Got it'))!;
    grade.props.onClick!();
    expect(mocks.addXP).toHaveBeenCalledWith(25);
    expect(mocks.complete).toHaveBeenCalledWith({ itemsCompleted: 1, score: 100 });
  });
  it('cloze reveals metadata only after answering and keeps a wrong answer in the frozen attempt', async () => {
    mocks.descriptor = { seed: 'guided', language: 'es', session: bounds, scope: { difficulty: 'beginner' } };
    let tree = hooks.render(ClozePractice);
    await button(tree, 'Start Cloze Practice')();
    tree = hooks.render(ClozePractice);
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    elements(tree).find((element) => element.type === 'input')!.props.onChange!({ target: { value: 'incorrect' } });
    tree = hooks.render(ClozePractice);
    const submit = elements(tree).find((element) => element.type === 'button' && text(element).includes('Check'))!;
    submit.props.onClick!();
    tree = hooks.render(ClozePractice);
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(true);
    button(tree, 'See Results')();
    expect(mocks.addXP).toHaveBeenCalledWith(20);
    expect(mocks.complete).toHaveBeenCalledWith({ itemsCompleted: 1, score: 0 });
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });
  it('sentence typing capture is absent until checking, without affecting correctness', () => {
    const sentence: PracticeSentence = { id: 'one', english: 'Water', target: 'agua', targetWords: ['agua'], reading: '', difficulty: 'easy' };
    const result = vi.fn();
    const render = () => hooks.render(() => TypeBuilder({ sentence, language: 'es', onResult: result }));
    let tree = render();
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    elements(tree).find((element) => element.type === 'input')!.props.onChange!({ target: { value: 'AGUA' } });
    tree = render();
    button(tree, 'Check')();
    tree = render();
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(true);
    button(tree, 'Next →')();
    expect(result).toHaveBeenCalledWith(true);
  });
  it('conjugation candidates preserve selected forms and real lemma metadata, not English prompt tokens', () => {
    let tree = hooks.render(Conjugations);
    const form = elements(tree).find((element) => element.type === 'button' && text(element).includes('yo') && text(element).includes('Present'))!;
    expect(form).toBeDefined();
    form.props.onClick!();
    tree = hooks.render(Conjugations);
    return Promise.resolve(button(tree, 'Start Drill')()).then(() => {
      tree = hooks.render(Conjugations);
      const drill = elements(tree).find((element) => element.type === TileDrill)!;
      const questions = drill.props.questions as DrillQuestion[];
      expect(questions.length).toBe(10);
      expect(questions.every((question) => question.language === 'es' && question.lemma && question.meaning && question.correctAnswer)).toBe(true);
      expect(questions.every((question) => question.prompt.includes('yo') && question.prompt.includes('Present'))).toBe(true);
      expect(new Set(questions.map((question) => question.prompt)).size).toBe(questions.length);
    });
  });
  it('conjugation results offer authored lemma capture after participation, without altering XP', async () => {
    mocks.descriptor = { seed: 'guided', language: 'es', session: bounds, scope: { forms: ['presente_yo'] } };
    let tree = hooks.render(Conjugations);
    await button(tree, 'Start Drill')();
    tree = hooks.render(Conjugations);
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    const drill = elements(tree).find((element) => element.type === TileDrill)!;
    (drill.props.onComplete as (correct: number, total: number) => void)(0, 1);
    tree = hooks.render(Conjugations);
    const capture = elements(tree).find((element) => element.type === PracticeWordCapture)!;
    expect(capture.props.language).toBe('es');
    expect((capture.props.words as { lemma: string; meaning: string }[]).every((word) => word.lemma && word.meaning)).toBe(true);
    expect(mocks.complete).toHaveBeenCalledWith({ itemsCompleted: 1, score: 0 });
    expect(mocks.addXP).toHaveBeenCalledWith(20);
  });
  it('typing drill preserves case-insensitive grading and timed completion; capture waits for results', () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      const questions = [{ prompt: 'agua', correctAnswer: 'agua', language: 'es', lemma: 'agua', meaning: 'water' }];
      const render = () => hooks.render(() => TypeDrill({ questions, onComplete }));
      let tree = render();
      elements(tree).find((element) => element.type === 'input')!.props.onChange!({ target: { value: 'AGUA' } });
      tree = render();
      (elements(tree).find((element) => element.type === 'form')!.props.onSubmit as (event: { preventDefault(): void }) => void)({ preventDefault() {} });
      tree = render();
      expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
      expect(onComplete).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(onComplete).toHaveBeenCalledWith(1, 1);
    } finally {
      vi.useRealTimers();
    }
  });
});
