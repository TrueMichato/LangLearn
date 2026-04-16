import type { Word } from '../../db/schema';
import { speak, isTTSSupported } from '../../lib/tts';

interface FlashcardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ word, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      className={`w-full min-h-[240px] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center transition-all duration-300 ${
        isFlipped
          ? 'bg-white border border-green-200'
          : 'bg-white border border-indigo-200 cursor-pointer hover:shadow-xl'
      }`}
    >
      <span className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        {word.language}
      </span>

      <p className="text-3xl font-bold text-gray-800 mb-2 text-center">
        {word.word}
      </p>

      {word.reading && (
        <p className="text-sm text-gray-500 mb-2">{word.reading}</p>
      )}

      {isTTSSupported() && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            speak(word.word, word.language);
          }}
          className="text-xl mb-3 hover:scale-110 transition-transform"
          aria-label="Listen"
        >
          🔊
        </button>
      )}

      {isFlipped ? (
        <div className="mt-2 text-center">
          <p className="text-xl text-green-700 font-semibold">{word.meaning}</p>
          {word.contextSentence && (
            <p className="text-sm text-gray-500 mt-3 italic">
              "{word.contextSentence}"
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-indigo-400 mt-4">Tap to reveal</p>
      )}
    </div>
  );
}
