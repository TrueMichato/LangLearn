import { create } from 'zustand';
import { db } from '../db/schema';
import { calculateTimeXP } from '../lib/xp';
import { updateDailyActivity } from '../lib/streaks';
import { useSettingsStore } from './settingsStore';

interface TimerState {
  isRunning: boolean;
  elapsed: number;
  activity: 'srs' | 'reading' | 'grammar';
  sessionId: number | null;
  start: (activity: 'srs' | 'reading' | 'grammar') => void;
  tick: () => void;
  stop: () => Promise<void>;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  elapsed: 0,
  activity: 'srs',
  sessionId: null,

  start: (activity) => {
    const state = get();
    if (state.isRunning) return;

    db.studySessions
      .add({
        startTime: new Date().toISOString(),
        endTime: null,
        durationSeconds: 0,
        activity,
        xpEarned: 0,
      })
      .then((id) => {
        set({ isRunning: true, elapsed: 0, activity, sessionId: id });
      });
  },

  tick: () => {
    set((s) => (s.isRunning ? { elapsed: s.elapsed + 1 } : s));
  },

  stop: async () => {
    const { sessionId, elapsed, activity } = get();
    if (sessionId == null) return;

    const xp = calculateTimeXP(elapsed);
    await db.studySessions.update(sessionId, {
      endTime: new Date().toISOString(),
      durationSeconds: elapsed,
      xpEarned: xp,
    });

    const { weeklyGoalMinutes } = useSettingsStore.getState();
    await updateDailyActivity({ addSeconds: elapsed, weeklyGoalMinutes });

    set({ isRunning: false, elapsed: 0, sessionId: null, activity });
  },
}));
