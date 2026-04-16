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
          className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
        >
          ▶ Start studying
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 capitalize">{activity}</span>
      <span className="text-sm font-mono font-semibold text-indigo-600">
        {formatStudyTime(elapsed)}
      </span>
      <button
        onClick={stop}
        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
      >
        ⏹ Stop
      </button>
    </div>
  );
}
