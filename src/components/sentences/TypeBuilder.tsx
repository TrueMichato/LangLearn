import { useState, useRef, useEffect } from 'react';
import type { PracticeSentence } from '../../data/sentences/ja-sentences';
import { speak } from '../../lib/tts';
import { rtlProps } from '../../lib/rtl';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sentence.id]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (checked || !input.trim()) return;
    const correct = normalize(input, language) === normalize(sentence.target, language);
    setIsCorrect(correct);
    setChecked(true);
    if (correct) speak(sentence.target, language);
  };

  const handleNext = () => onResult(isCorrect);

  const hintText = sentence.hint ?? sentence.target.charAt(0) + '…';

  const borderClass = checked ? (isCorrect ? 'border-green-500' : 'border-red-500') : 'border-slate-300 dark:border-slate-600';
  const bgClass = checked ? (isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50') : 'bg-white dark:bg-slate-700';

  return (
    <div className="space-y-5">
      {/* English prompt */}
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">{sentence.english}</p>

      {/* Hint */}
      {!checked && (
        <div className="text-center">
          {showHint ? (
            <p className="text-sm text-indigo-600 dark:text-indigo-400">{hintText}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-sm text-slate-400 dark:text-slate-500 underline hover:text-slate-600 dark:hover:text-slate-300">
              Show hint
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={checked}
          placeholder="Type the sentence…"
          className={`w-full rounded-xl px-4 py-3 border-2 ${borderClass} ${bgClass} text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-70`}
          {...rtlProps(language)}
        />
      </form>

      {/* Feedback */}
      {checked && (
        <div className={`text-center font-semibold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isCorrect ? '✓ Correct!' : <>✗ Correct answer: <span {...rtlProps(language)} className="inline-block">{sentence.target}</span></>}
          <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-1">{sentence.reading}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!checked ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        ) : (
          <button onClick={handleNext} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
