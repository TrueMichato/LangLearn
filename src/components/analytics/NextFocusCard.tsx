import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNextFocus, type FocusCTA } from '../../lib/next-focus';
import { useSettingsStore } from '../../stores/settingsStore';

export default function NextFocusCard({ language }: { language?: string }) {
  const [cta, setCta] = useState<FocusCTA | null>(null);
  const [loaded, setLoaded] = useState(false);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getNextFocus(activeLanguages, language).then((result) => {
      if (cancelled) return;
      setCta(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [activeLanguages, language]);

  if (!loaded) return null;

  if (!cta) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-4 text-center">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          You're all caught up — lovely work! 🌟
        </p>
        <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
          Keep showing up; your progress is here whenever you are.
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate(cta.route)}
      className="w-full flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 mb-4 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors min-h-[44px]"
    >
      <span className="text-2xl shrink-0">{cta.icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
          What should I do next?
        </p>
        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
          {cta.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{cta.reason}</p>
      </div>
      <span className="ml-auto text-indigo-400 dark:text-indigo-300 shrink-0">→</span>
    </button>
  );
}
