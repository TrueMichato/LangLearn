import 'fake-indexeddb/auto';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => {
  let state: unknown[] = [];
  let cursor = 0;
  return {
    effects: [] as Array<() => void | (() => void)>,
    collect: false,
    reset() { state = []; cursor = 0; this.effects = []; },
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
const story = vi.hoisted(() => vi.fn());
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(), useState: hooks.state, useRef: hooks.ref,
  useCallback: <T,>(fn: T) => fn, useId: () => 'reader-test-instructions',
  useEffect: (effect: () => void) => { if (hooks.collect) hooks.effects.push(effect); },
}));
vi.mock('../hooks/useCurrentLanguage', () => ({
  useCurrentLanguage: () => ({ language: 'es', setLanguage: () => {}, options: ['es'] }),
}));
vi.mock('../hooks/useKnowledge', () => ({
  useKnowledge: () => ({ snapshot: null, status: 'ready' }),
}));
vi.mock('../hooks/useGuidedPractice', () => ({
  useGuidedPractice: () => ({ descriptor: null, isGuided: false }),
}));
vi.mock('../stores/timerStore', () => ({
  useTimerStore: () => ({ isRunning: true, start: () => {} }),
}));
vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: Object.assign(() => ({ showStressMarks: false }), { getState: () => ({}) }),
}));
vi.mock('../lib/reader-coverage', async (original) => ({
  ...await original<typeof import('../lib/reader-coverage')>(), loadReaderStory: story,
}));

import ReaderPage from '../pages/Reader';
import { db, type Text } from '../db/schema';
import TextLibrary from '../components/reader/TextLibrary';
import ContinueReading from '../components/reader/ContinueReading';
import ReadingPurpose from '../components/reader/ReadingPurpose';
import FuriganaText from '../components/reader/FuriganaText';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import ComprehensionIndicator from '../components/reader/ComprehensionIndicator';
import { createReadingProgress, type ReadingProgress } from '../db/reading-progress';

type Props = { children?: ReactNode; [key: string]: unknown };
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return isValidElement<Props>(node) ? [node, ...elements(node.props.children)] : [];
}
function component<T>(tree: ReactNode, type: T) {
  const found = elements(tree).find((element) => element.type === type);
  if (!found) throw new Error('Missing Reader control');
  return found;
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<Props>(node)) return text(node.props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
const render = () => hooks.render(ReaderPage);
function mount() {
  hooks.reset();
  hooks.collect = true;
  render();
  hooks.collect = false;
  const cleanups = hooks.effects.map((effect) => effect());
  return () => { for (const cleanup of cleanups) if (typeof cleanup === 'function') cleanup(); };
}
const sourceText = '  Hola, mundo.\n\nOtro párrafo.';
const record: Text & { id: number } = { id: 5, language: 'es', title: 'Saved story', content: sourceText,
  translation: 'Hello, world.', createdAt: '2026-11-26T00:00:00.000Z' };
const progress = () => createReadingProgress({ kind: 'curated', language: 'es', curatedId: 'hello' }, 'Hola', sourceText);
async function openSaved() {
  await (component(render(), TextLibrary).props.onSelectText as (record: Text) => Promise<void>)(record);
}
async function resume(place: ReadingProgress) {
  (component(render(), ContinueReading).props.onContinue as (place: ReadingProgress) => void)(place);
  await vi.waitFor(() => expect(elements(render()).some((element) => element.type === FuriganaText)).toBe(true));
}

beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()));
  await db.texts.put(record);
  story.mockReset().mockResolvedValue(sourceText);
});
afterEach(() => vi.restoreAllMocks());

describe('Reader continuation and optional support', () => {
  it('reopens the same imported text after a new mount with purpose, paragraph, reflection and translation', async () => {
    const unmount = mount();
    await openSaved();
    (component(render(), ReadingPurpose).props.onChange as (value: string) => void)('close-study');
    (component(render(), FuriganaText).props.onPositionChange as (value: number) => void)(sourceText.indexOf('párrafo'));
    const reflection = elements(render()).find((element) => element.props.id === 'reading-reflection')!;
    (reflection.props.onChange as (event: unknown) => void)({ target: { value: 'A greeting.' } });
    await vi.waitFor(async () => expect((await db.readingProgress.toArray())[0]).toMatchObject({
      position: sourceText.indexOf('Otro'), purpose: 'close-study', reflection: 'A greeting.',
    }));
    unmount();
    mount();
    await resume((await db.readingProgress.toArray())[0]);
    expect(component(render(), FuriganaText).props.resumePosition).toMatchObject({ offset: sourceText.indexOf('Otro') });
    expect(component(render(), ReadingPurpose).props.purpose).toBe('close-study');
    expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('A greeting.');
    expect(text(render())).toContain('Bilingual');
    const startOver = elements(render()).find((element) => element.type === 'button' && text(element) === 'Start over / reread')!;
    (startOver.props.onClick as () => void)();
    expect(component(render(), FuriganaText).props.resumePosition).toMatchObject({ offset: 0 });
    expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('A greeting.');
  });

  it('continues a retained curated story offline without a catalog fetch', async () => {
    const place = { ...progress(), position: sourceText.indexOf('Otro') };
    await db.readingProgress.put(place);
    story.mockRejectedValue(new Error('offline'));
    mount();
    await resume(place);
    expect(component(render(), ComprehensionIndicator).props.text).toBe(sourceText);
    expect(component(render(), FuriganaText).props.resumePosition).toMatchObject({ offset: sourceText.indexOf('Otro') });
    expect(text(render())).toContain('Reading your saved copy');
  });

  it('starts changed curated content at the beginning, keeping the learner’s reflection', async () => {
    const place = { ...progress(), position: sourceText.indexOf('Otro'), reflection: 'My thought.' };
    await db.readingProgress.put(place);
    story.mockResolvedValue('Changed story.\n\nNew ending.');
    mount();
    await resume(place);
    expect(text(render())).toContain('This text has changed');
    expect(component(render(), FuriganaText).props.resumePosition).toMatchObject({ offset: 0 });
    expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('My thought.');
  });

  it('does not continue a deleted or reused imported ID into another text', async () => {
    const place = createReadingProgress({ kind: 'saved', language: 'es', textId: 5, createdAt: record.createdAt }, record.title, sourceText);
    await db.readingProgress.put(place);
    await db.texts.update(5, { createdAt: '2020-01-01', content: 'Unrelated text' });
    mount();
    (component(render(), ContinueReading).props.onContinue as (place: ReadingProgress) => void)(place);
    await vi.waitFor(() => expect(text(render())).toContain('no other text was opened'));
    expect(elements(render()).some((element) => element.type === FuriganaText)).toBe(false);
    expect(await db.readingProgress.get(place.id)).toEqual(place);
  });

  it('keeps coverage, exact original lookup context and explicit capture available in either purpose', async () => {
    mount();
    await openSaved();
    const before = component(render(), ComprehensionIndicator).props.text;
    for (const purpose of ['main-idea', 'close-study']) {
      (component(render(), ReadingPurpose).props.onChange as (value: string) => void)(purpose);
      const reader = component(render(), FuriganaText);
      const segments = reader.props.segments as Array<{ start: number; surface: string }>;
      const index = segments.findIndex((segment) => segment.surface === 'párrafo');
      (reader.props.onWordClick as (surface: string, reading: string, index: number) => void)('párrafo', '', index);
      expect(component(render(), ComprehensionIndicator).props.text).toBe(before);
      expect(component(render(), WordLookupSheet).props.contextSentence).toBe('Otro párrafo.');
      expect(component(render(), WordLookupSheet).props.onAdd).toBeTypeOf('function');
      expect(segments.map((segment) => segment.surface).join('')).toBe(sourceText);
    }
    expect(await db.words.count()).toBe(0);
    expect(await db.reviews.count()).toBe(0);
    expect(await db.testHistory.count()).toBe(0);
  });

  it('retains a failed reflection save for an explicit retry rather than claiming success', async () => {
    mount();
    await openSaved();
    await vi.waitFor(async () => expect(await db.readingProgress.count()).toBe(1));
    const write = vi.spyOn(db.readingProgress, 'put').mockRejectedValueOnce(new Error('quota'));
    const reflection = elements(render()).find((element) => element.props.id === 'reading-reflection')!;
    (reflection.props.onChange as (event: unknown) => void)({ target: { value: 'Keep my draft.' } });
    await vi.waitFor(() => expect(text(render())).toContain('could not be saved'));
    expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('Keep my draft.');
    write.mockRestore();
    const retry = elements(render()).find((element) => element.type === 'button' && text(element) === 'Retry saving reading place')!;
    (retry.props.onClick as () => void)();
    await vi.waitFor(async () => expect((await db.readingProgress.toArray())[0].reflection).toBe('Keep my draft.'));
  });

  it('does not send stale reflection or preferences with automatic position updates', async () => {
    mount();
    await openSaved();
    const saved = (await db.readingProgress.toArray())[0];
    await db.readingProgress.put({ ...saved, reflection: 'Saved from another tab.', purpose: 'close-study', highlight: true });
    (component(render(), FuriganaText).props.onPositionChange as (value: number) => void)(sourceText.indexOf('Otro'));
    await vi.waitFor(async () => expect((await db.readingProgress.toArray())[0]).toMatchObject({
      position: sourceText.indexOf('Otro'), reflection: 'Saved from another tab.', purpose: 'close-study', highlight: true,
    }));
    await vi.waitFor(() => {
      expect(component(render(), ReadingPurpose).props.purpose).toBe('close-study');
      expect(component(render(), ComprehensionIndicator).props.highlightEnabled).toBe(true);
      expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('Saved from another tab.');
    });
  });

  it.each([false, true])('keeps both reflections visible until an explicit resolution (keep draft: %s)', async (keepDraft) => {
    mount();
    await openSaved();
    const saved = (await db.readingProgress.toArray())[0];
    await db.readingProgress.put({ ...saved, reflection: 'Saved elsewhere.' });
    const reflection = elements(render()).find((element) => element.props.id === 'reading-reflection')!;
    (reflection.props.onChange as (event: unknown) => void)({ target: { value: 'My unsaved draft.' } });
    await vi.waitFor(() => expect(text(render())).toContain('Another tab changed this reflection'));
    expect(text(render())).toContain('Saved elsewhere.');
    expect(elements(render()).find((element) => element.props.id === 'reading-reflection')!.props.value).toBe('My unsaved draft.');
    (component(render(), FuriganaText).props.onPositionChange as (value: number) => void)(sourceText.indexOf('Otro'));
    await vi.waitFor(async () => expect((await db.readingProgress.toArray())[0].reflection).toBe('Saved elsewhere.'));
    const label = keepDraft ? 'Replace saved reflection with my draft' : 'Use saved reflection';
    const resolve = elements(render()).find((element) => element.type === 'button' && text(element) === label)!;
    (resolve.props.onClick as () => void)();
    await vi.waitFor(async () => expect((await db.readingProgress.toArray())[0]).toMatchObject({
      position: sourceText.indexOf('Otro'), reflection: keepDraft ? 'My unsaved draft.' : 'Saved elsewhere.',
    }));
  });
});
