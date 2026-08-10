import type { Word } from '../../db/schema';
import { fillBlank, hasBlank } from '../../lib/grammar-cards';
import { humanizeLessonId, lessonIdFromTags } from '../../lib/lesson-capture';
import { rtlProps } from '../../lib/rtl';

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
  const lessonId = lessonIdFromTags(word.tags);

  // Many grammar cards ask a question rather than offering a sentence to
  // complete, so there is no blank to fill. When there is no prompt at all the
  // rule stands in as the question — an honest "recall this rule" card beats a
  // blank one.
  const question = prompt || word.grammarRule;
  const ruleIsQuestion = !prompt && !!word.grammarRule;

  return (
    <div
      onClick={!isFlipped ? onFlip : undefined}
      onKeyDown={
        !isFlipped
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFlip();
              }
            }
          : undefined
      }
      role={!isFlipped ? 'button' : undefined}
      tabIndex={!isFlipped ? 0 : undefined}
      aria-label={!isFlipped ? 'Reveal the answer' : undefined}
      className={`relative w-full min-h-[240px] rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 shadow-lg ${
        isFlipped
          ? ''
          : 'cursor-pointer hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
      }`}
    >
      <span className="absolute top-3 right-3 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
        Grammar
      </span>

      {!isFlipped ? (
        /* Front: question side — prompt + hint only */
        <div className="text-center space-y-3 w-full">
          {word.reading && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {word.reading}
            </p>
          )}

          {question ? (
            <div className="mt-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl px-4 py-3">
              <p
                className="text-base text-slate-700 dark:text-slate-200"
                style={{ fontSize: 'var(--app-font-size)' }}
                {...rtlProps(word.language)}
              >
                {question}
              </p>
            </div>
          ) : (
            <p className="text-base text-slate-500 dark:text-slate-400">
              Recall the grammar point
            </p>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            {promptHasBlank ? 'What fills the blank? Tap to reveal' : 'Tap to reveal'}
          </p>
        </div>
      ) : (
        /* Back: answer side — answer, filled sentence, rule, explanation */
        <div className="text-center space-y-3 w-full">
          <p
            className="text-2xl font-bold text-green-700 dark:text-green-400"
            style={{ fontSize: 'var(--app-font-size)' }}
            {...rtlProps(word.language)}
          >
            {answer}
          </p>

          {promptHasBlank && (
            <div className="mt-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl px-4 py-3">
              <p className="text-base text-slate-800 dark:text-slate-100 font-medium" {...rtlProps(word.language)}>
                {filledSentence}
              </p>
            </div>
          )}

          {word.grammarRule && !ruleIsQuestion && (
            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium mt-2">
              {word.grammarRule}
            </p>
          )}

          {word.meaning && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {word.meaning}
            </p>
          )}

          {lessonId && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              From {humanizeLessonId(lessonId)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
