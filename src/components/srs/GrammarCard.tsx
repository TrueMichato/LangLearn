import type { Word } from '../../db/schema';
import { fillBlank, hasBlank } from '../../lib/grammar-cards';

interface GrammarCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function GrammarCard({ word, isFlipped, onFlip }: GrammarCardProps) {
  // Front shows the prompt (example sentence with a blank, or a question) and an optional hint —
  // never the answer (word.word) or the grammar rule.
  const prompt = word.contextSentence;
  const answer = word.word;
  const promptHasBlank = hasBlank(prompt);
  const filledSentence = fillBlank(prompt, answer);

  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      className={`relative w-full min-h-[240px] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${
        isFlipped
          ? 'bg-white dark:bg-slate-800 border-2 border-violet-300/60 dark:border-violet-700/40 shadow-lg'
          : 'bg-white dark:bg-slate-800 border-2 border-violet-200/60 dark:border-violet-800/40 shadow-lg cursor-pointer hover:shadow-xl'
      }`}
    >
      {/* Grammar badge */}
      <span className="absolute top-3 right-3 text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
        Grammar
      </span>

      {!isFlipped ? (
        /* Front: question side — prompt + hint only */
        <div className="text-center space-y-3 w-full">
          {word.reading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {word.reading}
            </p>
          )}

          {prompt ? (
            <div className="mt-2 bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p
                className="text-base text-gray-700 dark:text-gray-200"
                style={{ fontSize: 'var(--app-font-size)' }}
              >
                {prompt}
              </p>
            </div>
          ) : (
            <p className="text-base text-gray-500 dark:text-gray-400">
              {promptHasBlank ? 'Fill in the blank' : 'Recall the grammar point'}
            </p>
          )}

          <p className="text-sm text-violet-400 dark:text-violet-300 mt-4">Tap to reveal</p>
        </div>
      ) : (
        /* Back: answer side — answer, filled sentence, rule, explanation */
        <div className="text-center space-y-3 w-full">
          <p
            className="text-2xl font-bold text-green-700 dark:text-green-400"
            style={{ fontSize: 'var(--app-font-size)' }}
          >
            {answer}
          </p>

          {promptHasBlank && (
            <div className="mt-2 bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-base text-gray-800 dark:text-gray-100 font-medium">
                {filledSentence}
              </p>
            </div>
          )}

          {word.grammarRule && (
            <p className="text-sm text-violet-700 dark:text-violet-300 font-medium mt-2">
              {word.grammarRule}
            </p>
          )}

          {word.meaning && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {word.meaning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
