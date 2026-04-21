import { useState, useEffect } from 'react';
import {
  getMilestones,
  type ResolvedMilestone,
} from '../../lib/milestones';

export default function Milestones() {
  const [milestones, setMilestones] = useState<ResolvedMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getMilestones();
      if (!cancelled) {
        setMilestones(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || milestones.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
        <span>🏆</span> Milestones
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {milestones.map((m) => (
          <MilestoneCard key={m.id} milestone={m} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: ResolvedMilestone }) {
  const pct = Math.min(
    100,
    Math.round((milestone.current / milestone.target) * 100),
  );

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-4 ${
        milestone.completed
          ? 'ring-2 ring-emerald-400 dark:ring-emerald-500'
          : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{milestone.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {milestone.completed && (
              <span className="mr-1">✅</span>
            )}
            {milestone.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {milestone.current} / {milestone.target}
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            milestone.completed ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
