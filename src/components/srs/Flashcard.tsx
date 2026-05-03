import type { Word } from '../../db/schema';
import { speak, isTTSSupported } from '../../lib/tts';
import { useSettingsStore } from '../../stores/settingsStore';

function HighlightedContext({ sentence, word }: { sentence: string; word: string }) {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) {
    return <>{sentence}</>;
  }
  const before = sentence.slice(0, idx);
  const match = sentence.slice(idx, idx + word.length);
  const after = sentence.slice(idx + word.length);
  return (
    <>
      {before}
      <span className="font-bold text-gray-800 dark:text-gray-100 not-italic">{match}</span>
      {after}
    </>
  );
}

interface FlashcardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ word, isFlipped, onFlip }: FlashcardProps) {
  const showContext = useSettingsStore((s) => s.showContextOnCards);

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
        {word.language}
        {word.contextSentence && showContext && (
          <span className="ml-1" title="Has context sentence">📝</span>
        )}
      </span>

      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center" style={{ fontSize: 'var(--app-font-size)' }}>
        {word.word}
      </p>

      {word.reading && word.type !== 'letter' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{word.reading}</p>
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

      {!isFlipped && showContext && word.contextSentence && (
        <p className="text-base text-gray-600 dark:text-gray-300 mt-3 italic text-center">
          "<HighlightedContext sentence={word.contextSentence} word={word.word} />"
        </p>
      )}

      {isFlipped ? (
        <div className="mt-2 text-center">
          <p className="text-xl text-green-700 dark:text-green-400 font-semibold">{word.meaning}</p>
          {word.contextSentence && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">
              "{word.contextSentence}"
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-indigo-400 dark:text-indigo-300 mt-4">Tap to reveal</p>
      )}
    </div>
  );
}
