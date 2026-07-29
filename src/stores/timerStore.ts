import { create } from 'zustand';
import { db } from '../db/schema';
import { calculateTimeXP } from '../lib/xp';
import { updateDailyActivity } from '../lib/streaks';
import { useSettingsStore } from './settingsStore';
import type { StudyActivity } from '../lib/activities';

interface TimerState {
  isRunning: boolean;
  elapsed: number;
  activity: StudyActivity;
  sessionId: number | null;
  /** Seconds already persisted to studySessions/dailyActivity for the current session. */
  lastFlushedSeconds: number;
  start: (activity: StudyActivity) => void;
  tick: () => void;
  /** Persist progress without ending the session. Safe to call from visibility/unmount handlers. */
  flush: () => Promise<void>;
  stop: () => Promise<void>;
}

/** Persist accumulated time to the in-progress study session and dailyActivity. */
async function persistProgress(
  sessionId: number,
  elapsed: number,
  lastFlushedSeconds: number,
): Promise<number> {
  const delta = elapsed - lastFlushedSeconds;
  if (delta <= 0) return lastFlushedSeconds;

  const xp = calculateTimeXP(elapsed);
  await db.studySessions.update(sessionId, {
    durationSeconds: elapsed,
    xpEarned: xp,
  });

  const { dailyGoalMinutes } = useSettingsStore.getState();
  await updateDailyActivity({ addSeconds: delta, dailyGoalMinutes });

  return elapsed;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  elapsed: 0,
  activity: 'srs',
  sessionId: null,
  lastFlushedSeconds: 0,

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
        set({
          isRunning: true,
          elapsed: 0,
          activity,
          sessionId: id,
          lastFlushedSeconds: 0,
        });
      });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;
    const nextElapsed = state.elapsed + 1;
    set({ elapsed: nextElapsed });

    // Auto-flush every 15 seconds so progress isn't lost on hard exits.
    if (state.sessionId != null && nextElapsed - state.lastFlushedSeconds >= 15) {
      persistProgress(state.sessionId, nextElapsed, state.lastFlushedSeconds)
        .then((flushed) => set({ lastFlushedSeconds: flushed }))
        .catch(() => { /* swallow — best-effort flush */ });
    }
  },

  flush: async () => {
    const { sessionId, elapsed, lastFlushedSeconds } = get();
    if (sessionId == null) return;
    try {
      const flushed = await persistProgress(sessionId, elapsed, lastFlushedSeconds);
      set({ lastFlushedSeconds: flushed });
    } catch {
      /* swallow */
    }
  },

  stop: async () => {
    const { sessionId, elapsed, lastFlushedSeconds, activity } = get();
    if (sessionId == null) return;

    const delta = Math.max(0, elapsed - lastFlushedSeconds);
    const xp = calculateTimeXP(elapsed);
    await db.studySessions.update(sessionId, {
      endTime: new Date().toISOString(),
      durationSeconds: elapsed,
      xpEarned: xp,
    });

    if (delta > 0) {
      const { dailyGoalMinutes } = useSettingsStore.getState();
      await updateDailyActivity({ addSeconds: delta, dailyGoalMinutes });
    }

    set({
      isRunning: false,
      elapsed: 0,
      sessionId: null,
      lastFlushedSeconds: 0,
      activity,
    });
  },
}));

// Persist in-progress study time when the page is hidden or unloaded.
// Without this, navigating away or closing the tab would lose the elapsed time.
if (typeof window !== 'undefined') {
  const flushIfRunning = () => {
    const { isRunning, flush } = useTimerStore.getState();
    if (isRunning) void flush();
  };
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushIfRunning();
  });
  window.addEventListener('pagehide', flushIfRunning);
  window.addEventListener('beforeunload', flushIfRunning);
}
