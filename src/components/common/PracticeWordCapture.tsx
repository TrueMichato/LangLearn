import { useEffect, useMemo, useState } from 'react';
import WordLookupSheet from '../reader/WordLookupSheet';
import { tokenizeLexicalText } from '../../lib/lexical-tokenizer';
import { normalizeLexeme } from '../../lib/lexical';
import { isRTL } from '../../lib/rtl';
import { uniqueCaptureWords, saveCapturedPracticeWord, type PracticeCaptureWord } from '../../lib/practice-word-capture';
export type { PracticeCaptureWord } from '../../lib/practice-word-capture';

export interface PracticeWordCaptureProps {
  language: string;
  text?: string;
  words?: readonly PracticeCaptureWord[];
  context?: string;
  source?: string;
  tags?: readonly string[];
  onSaved?: () => void;
}

/** Mount only alongside revealed target-language content, never on a hidden answer. */
export default function PracticeWordCapture(props: PracticeWordCaptureProps) {
  // A new prompt must close its old editor, even when React reuses the component.
  return <CaptureSession key={JSON.stringify([props.language, props.text, props.words, props.context, props.source, props.tags])} {...props} />;
}

function CaptureSession({ language, text = '', words, context, source, tags = [], onSaved }: PracticeWordCaptureProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PracticeCaptureWord | null>(null);
  const [tokens, setTokens] = useState<PracticeCaptureWord[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [approximate, setApproximate] = useState(false);
  const explicit = useMemo(() => uniqueCaptureWords(words ?? [], language), [words, language]);
  useEffect(() => {
    if (!open || words?.length || tokens) return;
    let active = true;
    void tokenizeLexicalText(text, language).then((document) => {
      if (!active) return;
      setApproximate(document.mode === 'japanese-fallback');
      setTokens(uniqueCaptureWords(document.tokens.map((token) => ({ word: token.surface, lemma: token.lemma })), language));
      setError(false);
    }, () => { if (active) setError(true); });
    return () => { active = false; };
  }, [open, words, tokens, text, language, retry]);
  const candidates = words?.length ? explicit : tokens;
  if (!text.trim() && !explicit.length) return null;
  return <div className="mt-3 text-sm" onClick={(event) => event.stopPropagation()}>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}
      className="min-h-[44px] text-indigo-600 dark:text-indigo-400">{open ? 'Hide vocabulary tools' : 'Save words from this practice'}</button>
    {open && <div className="space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">Choose a word to look up, edit, and save for review.</p>
      {approximate && <p className="text-xs text-slate-500 dark:text-slate-400">Japanese segmentation is approximate. Check and edit the word before saving.</p>}
      {error ? <button type="button" className="min-h-[44px] text-indigo-600 dark:text-indigo-400"
        onClick={() => { setError(false); setRetry((value) => value + 1); }}>Could not load words. Retry</button>
        : !candidates ? <p role="status" className="text-slate-500 dark:text-slate-400">Finding words…</p>
          : !candidates.length ? <p className="text-slate-500 dark:text-slate-400">No lexical words found.</p>
            : <div className="flex flex-wrap gap-2" dir={isRTL(language) ? 'rtl' : 'ltr'}>
              {candidates.map((candidate) => <button type="button" key={normalizeLexeme(candidate.lemma ?? candidate.word, language)}
                onClick={() => setSelected(candidate)}
                className="min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-600 px-3 text-slate-700 dark:text-slate-200">
                {candidate.word}
              </button>)}
            </div>}
    </div>}
    {selected && <WordLookupSheet key={selected.lemma ?? selected.word} word={selected.lemma ?? selected.word} language={language}
      initialReading={selected.reading} initialMeaning={selected.meaning}
      contextSentence={selected.context ?? context ?? text} onClose={() => setSelected(null)}
      onAdd={async (word, reading, meaning, contextSentence) => {
        const result = await saveCapturedPracticeWord(language, {
          word, reading, meaning, context: contextSentence, tags: selected.tags,
        }, { tags, source });
        onSaved?.();
        return result;
      }} />}
  </div>;
}
