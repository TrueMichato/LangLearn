import { useState } from 'react';
import type { TypingItem } from '../../types/vocab';

interface Props {
  items: TypingItem[];
  onComplete: (correct: number) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function TypingExercise({ items, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [correct, setCorrect] = useState(0);

  const item = items[idx];

  function handleSubmit() {
    if (!input.trim() || feedback) return;
    const isCorrect = normalize(input) === normalize(item.answer);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setCorrectAnswer(item.answer);
    if (isCorrect) setCorrect((c) => c + 1);

    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= items.length) {
        onComplete(correct + (isCorrect ? 1 : 0));
      } else {
        setIdx(nextIdx);
        setInput('');
        setShowHint(false);
        setFeedback(null);
        setCorrectAnswer('');
      }
    }, 1500);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
        Type the Answer ({idx + 1}/{items.length})
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 text-center space-y-4">
        <p className="text-xl text-gray-700 dark:text-gray-200">{item.prompt}</p>

        {showHint && item.hint && (
          <p className="text-sm text-indigo-500 dark:text-indigo-400">
            Hint: {item.hint}
          </p>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type your answer…"
          disabled={!!feedback}
          autoFocus
          className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-medium transition-colors focus:outline-none ${
            feedback === 'correct'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : feedback === 'wrong'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-indigo-500'
          }`}
        />

        {feedback === 'wrong' && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Correct answer: <span className="font-bold text-indigo-600 dark:text-indigo-400">{correctAnswer}</span>
          </p>
        )}

        {feedback === 'correct' && (
          <p className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</p>
        )}
      </div>

      <div className="flex gap-2">
        {!feedback && !showHint && item.hint && (
          <button
            onClick={() => setShowHint(true)}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
          >
            💡 Show Hint
          </button>
        )}
        {!feedback && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 min-h-[44px]"
          >
            Check
          </button>
        )}
      </div>
    </div>
  );
}
