import { useState, useCallback } from 'react';
import { getRandomTip, getTipForContext } from '../../data/study-tips';
import type { StudyTip as StudyTipType } from '../../data/study-tips';

interface StudyTipProps {
  category?: string;
  context?: string;
  className?: string;
}

function pickTip(category?: string, context?: string): StudyTipType {
  if (context) return getTipForContext(context);
  return getRandomTip(category);
}

const DISMISS_KEY = 'langlearn-study-tip-dismissed';

export default function StudyTip({ category, context, className = '' }: StudyTipProps) {
  const [tip, setTip] = useState<StudyTipType>(() => pickTip(category, context));
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === 'true'
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  const handleNext = useCallback(() => {
    let next = pickTip(category, context);
    // Avoid showing the same tip twice in a row
    if (next.id === tip.id) {
      next = pickTip(category, context);
    }
    setTip(next);
  }, [category, context, tip.id]);

  if (dismissed) return null;

  return (
    <div
      className={`bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5" aria-hidden="true">💡</span>
        <p className="text-sm text-indigo-800 dark:text-indigo-200 flex-1">
          {tip.text}
        </p>
        <button
          onClick={handleDismiss}
          className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          aria-label="Dismiss tip"
        >
          ×
        </button>
      </div>
      <div className="flex justify-end mt-1">
        <button
          onClick={handleNext}
          className="min-h-[44px] text-xs font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-1"
        >
          Next tip →
        </button>
      </div>
    </div>
  );
}
