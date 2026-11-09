import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { speak, isTTSSupported } from '../../lib/tts';
import { lookupWord } from '../../lib/dictionary';
import { isRTL } from '../../lib/rtl';
import { getForvoUrl } from '../../lib/forvo';
import type { SaveWordsResult } from '../../db/words';
import type { WordStatusMap } from '../../lib/word-status';
import { getStatusLabel, getStatusBadgeClass } from '../../lib/word-status';

interface WordLookupSheetProps {
  word: string;
  language: string;
  initialReading?: string;
  initialMeaning?: string;
  contextSentence?: string;
  onAdd: (word: string, reading: string, meaning: string, context: string) => void | Promise<void | SaveWordsResult>;
  onClose: () => void;
  wordStatusMap?: WordStatusMap;
}

/** Shared editor for Reader mining and revealed practice vocabulary. */
export default function WordLookupSheet({
  word, language, initialReading = '', initialMeaning = '', contextSentence = '', onAdd, onClose, wordStatusMap,
}: WordLookupSheetProps) {
  const [editableWord, setWord] = useState(word);
  const [reading, setReading] = useState(initialReading);
  const [meaning, setMeaning] = useState(initialMeaning);
  const [context, setContext] = useState(contextSentence);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'exists' | 'error'>('idle');
  const generation = useRef(0);
  const saving = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const id = useId();
  const invalidateLookup = useCallback(() => { generation.current++; }, []);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => { invalidateLookup(); previous?.focus(); };
  }, [invalidateLookup]);

  async function handleLookup() {
    const request = ++generation.current;
    setLookupLoading(true);
    setLookupError('');
    try {
      const result = await lookupWord(editableWord.trim(), language);
      if (request !== generation.current) return;
      if (!result?.meanings.length) throw new Error('No definition');
      setReading(result.reading);
      setMeaning(result.meanings.join('; '));
    } catch {
      if (request === generation.current) setLookupError('Lookup unavailable. Enter a meaning yourself or retry lookup when online.');
    } finally {
      if (request === generation.current) setLookupLoading(false);
    }
  }
  function edit() {
    generation.current++;
    setLookupLoading(false);
    setSaveState('idle');
  }
  async function save() {
    if (saving.current || !editableWord.trim() || !meaning.trim()) return;
    saving.current = true;
    generation.current++;
    setLookupLoading(false);
    setSaveState('saving');
    try {
      const result = await onAdd(editableWord.trim(), reading.trim(), meaning.trim(), context);
      setSaveState(result && result.added === 0 ? 'exists' : 'saved');
    } catch {
      setSaveState('error');
    } finally {
      saving.current = false;
    }
  }
  const busy = saveState === 'saving';
  const inputClass = 'w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100';
  return <div className="fixed inset-0 z-[60] bg-slate-950/40" onClick={(event) => {
    if (event.target === event.currentTarget && !busy) onClose();
  }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-heading`}
      className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Escape' && !busy) closeRef.current();
        if (event.key === 'Tab') {
          const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <div className="max-w-lg mx-auto space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id={`${id}-heading`} className="font-semibold text-slate-800 dark:text-slate-100">Save a word</h2>
          {wordStatusMap && <span className={`rounded-full px-2 py-1 text-xs ${getStatusBadgeClass(wordStatusMap.getStatus(editableWord))}`}>
            {getStatusLabel(wordStatusMap.getStatus(editableWord))}
          </span>}
          <button type="button" disabled={busy} onClick={onClose} aria-label="Close word editor"
            className="min-h-[44px] min-w-[44px] text-slate-500 dark:text-slate-400">✕</button>
        </div>
        <label className="block text-sm text-slate-700 dark:text-slate-200">Word
          <input className={inputClass} dir={isRTL(language) ? 'rtl' : 'ltr'} value={editableWord} disabled={busy}
            onChange={(event) => { edit(); setWord(event.target.value); }} />
        </label>
        <div className="flex gap-2">
          {isTTSSupported() && <button type="button" aria-label="Listen to word" onClick={() => speak(editableWord, language)}
            className="min-h-[44px] min-w-[44px] text-slate-700 dark:text-slate-200">🔊</button>}
          <button type="button" onClick={handleLookup} disabled={busy || lookupLoading || !editableWord.trim()}
            className="min-h-[44px] text-indigo-600 dark:text-indigo-400 disabled:opacity-50">{lookupLoading ? 'Looking up…' : lookupError ? 'Retry lookup' : 'Look up meaning'}</button>
          {getForvoUrl(editableWord, language) && <a href={getForvoUrl(editableWord, language)!}
            target="_blank" rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center text-indigo-600 dark:text-indigo-400"
            title="Hear native pronunciation on Forvo">Forvo ↗</a>}
        </div>
        {lookupError && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">{lookupError}</p>}
        <label className="block text-sm text-slate-700 dark:text-slate-200">Reading / pronunciation
          <input className={inputClass} dir={isRTL(language) ? 'rtl' : 'ltr'} value={reading} disabled={busy}
            onChange={(event) => { edit(); setReading(event.target.value); }} />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-200">Meaning / translation
          <input className={inputClass} value={meaning} disabled={busy}
            onChange={(event) => { edit(); setMeaning(event.target.value); }} />
        </label>
        <label className="block text-sm text-slate-700 dark:text-slate-200">Context sentence
          <input className={inputClass} dir={isRTL(language) ? 'rtl' : 'ltr'} value={context} disabled={busy}
            onChange={(event) => { edit(); setContext(event.target.value); }} />
        </label>
        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
          {saveState === 'saved' ? 'Saved to your vocabulary and ready for review.'
            : saveState === 'exists' ? 'Already saved in your vocabulary. No duplicate was added.'
              : saveState === 'error' ? 'Could not save this word. Your edits are still here; try again.'
                : 'You can edit these fields and save offline. Saving does not mark a word as familiar.'}
        </p>
        <button type="button" onClick={save} disabled={busy || !editableWord.trim() || !meaning.trim() || saveState === 'saved' || saveState === 'exists'}
          className="w-full min-h-[44px] rounded-xl bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Saving…' : saveState === 'error' ? 'Retry save' : saveState === 'saved' || saveState === 'exists' ? 'Saved' : 'Save to vocabulary'}
        </button>
      </div>
    </div>
  </div>;
}
