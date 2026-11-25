import { useEffect, useId, useRef, useState } from 'react';
import type { Word } from '../../db/schema';
import { reviewedGrammarLessonId } from '../../lib/grammar-review-scope';
import { sourceWordingUnchanged } from '../../lib/card-identity';
import { humanizeLessonId, lessonIdFromTags } from '../../lib/lesson-capture';
import GrammarFace from '../grammar/GrammarFace';

interface GrammarCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  writing: boolean;
  onWritingChange: (writing: boolean) => void;
}

// Offer syllable choices only for a stress-placement task. Never supply a new
// vocabulary/inflection answer: construct options from a word already on the front.
function stressChoices(word: Word, reviewed: string | undefined) {
  if (word.language !== 'ru' || reviewed !== 'stress' || !/^[а-яё]+\u0301[а-яё]*$/iu.test(word.word) || !/stress|syllable/i.test(word.contextSentence)) return [];
  const unmarked = word.word.replace('\u0301', '').toLowerCase();
  const visible = word.contextSentence.match(/(?:[а-яё]\u0301?)+/giu)
    ?.find((token) => token.toLowerCase() === unmarked);
  if (!visible) return [];
  return Array.from(visible.matchAll(/[аеёиоуыэюя]/giu), ({ 0: vowel, index }) => ({
    vowel, marked: visible.slice(0, index + 1) + '\u0301' + visible.slice(index + 1),
  }));
}

export default function GrammarCard({ word, isFlipped, onFlip, writing, onWritingChange }: GrammarCardProps) {
  // Review keys the card by session and queue position, including requeued misses.
  const [attempt, setAttempt] = useState('');
  const id = useId();
  const focus = useRef<HTMLParagraphElement>(null);
  useEffect(() => { focus.current?.focus(); }, [isFlipped]);
  const reviewed = reviewedGrammarLessonId(word);
  const lessonId = word.lessonSource?.lessonId ?? lessonIdFromTags(word.tags) ?? reviewed;
  const write = !!reviewed && writing;
  const choices = stressChoices(word, reviewed);
  const card = {
    prompt: word.contextSentence ?? '', hint: word.reading ?? '', answer: word.word ?? '',
    explanation: word.meaning ?? '', rule: word.grammarRule ?? '', format: word.grammarFormat,
    provenance: word.lessonSource?.provenance,
    learnerEdited: !!word.reading && !sourceWordingUnchanged(word),
  };

  return <div className="w-full space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-800">
    <GrammarFace card={card} language={word.language} lessonId={lessonId} side={isFlipped ? 'back' : 'front'} focusRef={focus}
      comparison={write && attempt.trim() && <div className="space-y-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Your attempt</p>
        <p dir="auto" className="whitespace-pre-wrap break-words text-[length:var(--app-font-size)] text-slate-800 dark:text-slate-100">{attempt}</p>
      </div>} />
    {isFlipped ? <>
      {reviewed && <p className="text-sm text-slate-600 dark:text-slate-300">
        {choices.length ? 'Grade where you placed the stress.' : 'Grade what the question asks, not an exact match.'}
      </p>}
      {lessonId && <p className="text-xs text-slate-500 dark:text-slate-400">From {humanizeLessonId(lessonId)}</p>}
    </> : <>
      {reviewed && <fieldset>
        <legend className="text-sm text-slate-500 dark:text-slate-400">How will you answer?</legend>
        <div className="flex flex-wrap gap-x-5">
          {([['Say or think', false], ['Type an answer', true]] as const).map(([label, value]) => (
            <label key={label} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input type="radio" name={`${id}-mode`} checked={write === value} className="accent-indigo-600"
                onChange={() => { setAttempt(''); onWritingChange(value); }} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>}
      {write && <div className="space-y-2">
        <label htmlFor={`${id}-attempt`} className="block text-sm font-medium text-slate-700 dark:text-slate-200">Your attempt (optional)</label>
        <textarea id={`${id}-attempt`} rows={2} dir="auto" value={attempt} onChange={(e) => setAttempt(e.target.value)}
          autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
          className="block min-h-[44px] w-full rounded-xl border border-slate-300 bg-white p-2 text-[length:var(--app-font-size)] text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
        {choices.length > 1 && <fieldset>
          <legend className="text-sm text-slate-600 dark:text-slate-300">Or choose the stressed syllable:</legend>
          <div className="mt-1 flex flex-wrap gap-2">{choices.map(({ vowel, marked }, index) => (
            <button key={index} type="button" aria-label={`Stress syllable ${index + 1} (${vowel})`} aria-pressed={marked === attempt}
              onClick={() => setAttempt(marked)}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-300 px-3 text-slate-700 hover:bg-slate-50 aria-pressed:border-indigo-600 aria-pressed:text-indigo-700 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 dark:aria-pressed:border-indigo-400 dark:aria-pressed:text-indigo-300">
              {index + 1} · {vowel}
            </button>
          ))}</div>
        </fieldset>}
      </div>}
      <button type="button" onClick={onFlip}
        className="min-h-[44px] w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
        Reveal answer
      </button>
    </>}
  </div>;
}
