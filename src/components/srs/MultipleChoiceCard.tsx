import { useState } from 'react';
import type { Word } from '../../db/schema';
import type { SM2Grade } from '../../lib/sm2';
import { shuffle } from '../../lib/card-types';

interface MultipleChoiceCardProps {
  word: Word;
  distractors: string[];
  onGrade: (grade: SM2Grade) => void;
}

export default function MultipleChoiceCard({ word, distractors, onGrade }: MultipleChoiceCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [options] = useState(() => shuffle([word.meaning, ...distractors]));

  const handleSelect = (option: string) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === word.meaning;
    setTimeout(() => onGrade(isCorrect ? 4 : 0), 1000);
  };

  const getButtonClass = (option: string) => {
    if (!selected) {
      return 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
    }
    if (option === word.meaning) {
      return 'bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-800 dark:text-green-200';
    }
    if (option === selected) {
      return 'bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-800 dark:text-red-200';
    }
    return 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 opacity-50';
  };

  return (
    <div className="w-full min-h-[240px] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700">
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
        {word.language}
      </span>

      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 text-center">
        {word.word}
      </p>

      {word.reading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{word.reading}</p>
      )}

      <div className="w-full grid grid-cols-1 gap-2 mt-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={!!selected}
            className={`w-full py-3 px-4 rounded-xl text-left transition-colors ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
