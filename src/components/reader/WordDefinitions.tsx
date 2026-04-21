import { useState } from 'react';
import type { IchiMoeWord } from '../../lib/ichimoe';
import { addWord } from '../../db/words';
import { useTimerStore } from '../../stores/timerStore';

interface WordDefinitionsProps {
  words: IchiMoeWord[];
  language: string;
  sourceTextId: number | null;
  onWordAdded?: () => void;
}

export default function WordDefinitions({
  words,
  language,
  sourceTextId,
  onWordAdded,
}: WordDefinitionsProps) {
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const { isRunning, start } = useTimerStore();

  const handleAdd = async (w: IchiMoeWord) => {
    if (addedWords.has(w.surface) || !w.definition) return;
    setAddingWord(w.surface);

    if (!isRunning) start('reading');

    try {
      await addWord({
        language,
        word: w.dictionaryForm ?? w.surface,
        reading: w.reading,
        meaning: w.definition,
        contextSentence: '',
        sourceTextId,
        tags: [],
      });
      setAddedWords((prev) => new Set(prev).add(w.surface));
      onWordAdded?.();
    } finally {
      setAddingWord(null);
    }
  };

  if (words.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Word-by-word breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {words.map((w, i) => {
          const isAdded = addedWords.has(w.surface);
          const isAdding = addingWord === w.surface;

          return (
            <div
              key={`${w.surface}-${i}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex items-start gap-3 min-h-[44px]"
            >
              {/* Word info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {w.surface}
                  </span>
                  {w.reading && (
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                      {w.reading}
                    </span>
                  )}
                  {w.partOfSpeech && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded px-2 py-0.5">
                      {w.partOfSpeech}
                    </span>
                  )}
                </div>
                {w.dictionaryForm && w.dictionaryForm !== w.surface && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    dict: {w.dictionaryForm}
                  </p>
                )}
                {w.definition && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {w.definition}
                  </p>
                )}
              </div>

              {/* Add to SRS button */}
              {w.definition && (
                <button
                  onClick={() => handleAdd(w)}
                  disabled={isAdded || isAdding}
                  className={`shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors press-feedback ${
                    isAdded
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                  } disabled:opacity-60`}
                  title={isAdded ? 'Added' : 'Add to SRS'}
                >
                  {isAdding ? '…' : isAdded ? '✓' : '+'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
