import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { PracticeSentence } from '../../data/sentences/ja-sentences';
import { speak } from '../../lib/tts';
import { rtlProps } from '../../lib/rtl';
import PracticeWordCapture from '../common/PracticeWordCapture';
import SentenceComparison from './SentenceComparison';

interface TileBuilderProps {
  sentence: PracticeSentence;
  language: string;
  allSentences: PracticeSentence[];
  onResult: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TileBuilder({ sentence, language, allSentences, onResult }: TileBuilderProps) {
  const tiles = useMemo(() => {
    const distractors = new Set<string>();
    const correctSet = new Set(sentence.targetWords);
    const pool = allSentences.flatMap((s) => s.targetWords).filter((w) => !correctSet.has(w));
    const shuffledPool = shuffle(pool);
    for (const w of shuffledPool) {
      if (distractors.size >= 3) break;
      if (!distractors.has(w)) distractors.add(w);
    }
    return shuffle([...sentence.targetWords, ...distractors]);
  }, [sentence, allSentences]);

  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>(tiles);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const firstCorrect = useRef<boolean | null>(null);
  const resultSent = useRef(false);
  const comparisonButtonRef = useRef<HTMLButtonElement>(null);
  const firstTileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checked) comparisonButtonRef.current?.focus();
    else firstTileRef.current?.focus();
  }, [checked]);

  const handleSelect = useCallback(
    (word: string, idx: number) => {
      if (checked) return;
      setSelected((prev) => [...prev, word]);
      setAvailable((prev) => prev.filter((_, i) => i !== idx));
    },
    [checked],
  );

  const handleRemove = useCallback(
    (word: string, idx: number) => {
      if (checked) return;
      setSelected((prev) => prev.filter((_, i) => i !== idx));
      setAvailable((prev) => [...prev, word]);
    },
    [checked],
  );

  const handleCheck = () => {
    if (checked || resultSent.current || !selected.length) return;
    const correct = selected.join('') === sentence.targetWords.join('');
    firstCorrect.current ??= correct;
    setIsCorrect(correct);
    setChecked(true);
    if (correct) speak(sentence.target, language);
  };

  const handleNext = () => {
    if (!checked || firstCorrect.current === null || resultSent.current) return;
    resultSent.current = true;
    onResult(firstCorrect.current);
  };

  const handleRetry = () => {
    if (!checked || resultSent.current) return;
    setSelected([]);
    setAvailable(tiles);
    setChecked(false);
    setShowComparison(false);
    setIsRetry(true);
  };

  const answerClass = checked ? (isCorrect ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30' : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30') : 'border-slate-200/70 dark:border-white/10 bg-slate-50 dark:bg-slate-800';

  return (
    <div className="space-y-5">
      {/* English prompt */}
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 text-center">{sentence.english}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Arrange the tiles to match the practice target.</p>
      {sentence.context && <p className="text-sm text-slate-700 dark:text-slate-200">{sentence.context}</p>}
      {isRetry && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Retry practice — your first check still counts. No extra completion XP or review progress.</p>}

      {/* Answer area */}
      <div role="group" aria-label="Your sentence" className={`min-h-[60px] rounded-xl p-3 flex flex-wrap gap-2 border ${answerClass}`} {...rtlProps(language)}>
        {selected.length === 0 && !checked && <span className="text-slate-500 dark:text-slate-400 text-sm italic">Tap tiles to build the sentence…</span>}
        {selected.map((word, i) => (
          <button
            key={`${word}-${i}`}
            onClick={() => handleRemove(word, i)}
            disabled={checked}
            aria-label={`Remove ${word}`}
            className="min-h-[44px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:cursor-default"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {checked && (
        <>
          <div role="status" className={`text-center font-semibold ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-200'}`}>
            {isCorrect ? '✓ Matches the practice target.' : 'Not a match yet — compare with the practice target.'}
            {!showComparison && <>
              <p {...rtlProps(language)} className="mt-1 text-slate-800 dark:text-slate-100">{sentence.target}</p>
              <p dir="ltr" className="text-sm font-normal text-slate-500 dark:text-slate-400">{sentence.reading}</p>
            </>}
          </div>
          <button ref={comparisonButtonRef} onClick={() => setShowComparison((value) => !value)} aria-expanded={showComparison}
            className="min-h-[44px] text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            {showComparison ? 'Hide comparison' : 'Compare answers'}
          </button>
          {showComparison && <SentenceComparison sentence={sentence} language={language}
            answer={selected.join(language === 'ja' ? '' : ' ')} mode="constrained" />}
        </>
      )}

      {/* Available tiles */}
      <div className="flex flex-wrap gap-2 justify-center" {...rtlProps(language)}>
        {available.map((word, i) => (
          <button
            key={`${word}-${i}`}
            ref={i === 0 ? firstTileRef : undefined}
            onClick={() => handleSelect(word, i)}
            disabled={checked}
            className="min-h-[44px] bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        {!checked ? (
          <button
            onClick={handleCheck}
            disabled={selected.length === 0}
            className="min-h-[44px] px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        ) : (
          <>
            <button onClick={handleNext} className="min-h-[44px] px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
              Next →
            </button>
            <button onClick={handleRetry} className="min-h-[44px] px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Retry this sentence
            </button>
          </>
        )}
      </div>
      {checked && <PracticeWordCapture language={language} text={sentence.target} context={sentence.target} source="sentence" />}
    </div>
  );
}
