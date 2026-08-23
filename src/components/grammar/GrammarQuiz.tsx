import { useState } from 'react';
import { rtlProps, rtlTextAlign } from '../../lib/rtl';

interface GrammarQuizProps {
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: number;
  onAnswer?: (correct: boolean) => void;
  onSelect?: (index: number, correct: boolean) => void;
  selectedIndex?: number | null;
  language?: string;
  questionDirection?: 'target';
  targetOptionIndices?: number[];
}

export default function GrammarQuiz({
  question,
  options,
  answer,
  onAnswer,
  onSelect,
  selectedIndex,
  language,
  questionDirection,
  targetOptionIndices = [],
}: GrammarQuizProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const controlled = selectedIndex !== undefined;
  const selected = controlled ? selectedIndex : internalSelected;

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    if (!controlled) setInternalSelected(index);
    const correct = index === answer;
    onSelect?.(index, correct);
    onAnswer?.(correct);
  };

  const isCorrect = selected === answer;

  return (
    <div className="my-6 p-4">
      <p
        className={`mb-3 font-semibold text-slate-800 dark:text-slate-100 ${
          questionDirection === 'target' && language
            ? rtlTextAlign(language)
            : ''
        }`}
        {...(questionDirection === 'target' && language
          ? rtlProps(language)
          : {})}
      >
        <span aria-hidden="true">🧠 </span>
        {question}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const targetOption = Boolean(
            language && targetOptionIndices.includes(i),
          );
          let cls =
            'min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium border transition-colors text-center disabled:cursor-default ';
          if (selected === null) {
            cls += 'border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-400 cursor-pointer';
          } else if (i === answer) {
            cls += 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
          } else if (i === selected) {
            cls += 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
          } else {
            cls += 'border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-500 dark:text-slate-400';
          }

          return (
            <button
              key={i}
              type="button"
              className={`${cls} ${
                targetOption && language ? rtlTextAlign(language) : ''
              }`}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              {...(targetOption && language ? rtlProps(language) : {})}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p
          className={`mt-3 text-sm font-medium ${
            isCorrect
              ? 'text-green-700 dark:text-green-300'
              : 'text-amber-800 dark:text-amber-300'
          }`}
        >
          {isCorrect ? (
            'Correct! 🎉'
          ) : (
            <>
              Not quite — the answer is{' '}
              <span
                {...(language && targetOptionIndices.includes(answer)
                  ? rtlProps(language)
                  : {})}
              >
                {options[answer]}
              </span>
              . Keep going! 💪
            </>
          )}
        </p>
      )}
    </div>
  );
}
