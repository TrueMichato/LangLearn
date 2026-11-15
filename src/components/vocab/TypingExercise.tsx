import type { TypingItem } from '../../types/vocab';
import { rtlProps } from '../../lib/rtl';
import { nextVocabItem, submitVocabItem, vocabItemFeedback, type VocabItemState } from '../../lib/vocab-lesson-state';

interface Props {
  items: TypingItem[];
  onComplete: (correct: number) => void;
  state: VocabItemState;
  onChange: (state: VocabItemState) => void;
  language: string;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function TypingExercise({ items, onComplete, state, onChange, language }: Props) {
  const { index: idx, input, showHint } = state;
  const feedback = vocabItemFeedback(state);
  const item = items[idx];

  function handleSubmit() {
    if (!input.trim() || feedback) return;
    onChange(submitVocabItem(state, normalize(input) === normalize(item.answer)));
  }

  function handleNext() {
    if (idx + 1 >= items.length) onComplete(state.answers.filter(Boolean).length);
    else onChange(nextVocabItem(state));
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">
        Type the Answer ({idx + 1}/{items.length})
      </h3>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-5 text-center space-y-4">
        <p className="text-xl text-slate-700 dark:text-slate-200">{item.prompt}</p>

        {showHint && item.hint && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            Hint: {item.hint}
          </p>
        )}

        <input
          key={idx}
          type="text"
          id="vocab-typing-answer"
          name="vocab-typing-answer"
          aria-label="Your answer"
          lang={language}
          {...rtlProps(language)}
          value={input}
          onChange={(e) => onChange({ ...state, input: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type your answer…"
          disabled={!!feedback}
          autoFocus
          className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-medium transition-colors focus:outline-none ${
            feedback === 'correct'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : feedback === 'wrong'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-indigo-500'
          }`}
        />

        {feedback === 'wrong' && (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
            Answer: <span {...rtlProps(language)} className="font-bold text-indigo-600 dark:text-indigo-400">{item.answer}</span>
          </p>
        )}

        {feedback === 'correct' && (
          <p role="status" className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</p>
        )}
      </div>

      <div className="flex gap-2">
        {!feedback && !showHint && item.hint && (
          <button
            onClick={() => onChange({ ...state, showHint: true })}
            className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors min-h-[44px]"
          >
            💡 Show Hint
          </button>
        )}
        {!feedback && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 min-h-[44px]"
          >
            Check
          </button>
        )}
        {feedback && (
          <button autoFocus onClick={handleNext} className="flex-1 min-h-[44px] py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            {idx + 1 < items.length ? 'Next →' : 'Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
