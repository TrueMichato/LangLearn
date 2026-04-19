import { useState } from 'react';
import type { MCItem } from '../../types/vocab';

interface Props {
  items: MCItem[];
  onComplete: (correct: number) => void;
}

export default function VocabQuiz({ items, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const item = items[current];

  function handleSelect(idx: number) {
    if (selected !== null) return;
    setSelected(idx);

    const isCorrect = idx === item.answer;
    const newCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) setCorrect(newCorrect);

    setTimeout(() => {
      const nextIdx = current + 1;
      if (nextIdx >= items.length) {
        onComplete(newCorrect);
      } else {
        setCurrent(nextIdx);
        setSelected(null);
      }
    }, 1000);
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
        Quiz ({current + 1}/{items.length})
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 mb-4 border-l-4 border-rose-400 dark:border-rose-500">
        <p className="text-lg font-medium text-slate-800 dark:text-slate-100 text-center">
          {item.question}
        </p>
      </div>

      <div className="space-y-2">
        {item.options.map((option, idx) => {
          let style = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow hover:shadow-md';
          if (selected !== null) {
            if (idx === item.answer) {
              style = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-2 ring-green-400';
            } else if (idx === selected && idx !== item.answer) {
              style = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-400';
            } else {
              style = 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full min-h-[44px] px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 press-feedback ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
