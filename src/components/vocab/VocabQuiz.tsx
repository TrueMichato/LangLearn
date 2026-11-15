import type { MCItem } from '../../types/vocab';
import { nextVocabItem, submitVocabItem, type VocabItemState } from '../../lib/vocab-lesson-state';

interface Props {
  items: MCItem[];
  onComplete: (correct: number) => void;
  state: VocabItemState;
  onChange: (state: VocabItemState) => void;
}

export default function VocabQuiz({ items, onComplete, state, onChange }: Props) {
  const { index: current, selected } = state;
  const item = items[current];

  function handleSelect(idx: number) {
    if (selected !== null) return;
    onChange(submitVocabItem(state, idx === item.answer, idx));
  }

  function handleNext() {
    if (current + 1 >= items.length) onComplete(state.answers.filter(Boolean).length);
    else onChange(nextVocabItem(state));
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
        Quiz ({current + 1}/{items.length})
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 mb-4 border border-slate-200/70 dark:border-white/10">
        <p className="text-lg font-medium text-slate-800 dark:text-slate-100 text-center">
          {item.question}
        </p>
      </div>

      <div key={current} className="space-y-2">
        {item.options.map((option, idx) => {
          let style = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow hover:shadow-md';
          if (selected !== null) {
            if (idx === item.answer) {
              style = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-400';
            } else if (idx === selected && idx !== item.answer) {
              style = 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400';
            } else {
              style = 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              autoFocus={idx === 0 && selected === null}
              aria-pressed={selected === idx}
              dir="auto"
              className={`w-full min-h-[44px] px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 press-feedback ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 space-y-3">
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
            {state.answers[current] ? 'Correct!' : <>Keep going — the answer is <strong dir="auto">{item.options[item.answer]}</strong>.</>}
          </p>
          <button autoFocus onClick={handleNext} className="w-full min-h-[44px] py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            {current + 1 < items.length ? 'Next →' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
