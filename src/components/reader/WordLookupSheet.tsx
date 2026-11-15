import { useEffect, useId, useReducer, useRef, useState } from 'react';
import { speak, isTTSSupported } from '../../lib/tts';
import { lookupWord } from '../../lib/dictionary';
import { isRTL } from '../../lib/rtl';
import { getForvoUrl } from '../../lib/forvo';
import type { SaveWordsResult } from '../../db/words';
import type { WordStatusMap } from '../../lib/word-status';
import { getStatusLabel, getStatusBadgeClass } from '../../lib/word-status';
import { useModalFocus } from '../../hooks/useModalFocus';
import { createWordLookupState, findLocalWordDetails, wordLookupReducer, type WordLookupDraft } from '../../lib/word-lookup';

interface WordLookupSheetProps {
  word: string;
  language: string;
  lemma?: string;
  initialReading?: string;
  initialMeaning?: string;
  contextSentence?: string;
  initialDraft?: WordLookupDraft;
  onDraftChange?: (draft: WordLookupDraft) => void;
  onAdd: (word: string, reading: string, meaning: string, context: string) => void | Promise<void | SaveWordsResult>;
  onClose: () => void;
  wordStatusMap?: WordStatusMap;
}

/** A new selection owns its draft and pending responses, even without a caller key. */
export default function WordLookupSheet(props: WordLookupSheetProps) {
  return <WordLookupSession key={JSON.stringify([props.language, props.word, props.lemma])} {...props} />;
}

function WordLookupSession({
  word, language, lemma, initialReading = '', initialMeaning = '', contextSentence = '',
  initialDraft, onDraftChange, onAdd, onClose, wordStatusMap,
}: WordLookupSheetProps) {
  const [startingDraft] = useState(() => initialDraft ?? {
    word, reading: initialReading, meaning: initialMeaning, context: contextSentence,
  });
  const [state, dispatch] = useReducer(wordLookupReducer, startingDraft, createWordLookupState);
  const [editing, setEditing] = useState(false);
  const [localRetry, setLocalRetry] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'exists' | 'error'>('idle');
  const request = useRef(0);
  const saving = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wordRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const busy = saveState === 'saving';
  useModalFocus({
    isOpen: true, dialogRef, initialFocusRef: editing ? wordRef : headingRef,
    onEscape: busy ? undefined : onClose, layer: 60, focusKey: editing ? 'editor' : 'details',
  });

  useEffect(() => {
    if (startingDraft.meaning) return;
    let active = true;
    void findLocalWordDetails(startingDraft.word, language, startingDraft.word === word ? lemma : undefined).then((details) => {
      if (active) dispatch({ type: 'local', revision: 0, details });
    }, () => { if (active) dispatch({ type: 'local-error' }); });
    return () => { active = false; };
  }, [word, language, lemma, startingDraft, localRetry]);

  useEffect(() => {
    onDraftChange?.({ word: state.word, reading: state.reading, meaning: state.meaning, context: state.context });
  }, [onDraftChange, state.word, state.reading, state.meaning, state.context]);

  async function handleLookup() {
    const current = ++request.current;
    const revision = state.revision;
    dispatch({ type: 'lookup', request: current });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      dispatch({ type: 'error', request: current, revision,
        message: 'You appear to be offline. Your edits are still here; enter a meaning or retry when online.' });
      return;
    }
    try {
      const result = await lookupWord(state.word.trim(), language);
      if (!result && typeof navigator !== 'undefined' && navigator.onLine === false) {
        dispatch({ type: 'error', request: current, revision,
          message: 'You appear to be offline. Your edits are still here; enter a meaning or retry when online.' });
      } else {
        dispatch({ type: 'result', request: current, revision, result });
      }
    } catch {
      dispatch({ type: 'error', request: current, revision,
        message: 'Online lookup is unavailable. Your edits are still here; enter a meaning or retry.' });
    }
  }

  function edit(field: 'word' | 'reading' | 'meaning' | 'context', value: string) {
    onDraftChange?.({ word: state.word, reading: state.reading, meaning: state.meaning,
      context: state.context, [field]: value });
    dispatch({ type: 'edit', field, value });
    setSaveState('idle');
  }

  async function save() {
    if (saving.current || !state.word.trim() || !state.meaning.trim()) return;
    saving.current = true;
    dispatch({ type: 'cancel' });
    setSaveState('saving');
    try {
      const result = await onAdd(state.word.trim(), state.reading.trim(), state.meaning.trim(), state.context);
      setSaveState(result && result.added === 0 ? 'exists' : 'saved');
    } catch {
      setSaveState('error');
    } finally {
      saving.current = false;
    }
  }

  const targetDir = isRTL(language) ? 'rtl' : 'ltr';
  const forvoUrl = getForvoUrl(state.word, language);
  const inputClass = 'w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-meaning`} tabIndex={-1}
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      onKeyDown={(event) => event.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true"
        onClick={() => { if (!busy) onClose(); }} />
      <div className="relative w-full max-w-[34rem] max-h-[85dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 ref={headingRef} id={`${id}-heading`} tabIndex={-1}
              className="min-w-0 break-words text-xl font-semibold text-slate-800 dark:text-slate-100">
              <span className="sr-only">Word details: </span><span dir={targetDir} lang={language}>{state.word}</span>
            </h2>
            {wordStatusMap && <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(wordStatusMap.getStatus(state.word))}`}>
              {getStatusLabel(wordStatusMap.getStatus(state.word))}
            </span>}
            <button type="button" disabled={busy} onClick={onClose} aria-label="Close word editor"
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
          </div>
          {state.reading && <p dir={targetDir} lang={language} className="text-sm text-slate-500 dark:text-slate-400">{state.reading}</p>}
          <p id={`${id}-meaning`} role="status" className="text-slate-800 dark:text-slate-100">
            {state.meaning || (state.localStatus === 'loading'
              ? 'Finding a saved or bundled meaning…'
              : state.localStatus === 'error'
                ? 'Saved meanings could not be loaded. You can still enter a meaning yourself.'
                : 'No local meaning found. Look up online or enter a meaning yourself.')}
          </p>
          {state.source && <p className="text-xs text-slate-500 dark:text-slate-400">
            {state.source === 'saved' ? 'From your vocabulary' : state.source === 'bundled' ? 'From bundled vocabulary' : 'From online lookup'}
          </p>}
          {state.localStatus === 'error' && <button type="button" disabled={busy}
            className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400"
            onClick={() => {
              dispatch({ type: 'local-loading' });
              setLocalRetry((value) => value + 1);
            }}>Retry saved meanings</button>}
          <div className="flex flex-wrap items-center gap-3">
            {isTTSSupported() && <button type="button" aria-label="Listen to word" onClick={() => speak(state.word, language)}
              className="min-h-[44px] min-w-[44px] rounded-xl text-slate-700 dark:text-slate-200">🔊</button>}
            <button type="button" onClick={handleLookup} disabled={busy || state.loading || !state.word.trim()}
              className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-50">
              {state.loading ? 'Looking up online…' : state.error ? 'Retry online lookup' : 'Look up online'}
            </button>
            {forvoUrl && <a href={forvoUrl} target="_blank" rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400"
              title="Hear native pronunciation on Forvo">Forvo ↗</a>}
          </div>
          {state.error && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">{state.error}</p>}
          <button type="button" disabled={busy} aria-expanded={editing} aria-controls={editing ? `${id}-editor` : undefined}
            onClick={() => setEditing((value) => !value)}
            className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            {editing ? 'Hide editor' : 'Edit and save to vocabulary'}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Nothing is saved automatically. You can edit and save offline.
          </p>
          {editing && <div id={`${id}-editor`} className="space-y-3 border-t border-slate-200/70 pt-3 dark:border-white/10">
            <label htmlFor={`${id}-word`} className="block text-sm text-slate-700 dark:text-slate-200">Word
              <input ref={wordRef} id={`${id}-word`} name="word" className={inputClass} dir={targetDir}
                value={state.word} disabled={busy} onChange={(event) => edit('word', event.target.value)} />
            </label>
            <label htmlFor={`${id}-reading`} className="block text-sm text-slate-700 dark:text-slate-200">Reading / pronunciation
              <input id={`${id}-reading`} name="reading" className={inputClass} dir={targetDir} value={state.reading}
                disabled={busy} onChange={(event) => edit('reading', event.target.value)} />
            </label>
            <label htmlFor={`${id}-translation`} className="block text-sm text-slate-700 dark:text-slate-200">Meaning / translation
              <input id={`${id}-translation`} name="meaning" className={inputClass} value={state.meaning}
                disabled={busy} onChange={(event) => edit('meaning', event.target.value)} />
            </label>
            <label htmlFor={`${id}-context`} className="block text-sm text-slate-700 dark:text-slate-200">Context sentence
              <input id={`${id}-context`} name="context" className={inputClass} dir={targetDir} value={state.context}
                disabled={busy} onChange={(event) => edit('context', event.target.value)} />
            </label>
            <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
              {saveState === 'saved' ? 'Saved to your vocabulary and ready for review.'
                : saveState === 'exists' ? 'Already saved in your vocabulary. No duplicate was added.'
                  : saveState === 'error' ? 'Could not save this word. Your edits are still here; try again.'
                    : 'Saving does not mark a word as familiar.'}
            </p>
            <button type="button" onClick={save} disabled={busy || !state.word.trim() || !state.meaning.trim() || saveState === 'saved' || saveState === 'exists'}
              className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">
              {busy ? 'Saving…' : saveState === 'error' ? 'Retry save' : saveState === 'saved' || saveState === 'exists' ? 'Saved' : 'Save to vocabulary'}
            </button>
          </div>}
        </div>
      </div>
    </div>
  );
}
