import { useState, useMemo } from 'react';
import type { VocabWord } from '../../types/vocab';

interface Props {
  words: VocabWord[];
  pairCount: number;
  onComplete: (correct: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchExercise({ words, pairCount, onComplete }: Props) {
  const pairs = useMemo(() => shuffle(words).slice(0, pairCount), [words, pairCount]);
  const shuffledWords = useMemo(() => shuffle(pairs), [pairs]);
  const shuffledMeanings = useMemo(() => shuffle(pairs), [pairs]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  function handleWordTap(word: string) {
    if (matched.has(word)) return;
    setSelectedWord(word);
    setWrong(null);
  }

  function handleMeaningTap(meaning: string, word: string) {
    if (matched.has(word)) return;
    if (!selectedWord) return;

    if (selectedWord === word) {
      setMatched((prev) => new Set([...prev, word]));
      setCorrect((c) => c + 1);
      setSelectedWord(null);
      setWrong(null);

      if (matched.size + 1 === pairCount) {
        setTimeout(() => onComplete(correct + 1), 600);
      }
    } else {
      setWrong(meaning);
      setTimeout(() => setWrong(null), 800);
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
        Match each word with its meaning ({matched.size}/{pairCount})
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Words column */}
        <div className="space-y-2">
          {shuffledWords.map((w) => {
            const isMatched = matched.has(w.word);
            const isSelected = selectedWord === w.word;
            return (
              <button
                key={w.word}
                onClick={() => handleWordTap(w.word)}
                disabled={isMatched}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 scale-95 opacity-60'
                    : isSelected
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow hover:shadow-md'
                }`}
              >
                {isMatched && <span className="mr-1">✓</span>}
                {w.word}
              </button>
            );
          })}
        </div>

        {/* Meanings column */}
        <div className="space-y-2">
          {shuffledMeanings.map((w) => {
            const isMatched = matched.has(w.word);
            const isWrong = wrong === w.meaning;
            return (
              <button
                key={w.meaning}
                onClick={() => handleMeaningTap(w.meaning, w.word)}
                disabled={isMatched}
                className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 scale-95 opacity-60'
                    : isWrong
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow hover:shadow-md'
                }`}
              >
                {isMatched && <span className="mr-1">✓</span>}
                {w.meaning}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
