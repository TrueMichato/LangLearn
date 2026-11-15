import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { findSavedLessonItems, saveLessonReviewItems } from '../../db/lesson-cards';
import type { GrammarReviewItem, LessonReviewDiagnostic, LessonReviewItem, VocabularyReviewItem } from '../../lib/lesson-review';
import { looksLikeSentence } from '../../lib/lesson-capture';
import { getLanguageLabel } from '../../lib/languages';
import { rtlProps } from '../../lib/rtl';
import { useXPStore } from '../../stores/xpStore';
import WordLookupSheet from '../reader/WordLookupSheet';
import LessonReviewEditor, { LessonReviewPreview } from './LessonReviewEditor';

interface LessonCaptureModalProps {
  items: LessonReviewItem[];
  diagnostics?: LessonReviewDiagnostic[];
  language: string;
  lessonId: string;
  initialMode?: 'choose' | 'personal';
  onClose: () => void;
  onSaved: (count: number) => void;
}

function customId() {
  return `custom:${crypto.randomUUID()}`;
}

export default function LessonCaptureModal({
  items, diagnostics = [], language, lessonId, initialMode = 'choose', onClose, onSaved,
}: LessonCaptureModalProps) {
  const [draftItems, setDraftItems] = useState(items);
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retryCheck, setRetryCheck] = useState(0);
  const [result, setResult] = useState<{ added: number; alreadySaved: number } | null>(null);
  const [mode, setMode] = useState<'choose' | 'personal' | 'edit'>(initialMode);
  const [editorItem, setEditorItem] = useState<GrammarReviewItem | null>(null);
  const [wordEditor, setWordEditor] = useState<VocabularyReviewItem | null>(null);
  const initialized = useRef(false);
  const saveLock = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    let active = true;
    void findSavedLessonItems(items, language, lessonId).then((saved) => {
      if (!active) return;
      setSavedIds(saved);
      setCheckError(false);
      if (!initialized.current) {
        initialized.current = true;
        setSelected(new Set(items.filter((item) => item.priority === 'essential' && !saved.has(item.id)).map((item) => item.id)));
      }
    }, () => { if (active) setCheckError(true); });
    return () => { active = false; };
  }, [items, language, lessonId, retryCheck]);

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    return () => { opener.current?.focus(); };
  }, []);

  useEffect(() => {
    if (!wordEditor) panel.current?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), select, textarea')?.focus();
  }, [mode, wordEditor]);

  function rememberItem(item: LessonReviewItem) {
    setDraftItems((previous) => previous.some((entry) => entry.id === item.id)
      ? previous.map((entry) => entry.id === item.id ? item : entry)
      : [...previous, item]);
  }

  async function persist(chosen: LessonReviewItem[]) {
    const outcome = await saveLessonReviewItems(chosen, language, lessonId);
    if (outcome.grammarAdded > 0) useXPStore.getState().addXP(outcome.grammarAdded * 5);
    const ids = new Set(chosen.map((item) => item.id));
    setSavedIds((previous) => new Set([...(previous ?? []), ...ids]));
    setSelected((previous) => new Set([...previous].filter((itemId) => !ids.has(itemId))));
    setResult(outcome);
    setSaveError(false);
    onSaved(outcome.added);
    // A word saved through the editor can also satisfy an authored lexical row.
    void findSavedLessonItems(draftItems, language, lessonId).then((saved) => {
      setSavedIds((previous) => new Set([...(previous ?? []), ...saved]));
      setSelected((previous) => new Set([...previous].filter((itemId) => !saved.has(itemId))));
    }).catch(() => { /* The successful transaction's counts remain authoritative. */ });
    return outcome;
  }

  const available = draftItems.filter((item) => !savedIds?.has(item.id));
  const chosen = available.filter((item) => selected.has(item.id));
  const allSelected = available.length > 0 && chosen.length === available.length;

  async function saveSelected() {
    if (saveLock.current || chosen.length === 0 || !savedIds) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await persist(chosen);
    } catch {
      setSaveError(true);
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  function newWord() {
    setWordEditor({
      id: customId(), kind: 'vocabulary', source: 'vocab-card', provenance: 'custom',
      priority: 'optional', sourceSection: lessonId, word: '', reading: '', meaning: '',
      contextSentence: '', isSentence: false, sourceText: '', learnerEdited: true,
    });
  }

  function newRule() {
    setEditorItem({
      id: customId(), kind: 'rule', source: 'grammar-card', provenance: 'custom',
      priority: 'optional', sourceSection: lessonId, format: 'qa', rule: '', hint: '',
      prompt: '', answer: '', explanation: '', legacyAliases: [], learnerEdited: true,
    });
    setMode('edit');
  }

  // Replace, rather than stack, dialogs. The picker's selection stays mounted in state.
  if (wordEditor) {
    return <WordLookupSheet key={wordEditor.id} word={wordEditor.word} language={language}
      initialReading={wordEditor.reading} initialMeaning={wordEditor.meaning} contextSentence={wordEditor.contextSentence}
      onClose={() => { setWordEditor(null); setMode('choose'); }}
      onAdd={async (word, reading, meaning, contextSentence) => {
        const edited: VocabularyReviewItem = {
          ...wordEditor, word, reading, meaning, contextSentence, isSentence: looksLikeSentence(word), learnerEdited: true,
        };
        const outcome = await persist([edited]);
        rememberItem(edited);
        return { ...outcome, outcomes: {} };
      }} />;
  }

  const close = () => { if (!saving) onClose(); };
  const heading = mode === 'edit' ? 'Make a review item' : mode === 'personal' ? 'Save something else' : 'Choose material for review';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4"
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        className="flex max-h-[90dvh] w-full max-w-[34rem] flex-col rounded-t-2xl border border-slate-200/70 bg-white shadow-xl dark:border-white/10 dark:bg-slate-800 sm:rounded-2xl"
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape') { event.preventDefault(); close(); }
          if (event.key === 'Tab') {
            const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary');
            if (!controls?.length) return;
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 p-4 dark:border-white/10">
          <div>
            <h2 id={`${id}-title`} className="font-semibold text-slate-800 dark:text-slate-100">{heading}</h2>
            <p id={`${id}-description`} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {getLanguageLabel(language)} · Nothing is added unless you choose Save.
            </p>
          </div>
          <button type="button" onClick={close} disabled={saving} aria-label="Close review material"
            className="-mr-2 -mt-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'edit' && editorItem ? (
            <LessonReviewEditor key={editorItem.id} item={editorItem} language={language}
              onCancel={() => { setMode('choose'); setEditorItem(null); }}
              onCommit={(item) => {
                rememberItem(item);
                setSelected((previous) => new Set([...previous, item.id]));
                setEditorItem(null);
                setMode('choose');
                setResult(null);
              }} />
          ) : mode === 'personal' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose what you want to remember. Both editors work offline; dictionary lookup is optional.</p>
              <button type="button" onClick={newWord}
                className="min-h-[44px] w-full rounded-xl bg-indigo-600 px-4 py-3 text-left font-medium text-white hover:bg-indigo-700">
                Word or phrase
              </button>
              <button type="button" onClick={newRule}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                Rule or concept
              </button>
              <button type="button" onClick={() => setMode('choose')}
                className="min-h-[44px] text-indigo-600 dark:text-indigo-400">Back to lesson material</button>
            </div>
          ) : (
            <div className="space-y-4">
              {diagnostics.length > 0 && (
                <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Some lesson review material could not be read ({diagnostics.length} metadata {diagnostics.length === 1 ? 'issue' : 'issues'}). Available items are shown below; you can also make your own.
                </p>
              )}
              {checkError ? (
                <div role="alert" className="text-sm text-slate-600 dark:text-slate-300">
                  <p>Could not check your saved cards. Your choices are still here.</p>
                  <button type="button" onClick={() => { setCheckError(false); setRetryCheck((previous) => previous + 1); }}
                    className="min-h-[44px] text-indigo-600 dark:text-indigo-400">Retry checking saved cards</button>
                </div>
              ) : savedIds === null ? (
                <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Checking your saved cards…</p>
              ) : available.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {draftItems.length > 0 ? 'All available lesson material is already saved. You can still save something else.'
                    : diagnostics.length > 0 ? 'No readable review items are available. You can make your own below.'
                      : 'No suggested items here yet. Save a word, phrase, rule, or concept of your own.'}
                </p>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Unsaved essential items start selected. Other examples are optional.</p>
                  <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={allSelected} disabled={saving}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(available.map((item) => item.id)))} />
                    {allSelected ? 'Deselect all' : 'Select all available items'}
                  </label>
                </div>
              )}
              {(['vocabulary', 'grammar'] as const).map((group) => {
                const members = draftItems.filter((item) => group === 'vocabulary' ? item.kind === 'vocabulary' : item.kind !== 'vocabulary');
                if (!members.length) return null;
                return <section key={group} aria-labelledby={`${id}-${group}`}>
                  <h3 id={`${id}-${group}`} className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
                    {group === 'vocabulary' ? 'Words and phrases' : 'Rules and concepts'}
                  </h3>
                  <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
                    {members.map((item) => {
                      const saved = savedIds?.has(item.id) ?? false;
                      return <li key={item.id} className="py-3">
                        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
                          <input type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-indigo-600"
                            checked={saved || selected.has(item.id)} disabled={saved || savedIds === null || saving || checkError}
                            aria-label={`Save ${item.kind === 'vocabulary' ? item.word : item.prompt}`}
                            onChange={() => setSelected((previous) => {
                              const next = new Set(previous);
                              if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                              return next;
                            })} />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words font-medium text-slate-800 dark:text-slate-100"
                              {...(item.kind === 'vocabulary' ? rtlProps(language) : { dir: 'auto' })}>
                              {item.kind === 'vocabulary' ? item.word : item.prompt}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              {saved ? 'Already saved' : item.learnerEdited ? 'Your wording'
                                : item.priority === 'essential' ? 'Essential' : 'Optional'}
                              {' · '}{item.kind === 'vocabulary' ? 'Word or phrase' : item.kind === 'concept' ? 'Concept' : 'Rule application'}
                              {item.sourceSection && item.sourceSection !== lessonId && <> · {item.sourceSection}</>}
                            </span>
                          </span>
                        </label>
                        <details className="ml-7 mt-1">
                          <summary className="flex min-h-[44px] cursor-pointer items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">Preview front and back</summary>
                          <LessonReviewPreview item={item} language={language} />
                        </details>
                        {!saved && <button type="button" disabled={saving || savedIds === null || checkError}
                          onClick={() => {
                            if (item.kind === 'vocabulary') setWordEditor(item);
                            else { setEditorItem(item); setMode('edit'); }
                          }}
                          className="ml-7 min-h-[44px] text-sm text-indigo-600 disabled:opacity-50 dark:text-indigo-400">
                          Edit {item.kind === 'vocabulary' ? 'word or phrase' : 'review item'}
                        </button>}
                      </li>;
                    })}
                  </ul>
                </section>;
              })}
              <button type="button" onClick={() => setMode('personal')} disabled={saving}
                className="min-h-[44px] text-sm font-medium text-indigo-600 disabled:opacity-50 dark:text-indigo-400">
                Save something else
              </button>
            </div>
          )}
        </div>

        {mode === 'choose' && <div className="space-y-2 border-t border-slate-200/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10">
          {result && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
            Added {result.added} {result.added === 1 ? 'item' : 'items'}; {result.alreadySaved} already saved.{' '}
            <Link to="/review" onClick={onClose} className="inline-flex min-h-[44px] items-center font-medium text-indigo-600 dark:text-indigo-400">Go to Review</Link>
          </p>}
          {saveError && <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">Could not save your selection. Your edits and choices are still here; try again.</p>}
          <button type="button" onClick={saveSelected} disabled={saving || savedIds === null || checkError || chosen.length === 0}
            className="min-h-[44px] w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving…' : `${saveError ? 'Retry: save' : 'Save'} ${chosen.length} ${chosen.length === 1 ? 'item' : 'items'} for review`}
          </button>
          <button type="button" onClick={close} disabled={saving}
            className="min-h-[44px] w-full rounded-xl text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
            {result ? 'Done' : 'Not now'}
          </button>
        </div>}
      </div>
    </div>
  );
}
