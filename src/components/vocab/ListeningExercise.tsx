import { useState } from 'react';
import { speak, TTS_SPEEDS, type TTSSpeed } from '../../lib/tts';
import type { ListeningItem } from '../../types/vocab';

interface Props {
  items: ListeningItem[];
  language: string;
  onComplete: (correct: number) => void;
}

export default function ListeningExercise({ items, language, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [ttsSpeed, setTtsSpeed] = useState<TTSSpeed>(0.75);

  const item = items[idx];

  function handleSelect(optionIdx: number) {
    if (feedback) return;
    setSelected(optionIdx);
    const isCorrect = optionIdx === item.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect((c) => c + 1);

    setTimeout(() => {
      const nextIdx = idx + 1;
      if (nextIdx >= items.length) {
        onComplete(correct + (isCorrect ? 1 : 0));
      } else {
        setIdx(nextIdx);
        setSelected(null);
        setFeedback(null);
      }
    }, 1500);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
        Listening ({idx + 1}/{items.length})
      </h3>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 text-center space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Listen and choose the correct meaning</p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => speak(item.word, language, ttsSpeed)}
            className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-4xl flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
          >
            🔊
          </button>

          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {TTS_SPEEDS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setTtsSpeed(s.value);
                  speak(item.word, language, s.value);
                }}
                className={`px-2.5 py-1 text-xs font-medium transition-colors min-h-[32px] ${
                  ttsSpeed === s.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {item.options.map((option, i) => {
            let btnClass = 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600';
            if (feedback && i === item.answer) {
              btnClass = 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 ring-2 ring-green-500';
            } else if (feedback && i === selected && i !== item.answer) {
              btnClass = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 ring-2 ring-red-500';
            } else if (feedback) {
              btnClass = 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={!!feedback}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors text-left min-h-[44px] ${btnClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {feedback === 'correct' && (
          <p className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</p>
        )}
        {feedback === 'wrong' && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No worries! The answer was: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.options[item.answer]}</span>
          </p>
        )}
      </div>
    </div>
  );
}
