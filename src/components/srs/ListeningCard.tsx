import { useEffect } from 'react';
import type { Word } from '../../db/schema';
import { speak, isTTSSupported } from '../../lib/tts';

interface ListeningCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function ListeningCard({ word, isFlipped, onFlip }: ListeningCardProps) {
  useEffect(() => {
    if (isTTSSupported()) {
      speak(word.word, word.language);
    }
  }, [word.word, word.language]);

  if (!isTTSSupported()) {
    return (
      <div className="w-full min-h-[240px] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700">
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
          TTS not available — showing classic card
        </p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
          {word.word}
        </p>
        {word.reading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{word.reading}</p>
        )}
        {isFlipped ? (
          <p className="text-xl text-green-700 dark:text-green-400 font-semibold mt-2">
            {word.meaning}
          </p>
        ) : (
          <p
            className="text-sm text-indigo-400 dark:text-indigo-300 mt-4 cursor-pointer"
            onClick={onFlip}
          >
            Tap to reveal
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      className={`w-full min-h-[240px] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center transition-all duration-300 ${
        isFlipped
          ? 'bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700'
          : 'bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 cursor-pointer hover:shadow-xl'
      }`}
    >
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
        {word.language}
      </span>

      <p className="text-4xl mb-3">🔊</p>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">What did you hear?</p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          speak(word.word, word.language);
        }}
        className="text-sm bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-4 py-1.5 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors mb-3"
      >
        Replay
      </button>

      {isFlipped ? (
        <div className="mt-2 text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
            {word.word}
          </p>
          {word.reading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{word.reading}</p>
          )}
          <p className="text-lg text-gray-700 dark:text-gray-200">{word.meaning}</p>
        </div>
      ) : (
        <p className="text-sm text-teal-400 dark:text-teal-300 mt-2">Tap to reveal</p>
      )}
    </div>
  );
}
