import type { FrozenVocabExercise, VocabMatchState } from '../../lib/vocab-lesson-state';
import { rtlProps } from '../../lib/rtl';

interface Props {
  exercise: Extract<FrozenVocabExercise, { type: 'match' }>;
  state: VocabMatchState;
  onChange: (state: VocabMatchState) => void;
  onComplete: (correct: number) => void;
  language: string;
}

export default function MatchExercise({ exercise, state, onChange, onComplete, language }: Props) {
  const { words, pairs, wordOrder, meaningOrder } = exercise;
  const { matched, selectedWord, wrongMeaning } = state;
  const finished = matched.length === pairs;

  function handleMeaningTap(index: number) {
    if (matched.includes(index) || selectedWord === null) return;
    onChange(selectedWord === index
      ? { ...state, matched: [...matched, index], selectedWord: null, wrongMeaning: null }
      : { ...state, wrongMeaning: index });
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
        Match each word with its meaning ({matched.length}/{pairs})
      </p>
      <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-slate-200/70 dark:border-white/10">
        <div className="space-y-2">
          {wordOrder.map((index) => {
            const isMatched = matched.includes(index);
            return (
              <button
                key={index}
                lang={language}
                {...rtlProps(language)}
                onClick={() => onChange({ ...state, selectedWord: index, wrongMeaning: null })}
                disabled={isMatched}
                aria-pressed={selectedWord === index}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-colors press-feedback ${
                  isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : selectedWord === index
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {isMatched && '✓ '}{words[index].word}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {meaningOrder.map((index) => {
            const isMatched = matched.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleMeaningTap(index)}
                disabled={isMatched}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm transition-colors press-feedback ${
                  isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : wrongMeaning === index
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {isMatched && '✓ '}{words[index].meaning}
              </button>
            );
          })}
        </div>
      </div>
      {wrongMeaning !== null && <p role="status" className="mt-3 text-sm text-slate-500 dark:text-slate-400">Try another meaning.</p>}
      {finished && (
        <button autoFocus onClick={() => onComplete(matched.length)} className="mt-4 w-full min-h-[44px] py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
          Continue
        </button>
      )}
    </div>
  );
}
