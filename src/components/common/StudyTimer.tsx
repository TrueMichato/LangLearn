import { useEffect, useRef } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { formatStudyTime } from '../../lib/xp';

export default function StudyTimer() {
  const { isRunning, elapsed, activity, start, tick, stop } = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  if (!isRunning) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => start('srs')}
          className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback"
        >
          ▶ Start studying
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 animate-[pulseGlow_2s_ease-in-out_infinite] rounded-full px-2 py-0.5">
      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{activity}</span>
      <span className="text-sm font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
        {formatStudyTime(elapsed)}
      </span>
      <button
        onClick={stop}
        className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors press-feedback"
      >
        ⏹ Stop
      </button>
    </div>
  );
}
