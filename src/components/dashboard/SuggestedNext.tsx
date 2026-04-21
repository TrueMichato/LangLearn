import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  getStudySuggestions,
  type StudySuggestion,
} from '../../lib/study-suggestions';

export default function SuggestedNext() {
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await getStudySuggestions(activeLanguages);
      if (!cancelled) {
        setSuggestions(results);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeLanguages]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
        <span>📋</span> Suggested Next
      </h3>
      <div className="flex flex-col gap-3">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(s.route)}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow p-4 text-left hover:shadow-md transition-shadow w-full min-h-[44px]"
          >
            <span className="text-2xl shrink-0">{s.icon}</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {s.title}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {s.reason}
              </p>
            </div>
            <span className="ml-auto text-slate-400 dark:text-slate-500 shrink-0">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
