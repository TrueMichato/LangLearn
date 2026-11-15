import { useState } from 'react';
import { speak, TTS_SPEEDS, type TTSSpeed } from '../../lib/tts';
import type { ListeningItem } from '../../types/vocab';
import { nextVocabItem, submitVocabItem, vocabItemFeedback, type VocabItemState } from '../../lib/vocab-lesson-state';

interface Props {
  items: ListeningItem[];
  language: string;
  onComplete: (correct: number) => void;
  state: VocabItemState;
  onChange: (state: VocabItemState) => void;
}

export default function ListeningExercise({ items, language, onComplete, state, onChange }: Props) {
  const { index: idx, selected } = state;
  const feedback = vocabItemFeedback(state);
  const [ttsSpeed, setTtsSpeed] = useState<TTSSpeed>(0.75);

  const item = items[idx];

  function handleSelect(optionIdx: number) {
    if (feedback) return;
    onChange(submitVocabItem(state, optionIdx === item.answer, optionIdx));
  }

  function handleNext() {
    if (idx + 1 >= items.length) onComplete(state.answers.filter(Boolean).length);
    else onChange(nextVocabItem(state));
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">
        Listening ({idx + 1}/{items.length})
      </h3>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-5 text-center space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Listen and choose the correct meaning</p>

        <div className="flex flex-col items-center gap-3">
          <button
            key={idx}
            autoFocus={!feedback}
            onClick={() => speak(item.word, language, ttsSpeed)}
            aria-label="Listen to the word"
            className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-4xl flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
          >
            🔊
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            {TTS_SPEEDS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setTtsSpeed(s.value);
                  speak(item.word, language, s.value);
                }}
                aria-pressed={ttsSpeed === s.value}
                className={`px-2.5 py-1 text-xs font-medium transition-colors min-h-[44px] ${
                  ttsSpeed === s.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {item.options.map((option, i) => {
            let btnClass = 'bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600';
            if (feedback && i === item.answer) {
              btnClass = 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 ring-2 ring-green-500';
            } else if (feedback && i === selected && i !== item.answer) {
              btnClass = 'bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500';
            } else if (feedback) {
              btnClass = 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={!!feedback}
                aria-pressed={selected === i}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors text-left min-h-[44px] ${btnClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {feedback && (
          <button autoFocus onClick={handleNext} className="w-full min-h-[44px] py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            {idx + 1 < items.length ? 'Next →' : 'Continue'}
          </button>
        )}

        {feedback === 'correct' && (
          <p role="status" className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</p>
        )}
        {feedback === 'wrong' && (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
            No worries! The answer was: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.options[item.answer]}</span>
          </p>
        )}
      </div>
    </div>
  );
}
