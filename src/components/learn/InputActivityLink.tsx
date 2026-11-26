import { Link } from 'react-router-dom';
import { getInputRecommendation } from '../../lib/learn-activity-recommendations';

export default function InputActivityLink({ language, after }: {
  language: string;
  after?: 'reading' | 'listening';
}) {
  const suggestion = getInputRecommendation(language, null, after);
  if (!suggestion) return null;
  return (
    <div className="mt-4 border-t border-slate-200/70 pt-3 text-left dark:border-white/10">
      <Link to={suggestion.to}
        className="inline-flex min-h-[44px] items-center rounded-xl px-2 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-slate-700">
        {suggestion.title}
      </Link>
      <p className="text-xs text-slate-500 dark:text-slate-400">{suggestion.subtitle}</p>
    </div>
  );
}
