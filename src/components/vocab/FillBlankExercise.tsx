import { useState } from 'react';
import type { FillBlankItem } from '../../types/vocab';

interface Props {
  items: FillBlankItem[];
  onComplete: (correct: number) => void;
}

export default function FillBlankExercise({ items, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);

  const item = items[current];

  function handleCheck() {
    if (!input.trim()) return;

    const isCorrect = input.trim().toLowerCase() === item.answer.toLowerCase();
    if (isCorrect) {
      setCorrect((c) => c + 1);
    }
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }

  function handleNext() {
    const nextIdx = current + 1;
    if (nextIdx >= items.length) {
      onComplete(feedback === 'correct' ? correct : correct);
      return;
    }
    setCurrent(nextIdx);
    setInput('');
    setShowHint(false);
    setFeedback(null);
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
        Fill in the blank ({current + 1}/{items.length})
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-4">
        <p className="text-lg text-gray-800 dark:text-gray-100 text-center leading-relaxed">
          {item.sentence}
        </p>
      </div>

      {showHint && !feedback && (
        <p className="text-sm text-indigo-500 dark:text-indigo-400 mb-3 text-center">
          💡 Hint: {item.hint}
        </p>
      )}

      {feedback ? (
        <div className="space-y-3">
          <div
            className={`rounded-xl p-4 text-center font-medium ${
              feedback === 'correct'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback === 'correct' ? (
              <span>✅ Correct!</span>
            ) : (
              <span>
                ❌ Incorrect — the answer is <strong>{item.answer}</strong>
              </span>
            )}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            {current + 1 < items.length ? 'Next →' : 'Continue'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none min-h-[44px]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(true)}
              className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Show Hint
            </button>
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Check
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
