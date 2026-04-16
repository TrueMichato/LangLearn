import { useState } from 'react';

interface GrammarQuizProps {
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: number;
}

export default function GrammarQuiz({ question, options, answer }: GrammarQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const isCorrect = selected === answer;

  return (
    <div className="my-6 rounded-2xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800 p-4">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-3">🧠 {question}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          let cls =
            'rounded-xl px-3 py-2 text-sm font-medium border transition-colors text-center ';
          if (selected === null) {
            cls += 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer';
          } else if (i === answer) {
            cls += 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
          } else if (i === selected) {
            cls += 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
          } else {
            cls += 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-400 dark:text-gray-500';
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
