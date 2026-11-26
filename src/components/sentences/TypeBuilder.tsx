import { useState, useRef, useEffect } from 'react';
import type { PracticeSentence } from '../../data/sentences/ja-sentences';
import { speak } from '../../lib/tts';
import { rtlProps } from '../../lib/rtl';
import PracticeWordCapture from '../common/PracticeWordCapture';
import SentenceComparison from './SentenceComparison';

interface TypeBuilderProps {
  sentence: PracticeSentence;
  language: string;
  onResult: (correct: boolean) => void;
}

function normalize(s: string, lang: string): string {
  let t = s.trim().replace(/\s+/g, ' ');
  // Case-insensitive for non-Japanese
  if (lang !== 'ja') t = t.toLowerCase();
  // Normalize punctuation
  t = t.replace(/[?？]/g, '').replace(/[!！]/g, '');
  return t;
}

export default function TypeBuilder({ sentence, language, onResult }: TypeBuilderProps) {
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const firstCorrect = useRef<boolean | null>(null);
  const resultSent = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comparisonButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checked) comparisonButtonRef.current?.focus();
    else inputRef.current?.focus();
  }, [sentence.id, checked]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (checked || resultSent.current || !input.trim()) return;
    const correct = normalize(input, language) === normalize(sentence.target, language);
    firstCorrect.current ??= correct;
    setIsCorrect(correct);
    setChecked(true);
    if (correct) speak(sentence.target, language);
  };

  const handleNext = () => {
    if (!checked || firstCorrect.current === null || resultSent.current) return;
    resultSent.current = true;
    onResult(firstCorrect.current);
  };

  const handleRetry = () => {
    if (!checked || resultSent.current) return;
    setInput('');
    setChecked(false);
    setShowComparison(false);
    setIsRetry(true);
  };

  const hintText = sentence.hint ?? sentence.target.charAt(0) + '…';

  const borderClass = checked ? (isCorrect ? 'border-green-300 dark:border-green-800' : 'border-amber-300 dark:border-amber-800') : 'border-slate-300 dark:border-slate-600';
  const bgClass = checked ? (isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-amber-50 dark:bg-amber-950/30') : 'bg-white dark:bg-slate-800';

  return (
    <div className="space-y-5">
      {/* English prompt */}
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">{sentence.english}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Match the practice target. For other valid ways to say this, use self-graded Translation Practice.</p>
      {sentence.context && <p className="text-sm text-slate-700 dark:text-slate-200">{sentence.context}</p>}
      {isRetry && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Retry practice — your first check still counts. No extra completion XP or review progress.</p>}

      {/* Hint */}
      {!checked && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-indigo-600 dark:text-indigo-400">{hintText}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="min-h-[44px] text-sm text-slate-500 dark:text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-300">
              Show hint
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <label htmlFor="sentence-answer" className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Your sentence</label>
        <input
          id="sentence-answer"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={checked}
          placeholder="Type the sentence…"
          className={`w-full min-h-[44px] rounded-xl px-4 py-3 border ${borderClass} ${bgClass} text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-70`}
          {...rtlProps(language)}
        />
      </form>

      {/* Feedback */}
      {checked && (
        <>
          <div role="status" className={`text-center font-semibold ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-200'}`}>
            {isCorrect ? '✓ Matches the practice target.' : 'Not a match yet — compare with the practice target.'}
            {!showComparison && <>
              <p {...rtlProps(language)} className="mt-1 text-slate-800 dark:text-slate-100">{sentence.target}</p>
              <p dir="ltr" className="text-sm font-normal text-slate-500 dark:text-slate-400">{sentence.reading}</p>
            </>}
          </div>
          <button ref={comparisonButtonRef} onClick={() => setShowComparison((value) => !value)} aria-expanded={showComparison}
            className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            {showComparison ? 'Hide comparison' : 'Compare answers'}
          </button>
          {showComparison && <SentenceComparison sentence={sentence} language={language} answer={input.trim()} mode="constrained" />}
        </>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        {!checked ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className="min-h-[44px] px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        ) : (
          <>
            <button onClick={handleNext} className="min-h-[44px] px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Next →
            </button>
            <button onClick={handleRetry} className="min-h-[44px] px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Retry this sentence
            </button>
          </>
        )}
      </div>
      {checked && <PracticeWordCapture language={language} text={sentence.target} context={sentence.target} source="sentence" />}
    </div>
  );
}
