import type { Word } from '../../db/schema';
import { speak, isTTSSupported } from '../../lib/tts';

interface ReverseCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function ReverseCard({ word, isFlipped, onFlip }: ReverseCardProps) {
  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      className={`w-full min-h-[240px] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${
        isFlipped
          ? 'bg-white dark:bg-slate-800 border-2 border-emerald-300/60 dark:border-emerald-700/40 shadow-lg'
          : 'bg-white dark:bg-slate-800 border-2 border-indigo-200/60 dark:border-indigo-800/40 shadow-lg cursor-pointer hover:shadow-xl'
      }`}
    >
      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
        {word.language} — reverse
      </span>

      <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">
        {word.meaning}
      </p>

      {isFlipped ? (
        <div className="mt-2 text-center">
          {word.contextSentence && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 italic text-center">
              "{word.contextSentence}"
            </p>
          )}
          <p className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
            {word.word}
          </p>
          {word.reading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{word.reading}</p>
          )}
          {isTTSSupported() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.word, word.language);
              }}
              className="text-xl hover:scale-110 transition-transform"
              aria-label="Listen"
            >
              🔊
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-purple-400 dark:text-purple-300 mt-4">Tap to reveal</p>
      )}
    </div>
  );
}
