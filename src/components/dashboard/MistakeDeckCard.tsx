import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMistakeCount } from '../../lib/mistakes';
import { useSettingsStore } from '../../stores/settingsStore';

export default function MistakeDeckCard() {
  const [count, setCount] = useState(0);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);

  useEffect(() => {
    let cancelled = false;
    getMistakeCount(activeLanguages).then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, [activeLanguages]);

  if (count === 0) return null;

  return (
    <Link
      to="/review?deck=mistakes"
      className="flex items-center gap-3 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 border border-rose-100 dark:border-rose-900/50 rounded-2xl shadow p-4 mb-6 hover:shadow-md transition-shadow min-h-[44px]"
    >
      <span className="text-2xl shrink-0">💪</span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Fix your misses
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {count} card{count > 1 ? 's' : ''} you recently slipped on — no pressure, just practice
        </p>
      </div>
      <span className="ml-auto text-rose-500 dark:text-rose-300 shrink-0 font-semibold">
        {count} →
      </span>
    </Link>
  );
}
