import { useState } from 'react';

interface GrammarQuizProps {
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: number;
  onAnswer?: (correct: boolean) => void;
}

export default function GrammarQuiz({ question, options, answer, onAnswer }: GrammarQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    onAnswer?.(index === answer);
  };

  const isCorrect = selected === answer;

  return (
    <div className="my-6 rounded-2xl p-4">
      <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">🧠 {question}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          let cls =
            'rounded-xl px-3 py-2 text-sm font-medium border transition-colors text-center ';
          if (selected === null) {
            cls += 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer';
          } else if (i === answer) {
            cls += 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
          } else if (i === selected) {
            cls += 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
          } else {
            cls += 'border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-400 dark:text-slate-500';
          }

          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className={`mt-3 text-sm font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
          {isCorrect
            ? 'Correct! 🎉'
            : `Not quite — the answer is ${options[answer]}. Keep going! 💪`}
        </p>
      )}
    </div>
  );
}
