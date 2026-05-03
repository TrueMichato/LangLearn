import type { Word } from '../../db/schema';

interface GrammarCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

/** Replace the grammar point in the example sentence with a blank placeholder. */
function blankOut(sentence: string, rule: string): string {
  if (!sentence || !rule) return sentence;
  // Try exact match first, then case-insensitive
  const idx = sentence.indexOf(rule);
  if (idx !== -1) {
    return sentence.slice(0, idx) + '＿＿' + sentence.slice(idx + rule.length);
  }
  return sentence;
}

export default function GrammarCard({ word, isFlipped, onFlip }: GrammarCardProps) {
  const blankedSentence = blankOut(word.contextSentence, word.word);
  const hasBlanked = blankedSentence !== word.contextSentence;

  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      className={`relative w-full min-h-[240px] rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
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
        /* Front: question side */
        <div className="text-center space-y-3 w-full">
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300" style={{ fontSize: 'var(--app-font-size)' }}>
            {word.word}
          </p>

          {word.reading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {word.reading}
            </p>
          )}

          {word.contextSentence && (
            <div className="mt-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-base text-gray-700 dark:text-gray-200">
                {hasBlanked ? blankedSentence : word.contextSentence}
              </p>
            </div>
          )}

          <p className="text-sm text-violet-400 dark:text-violet-300 mt-4">Tap to reveal</p>
        </div>
      ) : (
        /* Back: answer side */
        <div className="text-center space-y-3 w-full">
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300" style={{ fontSize: 'var(--app-font-size)' }}>
            {word.word}
          </p>

          {word.contextSentence && (
            <div className="mt-2 bg-violet-50 dark:bg-violet-950/30 rounded-xl px-4 py-3">
              <p className="text-base text-gray-800 dark:text-gray-100 font-medium">
                {word.contextSentence}
              </p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-lg text-green-700 dark:text-green-400 font-semibold">
              {word.meaning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
