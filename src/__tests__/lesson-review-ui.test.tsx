import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReactMarkdown from 'react-markdown';
import portuguesePronunciation from '../../public/content/grammar/pt/pronunciation.md?raw';
import romanianPronunciation from '../../public/content/grammar/ro/pronunciation.md?raw';

const hooks = vi.hoisted(() => {
  let slots: unknown[] = [];
  let cursor = 0;
  let pending: (() => void)[] = [];
  let cleanups: (() => void)[] = [];
  const same = (left: readonly unknown[] | undefined, right: readonly unknown[] | undefined) =>
    !!left && !!right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  return {
    reset() { slots = []; cursor = 0; pending = []; cleanups = []; },
    render<T>(component: () => T) { cursor = 0; return component(); },
    flush() { const effects = pending; pending = []; effects.forEach((effect) => effect()); },
    dispose() { cleanups.forEach((cleanup) => cleanup()); },
    state<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [slots[index] as T, (next: T | ((previous: T) => T)) => {
        slots[index] = typeof next === 'function' ? (next as (value: T) => T)(slots[index] as T) : next;
      }] as const;
    },
    ref<T>(initial: T) {
      const [reference] = hooks.state({ current: initial });
      return reference;
    },
    memo<T>(make: () => T, dependencies?: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index] as { dependencies?: readonly unknown[]; value: T } | undefined;
      if (!previous || !same(previous.dependencies, dependencies)) slots[index] = { dependencies, value: make() };
      return (slots[index] as { value: T }).value;
    },
    effect(effect: () => void | (() => void), dependencies?: readonly unknown[]) {
      const index = cursor++;
      const previous = slots[index] as { dependencies?: readonly unknown[]; cleanup?: () => void } | undefined;
      if (previous && same(previous.dependencies, dependencies)) return;
      const slot = { dependencies, cleanup: undefined as (() => void) | undefined };
      slots[index] = slot;
      pending.push(() => {
        previous?.cleanup?.();
        const cleanup = effect();
        if (cleanup) { slot.cleanup = cleanup; cleanups.push(cleanup); }
      });
    },
  };
});

const mocks = vi.hoisted(() => ({
  findSaved: vi.fn(), reconcile: vi.fn(), save: vi.fn(), progress: vi.fn(), markComplete: vi.fn(), attempts: vi.fn(), xp: vi.fn(),
}));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: hooks.state, useRef: hooks.ref, useMemo: hooks.memo, useEffect: hooks.effect,
  useCallback: <T,>(callback: T, dependencies?: readonly unknown[]) => hooks.memo(() => callback, dependencies),
  useId: () => hooks.memo(() => 'lesson-review-test', []),
}));
vi.mock('../db/lesson-cards', () => ({
  findSavedLessonItems: mocks.findSaved, reconcileSavedLessonItems: mocks.reconcile, saveLessonReviewItems: mocks.save,
}));
vi.mock('../db/lessons', () => ({ getLessonProgress: mocks.progress, markLessonComplete: mocks.markComplete, incrementAttempts: mocks.attempts }));
vi.mock('../stores/xpStore', () => ({ useXPStore: { getState: () => ({ addXP: mocks.xp }) } }));

import LessonView from '../components/grammar/LessonView';
import LessonCaptureModal from '../components/grammar/LessonCaptureModal';
import LessonReviewEditor from '../components/grammar/LessonReviewEditor';
import GrammarQuiz from '../components/grammar/GrammarQuiz';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import { parseListCandidates, parseTableCandidates } from '../lib/lesson-capture';
import type { GrammarReviewItem, LessonReviewItem } from '../lib/lesson-review';

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
function control(tree: ReactNode, label: string) {
  const button = elements(tree).find((element) => element.type === 'button' && text(element) === label);
  if (!button?.props.onClick) throw new Error(`Missing control: ${label}`);
  return button;
}
function click(tree: ReactNode, label: string) { return control(tree, label).props.onClick!(); }
function child(tree: ReactNode, type: unknown) {
  const found = elements(tree).find((element) => element.type === type);
  if (!found) throw new Error('Expected child component');
  return found;
}
async function settle() {
  hooks.flush();
  for (let index = 0; index < 12; index++) await Promise.resolve();
}

const rule: GrammarReviewItem = {
  id: 'seven-letter', kind: 'rule', source: 'grammar-card', format: 'qa', provenance: 'authored',
  priority: 'essential', sourceSection: 'Seven letters', rule: 'The seven-letter rule', hint: '',
  prompt: 'Which seven letters take И rather than Ы?', answer: 'Г, К, Х, Ж, Ч, Ш, Щ',
  explanation: 'This rule does not include Ц.', legacyAliases: [],
};
const vocabulary: LessonReviewItem = {
  id: 'book', kind: 'vocabulary', source: 'vocab-card', provenance: 'authored', priority: 'essential',
  sourceSection: 'Examples', word: 'книга', reading: '', meaning: 'book', contextSentence: '', isSentence: false, sourceText: '',
};
const optional: LessonReviewItem = { ...rule, id: 'extra', provenance: 'legacy', priority: 'optional', prompt: 'One extra application?' };

beforeEach(() => {
  hooks.reset();
  vi.clearAllMocks();
  vi.stubGlobal('document', { activeElement: { focus: vi.fn() } });
  mocks.findSaved.mockResolvedValue(new Set());
  mocks.reconcile.mockResolvedValue({ repaired: 0 });
  mocks.save.mockResolvedValue({ added: 1, alreadySaved: 0, grammarAdded: 0 });
  mocks.progress.mockResolvedValue([]);
  mocks.markComplete.mockResolvedValue(undefined);
  mocks.attempts.mockResolvedValue(undefined);
});
afterEach(() => { hooks.dispose(); vi.unstubAllGlobals(); });

describe('explicit lesson review selection', () => {
  it('preselects only unsaved essential items, keeps legacy extras optional, and reports actual save counts/XP', async () => {
    const items = [vocabulary, rule, optional];
    const onSaved = vi.fn();
    const render = () => hooks.render(() => LessonCaptureModal({ items, language: 'ru', lessonId: 'spelling-rules', onClose: vi.fn(), onSaved }));
    render();
    await settle();
    let tree = render();
    const checkbox = (label: string) => elements(tree).find((element) => element.type === 'input' && element.props['aria-label'] === label)!;
    expect(checkbox('Save книга').props.checked).toBe(true);
    expect(checkbox(`Save ${rule.prompt}`).props.checked).toBe(true);
    expect(checkbox(`Save ${optional.prompt}`).props.checked).toBe(false);
    mocks.save.mockResolvedValue({ added: 1, alreadySaved: 1, grammarAdded: 1 });
    await click(tree, 'Save 2 items for review');
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith([vocabulary, rule], 'ru', 'spelling-rules');
    expect(onSaved).toHaveBeenCalledExactlyOnceWith(1);
    expect(mocks.xp).toHaveBeenCalledExactlyOnceWith(5);
    tree = render();
    expect(text(tree)).toContain('Added 1 item; 1 already saved.');
    expect(text(tree)).toContain('Go to Review');
    expect(control(tree, 'Save 0 items for review').props.disabled).toBe(true);
  });

  it('disables already-saved authored items and recovers from a saved-state check failure without pretending the lesson is empty', async () => {
    mocks.findSaved.mockRejectedValueOnce(new Error('database busy')).mockResolvedValue(new Set([rule.id]));
    const items = [rule, optional];
    const render = () => hooks.render(() => LessonCaptureModal({ items, language: 'ru', lessonId: 'spelling-rules', onClose: vi.fn(), onSaved: vi.fn() }));
    render(); await settle();
    let tree = render();
    expect(text(tree)).toContain('Could not check your saved cards');
    click(tree, 'Retry checking saved cards');
    render(); await settle();
    tree = render();
    const saved = elements(tree).find((element) => element.props['aria-label'] === `Save ${rule.prompt}`)!;
    expect(saved.props.checked).toBe(true);
    expect(saved.props.disabled).toBe(true);
    expect(text(tree)).toContain('Already saved');
    expect(control(tree, 'Save 0 items for review').props.disabled).toBe(true);
  });

  it('keeps edited authored wording and its identity selected through a failed save and retry', async () => {
    const items = [rule];
    const render = () => hooks.render(() => LessonCaptureModal({ items, language: 'ru', lessonId: 'spelling-rules', onClose: vi.fn(), onSaved: vi.fn() }));
    render(); await settle();
    click(render(), 'Edit review item');
    let tree = render();
    const edited = { ...rule, prompt: 'My focused question?', answer: 'My answer', learnerEdited: true };
    (child(tree, LessonReviewEditor).props.onCommit as (item: GrammarReviewItem) => void)(edited);
    tree = render();
    mocks.save.mockRejectedValueOnce(new Error('write failed')).mockResolvedValueOnce({ added: 1, alreadySaved: 0, grammarAdded: 1 });
    await click(tree, 'Save 1 item for review');
    tree = render();
    expect(text(tree)).toContain('Your edits and choices are still here');
    expect(text(tree)).toContain('My focused question?');
    await click(tree, 'Retry: save 1 item for review');
    expect(mocks.save.mock.calls.map((call) => call[0])).toEqual([[edited], [edited]]);
  });

  it('creates a personal rule once, retains its UUID through retries, and awards no new custom XP', async () => {
    const items: LessonReviewItem[] = [];
    const render = () => hooks.render(() => LessonCaptureModal({ items, language: 'es', lessonId: 'accent-rules', onClose: vi.fn(), onSaved: vi.fn() }));
    render(); await settle();
    click(render(), 'Save something else');
    click(render(), 'Rule or concept');
    const editor = child(render(), LessonReviewEditor);
    const draft = editor.props.item as GrammarReviewItem;
    expect(draft.id).toMatch(/^custom:/);
    expect(draft.provenance).toBe('custom');
    const custom = { ...draft, kind: 'concept' as const, prompt: 'Why is árbol accented?', answer: 'It breaks the default stress pattern.', learnerEdited: true };
    (editor.props.onCommit as (item: GrammarReviewItem) => void)(custom);
    mocks.save.mockRejectedValueOnce(new Error('write failed')).mockResolvedValueOnce({ added: 1, alreadySaved: 0, grammarAdded: 0 });
    await click(render(), 'Save 1 item for review');
    await click(render(), 'Retry: save 1 item for review');
    expect(mocks.save.mock.calls.map((call) => (call[0] as LessonReviewItem[])[0].id)).toEqual([draft.id, draft.id]);
    expect(mocks.xp).not.toHaveBeenCalled();
  });

  it('requires a real blank in cloze mode and stages valid edits without writing cards', () => {
    const commit = vi.fn();
    const render = () => hooks.render(() => LessonReviewEditor({
      item: { ...rule, provenance: 'custom', id: 'custom:fixed', format: 'cloze' }, language: 'ru',
      onCommit: commit, onCancel: vi.fn(),
    }));
    let tree = render();
    const submit = () => (child(tree, 'form').props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn() });
    submit();
    tree = render();
    expect(text(tree)).toContain('Use ___ in the example');
    expect(commit).not.toHaveBeenCalled();
    const prompt = elements(tree).find((element) => element.type === 'textarea' && element.props.value === rule.prompt)!;
    (prompt.props.onChange as (event: unknown) => void)({ target: { value: 'После Г, К, Х, Ж, Ч, Ш, Щ пишем ___.' } });
    tree = render();
    submit();
    expect(commit).toHaveBeenCalledWith(expect.objectContaining({
      id: 'custom:fixed', format: 'cloze', learnerEdited: true, prompt: 'После Г, К, Х, Ж, Ч, Ш, Щ пишем ___.',
    }));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('ignores repeated save clicks and Escape while a batch is pending', async () => {
    let resolve!: (value: { added: number; alreadySaved: number; grammarAdded: number }) => void;
    mocks.save.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const close = vi.fn();
    const items = [rule];
    const render = () => hooks.render(() => LessonCaptureModal({
      items, language: 'ru', lessonId: 'spelling-rules', onClose: close, onSaved: vi.fn(),
    }));
    render(); await settle();
    const tree = render();
    const pending = click(tree, 'Save 1 item for review') as Promise<void>;
    await click(tree, 'Save 1 item for review');
    const busy = render();
    const dialog = elements(busy).find((element) => element.props.role === 'dialog')!;
    (dialog.props.onKeyDown as (event: unknown) => void)({ key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() });
    expect(close).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(control(busy, 'Saving…').props.disabled).toBe(true);
    resolve({ added: 1, alreadySaved: 0, grammarAdded: 1 });
    await pending;
    expect(mocks.xp).toHaveBeenCalledExactlyOnceWith(5);
  });

  it('replaces the picker with the existing offline word editor and keeps lesson language/identity on retry', async () => {
    const items: LessonReviewItem[] = [];
    const render = () => hooks.render(() => LessonCaptureModal({ items, language: 'ar', lessonId: 'masdar', onClose: vi.fn(), onSaved: vi.fn() }));
    render(); await settle();
    click(render(), 'Save something else');
    click(render(), 'Word or phrase');
    let tree = render();
    expect(isValidElement(tree) && tree.type).toBe(WordLookupSheet);
    expect(elements(tree).filter((element) => element.props.role === 'dialog')).toHaveLength(0);
    expect(child(tree, WordLookupSheet).props.language).toBe('ar');
    const add = child(tree, WordLookupSheet).props.onAdd as (...args: string[]) => Promise<unknown>;
    mocks.save.mockRejectedValueOnce(new Error('offline write failure'));
    await expect(add('دِرَاسَةٌ', 'dirāsatun', 'study', 'أحب الدراسة')).rejects.toThrow('offline write failure');
    await add('دِرَاسَةٌ', 'dirāsatun', 'study', 'أحب الدراسة');
    const first = mocks.save.mock.calls[0][0][0] as LessonReviewItem;
    expect(first).toMatchObject({ provenance: 'custom', kind: 'vocabulary', word: 'دِرَاسَةٌ', meaning: 'study', sourceSection: 'masdar', learnerEdited: true });
    expect(mocks.save.mock.calls[1][0][0].id).toBe(first.id);
    expect(mocks.save.mock.calls[1].slice(1)).toEqual(['ar', 'masdar']);
    expect(mocks.xp).not.toHaveBeenCalled();
    (child(tree, WordLookupSheet).props.onClose as () => void)();
    tree = render();
    expect(text(tree)).toContain('Already saved');
  });

  it('surfaces malformed metadata, traps focus, supports Escape, and restores the opener', async () => {
    const close = vi.fn(), restore = vi.fn(), firstFocus = vi.fn(), lastFocus = vi.fn();
    const opener = { focus: restore };
    vi.stubGlobal('document', { activeElement: opener });
    const props = {
      items: [] as LessonReviewItem[], language: 'ru', lessonId: 'broken', onClose: close, onSaved: vi.fn(),
      diagnostics: [{ code: 'invalid-json' as const, block: 'grammar-card' as const, line: 2, message: 'Invalid JSON' }],
    };
    const render = () => hooks.render(() => LessonCaptureModal(props));
    render(); await settle();
    const tree = render();
    expect(text(tree)).toContain('Some lesson review material could not be read');
    expect(text(tree)).toContain('No readable review items');
    const dialog = elements(tree).find((element) => element.props.role === 'dialog')!;
    const first = { focus: firstFocus }, last = { focus: lastFocus };
    (dialog.props.ref as { current: unknown }).current = { querySelectorAll: () => [first, last] };
    const key = dialog.props.onKeyDown as (event: unknown) => void;
    vi.stubGlobal('document', { activeElement: last });
    const preventDefault = vi.fn();
    key({ key: 'Tab', shiftKey: false, preventDefault, stopPropagation: vi.fn() });
    expect(firstFocus).toHaveBeenCalledOnce();
    vi.stubGlobal('document', { activeElement: first });
    key({ key: 'Tab', shiftKey: true, preventDefault, stopPropagation: vi.fn() });
    expect(lastFocus).toHaveBeenCalledOnce();
    key({ key: 'Escape', preventDefault, stopPropagation: vi.fn() });
    expect(close).toHaveBeenCalledOnce();
    hooks.dispose();
    expect(restore).toHaveBeenCalled();
  });
});

describe('lesson completion stays separate from review saving', () => {
  const markdown = `# Spelling
- **книга** — book
<!-- vocab-card: {"id":"shirt","priority":"essential","sourceSection":"Quiz","word":"рубашка","meaning":"shirt"} -->
<!-- grammar-card: {"id":"rule","kind":"concept","format":"qa","priority":"essential","sourceSection":"Rule","rule":"A rule","example":"A hidden authored question?","answer":"A hidden authored answer","explanation":"Why"} -->
<!-- quiz: {"type":"multiple-choice","question":"Choose the correctly spelled shirt","options":["рубашка","рубашкы"],"answer":0} -->`;
  function lesson(lang = 'ru') {
    const props = {
      lang, lessonId: 'spelling-rules', onBack: vi.fn(), onNavigate: vi.fn(),
      lessons: [{ id: 'spelling-rules', title: 'Spelling', order: 1 }, { id: 'next', title: 'Next', order: 2 }],
    };
    const outer = LessonView(props);
    const component = outer.type as (props: typeof outer.props) => ReactNode;
    return () => hooks.render(() => component(outer.props));
  }

  it('does not expose authored grammar or quiz-only vocabulary before completion, then records the same score without adding cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => markdown }));
    const render = lesson();
    render(); await settle();
    let tree = render();
    click(tree, 'Save lesson vocabulary');
    tree = render();
    let picker = child(tree, LessonCaptureModal);
    expect((picker.props.items as LessonReviewItem[]).map((item) => item.kind)).toEqual(['vocabulary']);
    expect((picker.props.items as LessonReviewItem[]).map((item) => item.id)).not.toContain('shirt');
    (picker.props.onClose as () => void)();
    const quiz = child(render(), GrammarQuiz);
    expect((quiz.props.captureWords as { word: string }[]).map((item) => item.word)).toEqual(['рубашка']);
    expect(quiz.props.captureWords).toEqual([expect.objectContaining({ tags: ['grammar', 'lesson:spelling-rules'] })]);
    (quiz.props.onAnswer as (correct: boolean) => void)(false);
    render(); await settle();
    tree = render();
    expect(mocks.markComplete).toHaveBeenCalledExactlyOnceWith('ru', 'spelling-rules', 0);
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'rule' })]), 'ru', 'spelling-rules');
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.xp).not.toHaveBeenCalled();
    expect(control(tree, 'Next →').props.disabled).toBe(false);
    click(tree, 'Choose review material');
    picker = child(render(), LessonCaptureModal);
    expect((picker.props.items as LessonReviewItem[]).map((item) => item.id)).toContain('rule');
    (picker.props.onClose as () => void)();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('preserves a previous score on reopen, then persists a completed retake instead of only updating the panel', async () => {
    const stored = { lessonId: 'spelling-rules', completed: true, quizScore: 0, completionMethod: 'lesson' };
    mocks.progress.mockImplementation(async () => [stored]);
    mocks.markComplete.mockImplementation(async (_language: string, _lessonId: string, score: number) => { stored.quizScore = score; });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => markdown }));
    const render = lesson();
    render(); await settle();
    let tree = render();
    await settle();
    expect(stored.quizScore).toBe(0);
    expect(mocks.markComplete).not.toHaveBeenCalled();
    (child(tree, GrammarQuiz).props.onAnswer as (correct: boolean) => void)(true);
    render(); await settle();
    tree = render();
    expect(text(tree)).toContain('Lesson complete! Score: 100%');
    expect(mocks.markComplete).toHaveBeenCalledExactlyOnceWith('ru', 'spelling-rules', 100);
    expect(stored.quizScore).toBe(100);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.xp).not.toHaveBeenCalled();
  });

  it('reconciles existing source material before checking saved cards on a completed revisit, with retry but no additions or XP', async () => {
    mocks.progress.mockResolvedValue([{ lessonId: 'spelling-rules', completed: true, quizScore: 90 }]);
    mocks.reconcile.mockRejectedValueOnce(new Error('database busy')).mockResolvedValue({ repaired: 1 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => markdown }));
    const render = lesson();
    render(); await settle();
    render(); await settle();
    let tree = render();
    expect(text(tree)).toContain('Could not refresh your saved lesson material');
    click(tree, 'Retry saved material');
    render(); await settle();
    tree = render();
    expect(text(tree)).not.toContain('Could not refresh your saved lesson material');
    expect(mocks.reconcile).toHaveBeenCalledTimes(2);
    expect(mocks.reconcile).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'rule', provenance: 'authored' }),
      expect.objectContaining({ id: 'shirt', provenance: 'authored' }),
    ]), 'ru', 'spelling-rules');
    expect(mocks.reconcile.mock.invocationCallOrder.at(-1)).toBeLessThan(mocks.findSaved.mock.invocationCallOrder.at(-1)!);
    expect(mocks.markComplete).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.xp).not.toHaveBeenCalled();
  });

  it('does not rewrite a previously completed no-quiz lesson merely by reopening it', async () => {
    mocks.progress.mockResolvedValue([{ lessonId: 'spelling-rules', completed: true, quizScore: 60 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '# Reference\nA reference lesson without quizzes.' }));
    const render = lesson();
    render(); await settle();
    render(); await settle();
    expect(mocks.markComplete).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('reopens previously completed/tested-out lesson material without retaking a quiz or rewriting progress', async () => {
    mocks.progress.mockResolvedValue([{ lessonId: 'spelling-rules', completed: true, quizScore: 90, completionMethod: 'tested-out' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => markdown }));
    const render = lesson();
    render(); await settle();
    let tree = render();
    expect(text(tree)).toContain('Previously completed');
    click(tree, 'Choose review material');
    tree = render();
    expect((child(tree, LessonCaptureModal).props.items as LessonReviewItem[]).some((item) => item.id === 'rule')).toBe(true);
    expect(mocks.markComplete).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('never falls back to tokenizing script distractors when no correct authored vocabulary is available', () => {
    const props = {
      type: 'multiple-choice' as const, language: 'ru', question: 'Choose a spelling', options: ['книги', 'книгы'],
      answer: 0, selectedIndex: 1, captureAfterAnswer: true, targetOptionIndices: [0, 1],
    };
    let tree = hooks.render(() => GrammarQuiz({ ...props, captureWords: [] }));
    expect(elements(tree).some((element) => element.type === PracticeWordCapture)).toBe(false);
    tree = hooks.render(() => GrammarQuiz({ ...props, captureWords: [{ word: 'книги', meaning: 'books' }, { word: 'книгы' }] }));
    expect(child(tree, PracticeWordCapture).props.words).toEqual([{ word: 'книги', meaning: 'books' }]);
    expect(child(tree, PracticeWordCapture).props.text).toBeUndefined();
  });

  it.each([true, false])('keeps phonetics out of the picker and revealed quiz capture with authored vocabulary=%s', async (hasVocabulary) => {
    const source = `# Pronunciation
<!-- vocab-inventory: {"mode":"explicit"} -->
- **casa** — house
- **ã** — nasal "ah": **maçã** (mah-sah) — apple
- **Don't pronounce H** — "hotel" is (oh-TEW), not "ho-tel"
${hasVocabulary ? '<!-- vocab-card: {"id":"house","word":"casa","meaning":"house","priority":"essential","sourceSection":"Vowels"} -->' : ''}
<!-- quiz: {"type":"multiple-choice","question":"Which guidance accompanies casa and ã?","options":["Don't pronounce H","Roll every R"],"answer":0} -->`;
    mocks.progress.mockResolvedValue([{ lessonId: 'spelling-rules', completed: true, quizScore: 100 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => source }));
    const render = lesson('pt');
    render(); await settle();
    let tree = render();
    const quiz = child(tree, GrammarQuiz);
    expect(quiz.props.captureWords).toEqual(hasVocabulary
      ? [expect.objectContaining({ id: 'house', word: 'casa', meaning: 'house' })]
      : []);
    click(tree, 'Choose review material');
    tree = render();
    expect((child(tree, LessonCaptureModal).props.items as LessonReviewItem[]).map((item) => item.id))
      .toEqual(hasVocabulary ? ['house'] : []);
    hooks.reset();
    const revealed = hooks.render(() => GrammarQuiz({
      ...quiz.props as unknown as Parameters<typeof GrammarQuiz>[0], selectedIndex: 0,
    }));
    const tools = elements(revealed).filter((element) => element.type === PracticeWordCapture);
    expect(tools).toHaveLength(hasVocabulary ? 1 : 0);
    if (hasVocabulary) {
      expect(tools[0].props.words).toEqual([expect.objectContaining({ word: 'casa' })]);
      expect(tools[0].props.text).toBeUndefined();
    }
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    {
      language: 'pt', source: portuguesePronunciation,
      badTerms: ["Don't pronounce H", 'ã', 'Initial R / RR'],
      lexicalIds: ['vocab-casa', 'vocab-maca'], ruleIds: ['initial-h', 'cedilla-application'],
      inlineWord: 'casa', inlineId: 'vocab-casa',
    },
    {
      language: 'ro', source: romanianPronunciation, badTerms: ['h'],
      lexicalIds: ['vocab-casa', 'vocab-harta'], ruleIds: ['pronounced-h', 'country-diacritic'],
      inlineWord: 'copil', inlineId: 'vocab-copil',
    },
  ])('uses the real $language inventory for picker rows and inline saves', async ({
    language, source, badTerms, lexicalIds, ruleIds, inlineWord, inlineId,
  }) => {
    const markdown = `<!-- vocab-inventory: {"mode":"explicit"} -->\n${source.replace(/<!--\s*vocab-inventory\b[\s\S]*?-->/g, '')}`;
    mocks.progress.mockResolvedValue([{ lessonId: 'spelling-rules', completed: true, quizScore: 100 }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => markdown }));
    const render = lesson(language);
    render(); await settle();
    const tree = render();
    const prose = child(tree, ReactMarkdown);
    expect(prose.props.children).not.toContain('vocab-inventory');
    const renderListItem = (prose.props.components as { li: (props: { children: string }) => ReactNode }).li;
    const inline = (sourceText: string) => elements(renderListItem({ children: sourceText }))
      .flatMap((element) => element.props.item ? [element.props.item as LessonReviewItem] : []);
    const raw = [...parseListCandidates(markdown), ...parseTableCandidates(markdown)];
    for (const word of badTerms) {
      const candidates = raw.filter((item) => item.word === word);
      expect(candidates.length).toBeGreaterThan(0);
      for (const candidate of candidates) expect(inline(candidate.sourceText)).toEqual([]);
    }
    const visibleWord = raw.find((item) => item.word === inlineWord)!;
    expect(inline(visibleWord.sourceText)).toEqual([
      expect.objectContaining({ id: inlineId, word: inlineWord, provenance: 'authored' }),
    ]);

    click(tree, 'Choose review material');
    const picker = child(render(), LessonCaptureModal);
    const items = picker.props.items as LessonReviewItem[];
    expect(picker.props.diagnostics).toEqual([]);
    const vocabulary = items.filter((item) => item.kind === 'vocabulary');
    for (const word of badTerms) expect(vocabulary.some((item) => item.word === word)).toBe(false);
    expect(vocabulary.every((item) => item.provenance === 'authored')).toBe(true);
    expect(vocabulary.map((item) => item.id)).toEqual(expect.arrayContaining(lexicalIds));
    expect(items.filter((item) => item.kind !== 'vocabulary').map((item) => item.id)).toEqual(expect.arrayContaining(ruleIds));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.xp).not.toHaveBeenCalled();
  });
});
