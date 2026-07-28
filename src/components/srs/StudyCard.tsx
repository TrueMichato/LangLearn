import type { Word } from '../../db/schema';
import { speak, isTTSSupported } from '../../lib/tts';
import { rtlProps } from '../../lib/rtl';

interface StudyCardProps {
  word: Word;
}

export default function StudyCard({ word }: StudyCardProps) {
  return (
    <div className="w-full min-h-[240px] rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
        {word.language} — study
      </span>

      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center" {...rtlProps(word.language)}>
        {word.word}
      </p>

      {word.reading && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{word.reading}</p>
      )}

      {isTTSSupported() && (
        <button
          onClick={() => speak(word.word, word.language)}
          className="text-xl mb-3 hover:scale-110 transition-transform"
          aria-label="Listen"
        >
          🔊
        </button>
      )}

      <div className="mt-2 text-center">
        <p className="text-xl text-green-700 dark:text-green-400 font-semibold">{word.meaning}</p>
        {word.contextSentence && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 italic" {...rtlProps(word.language)}>
            "{word.contextSentence}"
          </p>
        )}
      </div>
    </div>
  );
}
