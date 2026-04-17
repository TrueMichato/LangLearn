import { useState, useCallback, useRef, useEffect } from 'react';
import { speak } from '../../lib/tts';

export interface DrillQuestion {
  prompt: string;
  correctAnswer: string;
  language: string;
}

interface TypeDrillProps {
  questions: DrillQuestion[];
  onComplete: (correct: number, total: number) => void;
}

export default function TypeDrill({ questions, onComplete }: TypeDrillProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = questions[index];
  const total = questions.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      setTimeout(() => {
        if (index + 1 >= total) {
          onComplete(wasCorrect ? correct + 1 : correct, total);
        } else {
          setIndex((i) => i + 1);
          setInput('');
          setFeedback(null);
        }
      }, 1000);
    },
    [index, total, correct, onComplete],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (feedback) return;
      const trimmed = input.trim();
      if (!trimmed) return;

      const isCorrect =
        trimmed.toLowerCase() === current.correctAnswer.toLowerCase();
      if (isCorrect) {
        setCorrect((c) => c + 1);
        setFeedback('correct');
        speak(current.correctAnswer, current.language);
      } else {
        setFeedback('wrong');
      }
      advance(isCorrect);
    },
    [input, feedback, current, advance],
  );

  const handleSkip = useCallback(() => {
    if (feedback) return;
    setFeedback('wrong');
    advance(false);
  }, [feedback, advance]);

  const progress = (index / total) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {index + 1} / {total}
      </p>

      {/* Prompt */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center">
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {current.prompt}
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!feedback}
          placeholder="Type your answer…"
          className={`w-full p-3 rounded-xl border-2 text-lg text-center outline-none transition-colors
            ${
              feedback === 'correct'
                ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                : feedback === 'wrong'
                  ? 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
            }`}
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!!feedback}
            className="flex-1 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={!!feedback}
            className="px-5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Skip
          </button>
        </div>
      </form>

      {feedback === 'wrong' && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          Correct answer: <strong>{current.correctAnswer}</strong>
        </p>
      )}
    </div>
  );
}
