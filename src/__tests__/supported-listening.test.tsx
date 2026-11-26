import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListeningPassage } from '../data/listening/ja-passages';
import type { ListeningPlaybackResult } from '../lib/tts';

const hooks = vi.hoisted(() => {
  let slots: unknown[] = [];
  let cursor = 0;
  const cleanups = new Map<number, () => void>();
  return {
    reset() { slots = []; cursor = 0; cleanups.clear(); },
    render<T>(component: () => T) { cursor = 0; return component(); },
    state<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [slots[index] as T, (next: T | ((previous: T) => T)) => {
        slots[index] = typeof next === 'function' ? (next as (value: T) => T)(slots[index] as T) : next;
      }] as const;
    },
    ref<T>(initial: T) { return hooks.state({ current: initial })[0]; },
    effect(effect: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index] as readonly unknown[] | undefined;
      if (!previous || deps.some((value, i) => value !== previous[i])) {
        cleanups.get(index)?.();
        const cleanup = effect();
        if (cleanup) cleanups.set(index, cleanup);
      }
      slots[index] = deps;
    },
    unmount() { cleanups.forEach((cleanup) => cleanup()); cleanups.clear(); },
  };
});
const mocks = vi.hoisted(() => ({
  language: 'es', params: '', adapt: vi.fn(), play: vi.fn(), addXP: vi.fn(), complete: vi.fn(),
  timerStart: vi.fn(), cancel: vi.fn(), descriptor: null as unknown,
}));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: hooks.state, useRef: hooks.ref, useEffect: hooks.effect,
  useCallback: <T,>(fn: T) => fn,
}));
vi.mock('react-router-dom', async (original) => ({
  ...await original<typeof import('react-router-dom')>(),
  useSearchParams: () => [new URLSearchParams(mocks.params)],
}));
vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => ({
    language: mocks.language, requested: mocks.language, setLanguage: vi.fn(),
    options: ['es', 'ar'], isSupported: true,
  }),
}));
vi.mock('../hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: () => ({ start: mocks.adapt, selection: null, status: 'ready' }),
}));
vi.mock('../hooks/useGuidedPractice', () => ({
  useGuidedPractice: () => ({ descriptor: mocks.descriptor, complete: mocks.complete }),
}));
vi.mock('../stores/xpStore', () => ({
  useXPStore: { getState: () => ({ addXP: mocks.addXP }) },
}));
vi.mock('../stores/timerStore', () => ({
  useTimerStore: (select: (state: { start: typeof mocks.timerStart; isRunning: boolean }) => unknown) =>
    select({ start: mocks.timerStart, isRunning: false }),
}));
vi.mock('../lib/tts', () => ({ playListeningPassage: mocks.play, speakWithSpeed: vi.fn() }));

import ListeningPage from '../pages/Listening';
import DictationDrill from '../components/drills/DictationDrill';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import InputActivityLink from '../components/learn/InputActivityLink';

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
function button(tree: ReactNode, label: string) {
  const found = elements(tree).find((element) =>
    element.type === 'button' && (element.props['aria-label'] ?? text(element)) === label);
  if (!found?.props.onClick) throw new Error(`Missing button: ${label}`);
  return found;
}
function click(tree: ReactNode, label: string) { return button(tree, label).props.onClick!(); }
function captures(tree: ReactNode) { return elements(tree).filter((element) => element.type === PracticeWordCapture); }
function render() {
  const outer = ListeningPage();
  return hooks.render(() => (outer.type as (props: typeof outer.props) => ReactElement | null)(outer.props));
}
function playback() {
  let finish!: (result: ListeningPlaybackResult) => void;
  const finished = new Promise<ListeningPlaybackResult>((resolve) => { finish = resolve; });
  const stop = vi.fn(() => finish({ status: 'cancelled' }));
  mocks.play.mockReturnValueOnce({ finished, stop });
  return { finish, stop };
}
const passage: ListeningPassage = {
  id: 'es-fixture', title: 'A cat', difficulty: 'easy', text: 'Hay un gato en el parque.',
  questions: [
    { question: 'Which animal?', options: ['A cat', 'A dog'], correctIndex: 0 },
    { question: 'Where is it?', options: ['At home', 'In the park'], correctIndex: 1 },
  ],
};
async function start() {
  await click(render(), 'Start Listening Practice');
  return render();
}
beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  mocks.language = 'es';
  mocks.params = '';
  mocks.descriptor = null;
  mocks.adapt.mockResolvedValue([passage]);
  vi.stubGlobal('window', { speechSynthesis: { cancel: mocks.cancel } });
});
afterEach(() => { hooks.unmount(); vi.unstubAllGlobals(); });

describe('supported listening', () => {
  it('starts listen-first, allows transcript support before playback, and keeps support after hiding it', async () => {
    let tree = await start();
    expect(text(tree)).not.toContain(passage.text);
    expect(text(tree)).not.toMatch(/Listen \d more/);
    expect(text(tree)).toContain('Repeating is optional');
    expect(captures(tree)).toHaveLength(0);
    expect(button(tree, 'Show transcript').props['aria-expanded']).toBe(false);
    click(tree, 'Show transcript');
    tree = render();
    expect(text(tree)).toContain(passage.text);
    expect(text(tree)).toContain('Transcript-supported attempt');
    expect(text(tree)).toContain('does not reduce XP');
    click(tree, 'Hide transcript');
    tree = render();
    expect(text(tree)).not.toContain(passage.text);
    expect(text(tree)).toContain('Transcript-supported attempt');
    click(tree, 'Answer Questions →');
    tree = render();
    expect(text(tree)).toContain('Which animal?');
    expect(captures(tree)).toHaveLength(0);
    expect(mocks.play).not.toHaveBeenCalled();
    expect(mocks.addXP).not.toHaveBeenCalled();
    expect(mocks.timerStart).toHaveBeenCalledWith('listening');
  });

  it('supports stop, replay, speed, and transcript during questions and textual feedback without changing XP', async () => {
    let tree = await start();
    const first = playback();
    click(tree, '0.5x');
    tree = render();
    click(tree, 'Play passage');
    tree = render();
    expect(mocks.play).toHaveBeenCalledWith(passage.text, 'es', 0.5);
    expect(button(tree, 'Stop playback').props.disabled).not.toBe(true);
    click(tree, 'Stop playback');
    await Promise.resolve();
    expect(first.stop).toHaveBeenCalledOnce();
    expect(text(render())).not.toContain('Answer Questions →');

    const second = playback();
    click(render(), 'Play passage');
    second.finish({ status: 'ended' });
    await Promise.resolve();
    tree = render();
    click(tree, 'Answer Questions →');
    tree = render();
    expect(text(tree)).not.toContain(passage.text);
    const third = playback();
    click(tree, 'Replay passage');
    tree = render();
    click(tree, 'Show transcript');
    tree = render();
    expect(text(tree)).toContain(passage.text);
    click(tree, 'A dog');
    tree = render();
    expect(text(tree)).toContain('Not quite');
    expect(text(tree)).toContain('Your answer: A dog');
    expect(text(tree)).toContain('Correct answer: A cat');
    expect(elements(tree).some((element) => element.props.role === 'status' && text(element).includes('Not quite'))).toBe(true);
    expect(text(tree)).toContain('full transcript');
    expect(captures(tree)).toHaveLength(0);
    const fourth = playback();
    click(tree, 'Replay from start');
    expect(third.stop).toHaveBeenCalledOnce();
    tree = render();
    click(tree, 'Next Question →');
    expect(fourth.stop).toHaveBeenCalledOnce();
    tree = render();
    click(tree, 'In the park');
    tree = render();
    expect(text(tree)).toContain('Correct.');
    expect(text(tree)).toContain('Correct answer: In the park');
    click(tree, 'See Results');
    tree = render();
    expect(text(tree)).toContain('Transcript-supported attempt');
    expect(captures(tree)[0].props.text).toBe(passage.text);
    expect(elements(tree).find((element) => element.type === InputActivityLink)?.props)
      .toMatchObject({ language: 'es', after: 'listening' });
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(30);
    expect(mocks.adapt).toHaveBeenCalledOnce();
    const review = playback();
    click(tree, 'Replay passage');
    review.finish({ status: 'ended' });
    await Promise.resolve();
    expect(mocks.addXP).toHaveBeenCalledExactlyOnceWith(30);
  });

  it.each([
    [{ status: 'unavailable', reason: 'no-voice' }, 'No Spanish speech voice'],
    [{ status: 'unavailable', reason: 'unsupported' }, 'Speech playback is not available'],
    [{ status: 'error', reason: 'network' }, 'Speech playback could not finish'],
  ] as const)('offers a transcript and retry after %j instead of claiming playback succeeded', async (result, message) => {
    let tree = await start();
    const audio = playback();
    click(tree, 'Play passage');
    audio.finish(result);
    await Promise.resolve();
    tree = render();
    expect(text(tree)).toContain(message);
    expect(text(tree)).not.toContain('Answer Questions →');
    click(tree, 'Show transcript');
    tree = render();
    click(tree, 'Answer Questions →');
    tree = render();
    const retry = playback();
    click(tree, 'Replay passage');
    retry.finish({ status: 'ended' });
    await Promise.resolve();
    expect(text(render())).not.toContain(message);
  });

  it('cancels on back, next passage, and unmount; stale completions cannot unlock another passage', async () => {
    let tree = await start();
    const old = playback();
    click(tree, 'Play passage');
    tree = render();
    click(tree, '← Back');
    expect(old.stop).toHaveBeenCalledOnce();
    tree = await start();
    old.finish({ status: 'ended' });
    await Promise.resolve();
    expect(text(render())).not.toContain('Answer Questions →');
    click(tree, 'Show transcript');
    click(render(), 'Answer Questions →');
    click(render(), 'A cat');
    click(render(), 'Next Question →');
    click(render(), 'In the park');
    click(render(), 'See Results');
    const summary = playback();
    click(render(), 'Replay passage');
    await click(render(), 'Next Passage');
    expect(summary.stop).toHaveBeenCalledOnce();
    tree = render();
    expect(text(tree)).not.toContain(passage.text);
    expect(text(tree)).not.toContain('Transcript-supported attempt');
    const last = playback();
    click(tree, 'Play passage');
    hooks.unmount();
    expect(last.stop).toHaveBeenCalledOnce();
  });

  it('keeps Arabic transcript direction and lang, and does not invent a passage explanation', async () => {
    mocks.language = 'ar';
    const arabic = { ...passage, id: 'ar-fixture', text: 'القطة في الحديقة.' };
    mocks.adapt.mockResolvedValue([arabic]);
    let tree = await start();
    click(tree, 'Show transcript');
    tree = render();
    const transcript = elements(tree).find((element) => element.type === 'p' && text(element) === arabic.text)!;
    expect(transcript.props.dir).toBe('rtl');
    expect(transcript.props.lang).toBe('ar');
    click(tree, 'Answer Questions →');
    click(render(), 'A cat');
    tree = render();
    expect(text(tree)).toContain('full transcript');
    expect(text(tree)).not.toMatch(/explanation|excerpt/i);
  });

  it('still delegates dictation without starting comprehension audio or changing completion rewards', async () => {
    mocks.params = 'mode=dictation';
    await click(render(), 'Start Dictation Practice');
    const drill = elements(render()).find((element) => element.type === DictationDrill)!;
    expect(drill.props.language).toBe('es');
    expect(drill.props.difficulty).toBe('all');
    (drill.props.onComplete as (stats: { correct: number; total: number; xpEarned: number }) => void)(
      { correct: 1, total: 2, xpEarned: 20 },
    );
    expect(mocks.complete).toHaveBeenCalledWith({ itemsCompleted: 2, score: 50 });
    expect(mocks.play).not.toHaveBeenCalled();
    expect(mocks.addXP).not.toHaveBeenCalled();
  });
});
