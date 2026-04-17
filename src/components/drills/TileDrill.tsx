import { useState, useCallback, useMemo } from 'react';
import { speak } from '../../lib/tts';

export interface DrillQuestion {
  prompt: string;
  correctAnswer: string;
  language: string;
}

interface TileDrillProps {
  questions: DrillQuestion[];
  onComplete: (correct: number, total: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TileDrill({ questions, onComplete }: TileDrillProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const current = questions[index];
  const total = questions.length;

  const allAnswers = useMemo(
    () => Array.from(new Set(questions.map((q) => q.correctAnswer))),
    [questions],
  );

  const tiles = useMemo(() => {
    const distractors = allAnswers
      .filter((a) => a !== current.correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    const options = [current.correctAnswer, ...distractors].slice(0, 5);
    return shuffle(options);
  }, [current, allAnswers]);

  const handleTap = useCallback(
    (tile: string) => {
      if (answered) return;
      setSelected(tile);
      setAnswered(true);
      const isCorrect = tile === current.correctAnswer;
      if (isCorrect) {
        setCorrect((c) => c + 1);
        speak(current.correctAnswer, current.language);
      }

      setTimeout(() => {
        if (index + 1 >= total) {
          onComplete(isCorrect ? correct + 1 : correct, total);
        } else {
          setIndex((i) => i + 1);
          setSelected(null);
          setAnswered(false);
        }
      }, 900);
    },
    [answered, current, correct, index, total, onComplete],
  );

  const progress = ((index) / total) * 100;

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

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          let cls =
            'p-4 rounded-xl text-center font-medium border-2 transition-colors cursor-pointer text-lg ';
          if (!answered) {
            cls += 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:border-indigo-400';
          } else if (tile === current.correctAnswer) {
            cls += 'bg-green-100 dark:bg-green-900 border-green-500 text-green-800 dark:text-green-100';
          } else if (tile === selected) {
            cls += 'bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-100';
          } else {
            cls += 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500';
          }

          return (
            <button key={tile} className={cls} onClick={() => handleTap(tile)}>
              {tile}
            </button>
          );
        })}
      </div>

      {answered && selected !== current.correctAnswer && (
        <p className="text-center text-sm text-red-600 dark:text-red-400">
          Correct answer: <strong>{current.correctAnswer}</strong>
        </p>
      )}
    </div>
  );
}
