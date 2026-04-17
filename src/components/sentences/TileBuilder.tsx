import { useState, useMemo, useCallback } from 'react';
import type { PracticeSentence } from '../../data/sentences/ja-sentences';
import { speak } from '../../lib/tts';

interface TileBuilderProps {
  sentence: PracticeSentence;
  language: string;
  allSentences: PracticeSentence[];
  onResult: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TileBuilder({ sentence, language, allSentences, onResult }: TileBuilderProps) {
  const tiles = useMemo(() => {
    const distractors = new Set<string>();
    const correctSet = new Set(sentence.targetWords);
    const pool = allSentences.flatMap((s) => s.targetWords).filter((w) => !correctSet.has(w));
    const shuffledPool = shuffle(pool);
    for (const w of shuffledPool) {
      if (distractors.size >= 3) break;
      if (!distractors.has(w)) distractors.add(w);
    }
    return shuffle([...sentence.targetWords, ...distractors]);
  }, [sentence, allSentences]);

  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>(tiles);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelect = useCallback(
    (word: string, idx: number) => {
      if (checked) return;
      setSelected((prev) => [...prev, word]);
      setAvailable((prev) => prev.filter((_, i) => i !== idx));
    },
    [checked],
  );

  const handleRemove = useCallback(
    (word: string, idx: number) => {
      if (checked) return;
      setSelected((prev) => prev.filter((_, i) => i !== idx));
      setAvailable((prev) => [...prev, word]);
    },
    [checked],
  );

  const handleCheck = () => {
    const correct = selected.join('') === sentence.targetWords.join('');
    setIsCorrect(correct);
    setChecked(true);
    if (correct) speak(sentence.target, language);
  };

  const handleNext = () => onResult(isCorrect);

  const borderClass = checked ? (isCorrect ? 'border-green-500 bg-green-100 dark:bg-green-900/50' : 'border-red-500 bg-red-100 dark:bg-red-900/50') : 'border-transparent';

  return (
    <div className="space-y-5">
      {/* English prompt */}
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">{sentence.english}</p>

      {/* Answer area */}
      <div className={`min-h-[60px] bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-wrap gap-2 border-2 ${borderClass}`}>
        {selected.length === 0 && !checked && <span className="text-gray-400 dark:text-gray-500 text-sm italic">Tap tiles to build the sentence…</span>}
        {selected.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => handleRemove(word, i)}
            className="bg-indigo-100 dark:bg-indigo-900 border border-indigo-400 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer transition-colors"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {checked && (
        <div className={`text-center font-semibold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isCorrect ? '✓ Correct!' : `✗ Correct answer: ${sentence.target}`}
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">{sentence.reading}</p>
        </div>
      )}

      {/* Available tiles */}
      <div className="flex flex-wrap gap-2 justify-center">
        {available.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => handleSelect(word, i)}
            disabled={checked}
            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={selected.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        ) : (
          <button onClick={handleNext} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
