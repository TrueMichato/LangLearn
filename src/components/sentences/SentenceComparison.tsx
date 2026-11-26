import { useEffect, useRef } from 'react';
import type { PracticeSentence } from '../../data/sentences';
import { rtlProps } from '../../lib/rtl';

interface SentenceComparisonProps {
  sentence: PracticeSentence;
  language: string;
  answer: string;
  mode: 'translation' | 'constrained';
}

export default function SentenceComparison({ sentence, language, answer, mode }: SentenceComparisonProps) {
  const isTranslation = mode === 'translation';
  const comparisonRef = useRef<HTMLElement>(null);
  useEffect(() => { comparisonRef.current?.focus(); }, []);
  return (
    <section ref={comparisonRef} tabIndex={-1} aria-label="Answer comparison" className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-white/10 rounded-2xl p-4 space-y-4">
      <dl className="space-y-3">
        <div>
          <dt className="text-sm text-slate-500 dark:text-slate-400">Your answer</dt>
          <dd className="mt-1 text-lg text-slate-800 dark:text-slate-100 break-words" {...rtlProps(language)}>{answer}</dd>
        </div>
        <div className="border-t border-slate-200/70 dark:border-white/10 pt-3">
          <dt className="text-sm font-medium text-slate-700 dark:text-slate-200">{isTranslation ? 'One possible answer' : 'Practice target'}</dt>
          <dd className="mt-1 text-lg text-slate-800 dark:text-slate-100" {...rtlProps(language)}>{sentence.target}</dd>
          {sentence.reading && <dd dir="ltr" className="text-sm text-slate-500 dark:text-slate-400">{sentence.reading}</dd>}
        </div>
      </dl>

      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {isTranslation ? (
          <>
            <p>Different wording can be right. This is a self-check, not an automatic translation grade.</p>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Check meaning, form, and context</h3>
            <ul className="list-disc ps-5 space-y-1">
              <li><strong>Meaning:</strong> Did you express the same idea, including who, when, and any negation?</li>
              <li><strong>Key form:</strong> Do your grammar and word choices fit the idea? A different valid construction can work.</li>
              <li><strong>Context:</strong> Is the tone or level of politeness suitable? If no context is given, avoid assuming only one register works.</li>
            </ul>
          </>
        ) : (
          <p>This drill checks the practice target, not every possible translation. Compare your words, their order, and any endings with the target.</p>
        )}
        {sentence.hint && <p><strong>{isTranslation ? 'Hint for the example:' : 'Hint:'}</strong> {sentence.hint}</p>}
        {sentence.context && <p><strong>Context:</strong> {sentence.context}</p>}
        {sentence.reviewedFeedback?.note && <p><strong>Practice note:</strong> {sentence.reviewedFeedback.note}</p>}
      </div>

      {isTranslation && !!sentence.reviewedFeedback?.alternatives?.length && (
        <div className="border-t border-slate-200/70 dark:border-white/10 pt-3 space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Other reviewed examples</h3>
          <ul className="space-y-3">
            {sentence.reviewedFeedback.alternatives.map((alternative, index) => (
              <li key={`${alternative.target}/${index}`}>
                <p className="text-lg text-slate-800 dark:text-slate-100" {...rtlProps(language)}>{alternative.target}</p>
                {alternative.reading && <p dir="ltr" className="text-sm text-slate-500 dark:text-slate-400">{alternative.reading}</p>}
                {alternative.note && <p className="text-sm text-slate-700 dark:text-slate-200">{alternative.note}</p>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 dark:text-slate-400">These examples are not a complete list of valid answers.</p>
        </div>
      )}
    </section>
  );
}
