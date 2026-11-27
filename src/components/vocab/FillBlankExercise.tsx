import type { FillBlankItem, VocabWord } from '../../types/vocab';
import { rtlProps } from '../../lib/rtl';
import { fillBlankCue, firstLetterHint } from '../../lib/fill-blank-cue';
import { nextVocabItem, submitVocabItem, vocabItemFeedback, type VocabItemState } from '../../lib/vocab-lesson-state';

interface Props {
  items: FillBlankItem[];
  words?: readonly VocabWord[];
  onComplete: (correct: number) => void;
  state: VocabItemState;
  onChange: (state: VocabItemState) => void;
  language: string;
}

export default function FillBlankExercise({ items, words = [], onComplete, state, onChange, language }: Props) {
  const { index: current, input, showHint } = state;
  const feedback = vocabItemFeedback(state);
  const item = items[current];
  const cue = fillBlankCue(item);
  const letterHint = firstLetterHint(item.answer, language, words);
  const meaningNote = cue?.kind === 'translation' && item.hint.trim() ? item.hint.trim() : null;

  function handleCheck() {
    if (!input.trim() || feedback) return;
    const isCorrect = input.trim().toLowerCase() === item.answer.toLowerCase();
    onChange(submitVocabItem(state, isCorrect));
  }

  function handleNext() {
    const nextIdx = current + 1;
    if (nextIdx >= items.length) {
      onComplete(state.answers.filter(Boolean).length);
      return;
    }
    onChange(nextVocabItem(state));
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
        Fill in the blank ({current + 1}/{items.length})
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 mb-4 border border-slate-200/70 dark:border-white/10">
        <p lang={language} {...rtlProps(language)} className="text-lg text-slate-800 dark:text-slate-100 text-center leading-relaxed">
          {item.sentence}
        </p>
        {cue && (
          <p lang="en" dir="ltr" className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
            “{cue.text}”
          </p>
        )}
      </div>

      {showHint && !feedback && letterHint && (
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3 text-center">
          💡 {letterHint}
        </p>
      )}

      {feedback ? (
        <div className="space-y-3">
          <div
            role="status"
            className={`rounded-xl p-4 text-center font-medium ${
              feedback === 'correct'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
            }`}
          >
            {feedback === 'correct' ? (
              <span>✅ Correct!</span>
            ) : (
              <span>
                Keep going — the answer is <strong lang={language} {...rtlProps(language)}>{item.answer}</strong>
              </span>
            )}
            {meaningNote && (
              <span className="block mt-1 text-sm font-normal">({meaningNote})</span>
            )}
          </div>
          <button
            autoFocus
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            {current + 1 < items.length ? 'Next →' : 'Continue'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            id="vocab-fill-answer"
            name="vocab-fill-answer"
            aria-label="Your answer"
            lang={language}
            {...rtlProps(language)}
            value={input}
            onChange={(e) => onChange({ ...state, input: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none min-h-[44px]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...state, showHint: true })}
              disabled={showHint || !letterHint}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-h-[44px] press-feedback"
            >
              Show Hint
            </button>
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 min-h-[44px] press-feedback"
            >
              Check
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
