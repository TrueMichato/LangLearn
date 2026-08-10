import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface XPState {
  bonusXP: number;
  addXP: (amount: number) => void;
}

export const useXPStore = create<XPState>()(
  persist(
    (set) => ({
      bonusXP: 0,
      addXP: (amount) => set((s) => ({ bonusXP: s.bonusXP + amount })),
    }),
    {
      name: 'langlearn-xp',
      // Versioned so a future shape change migrates the learner's earned XP
      // instead of silently falling back to the initial state — an unversioned
      // persist() that fails to rehydrate resets the counter to zero, which
      // reads to the learner as "the update deleted my progress".
      version: 1,
      migrate: (persisted, fromVersion) => {
        const state = (persisted ?? {}) as Partial<XPState>;
        if (fromVersion === 0) {
          return { ...state, bonusXP: typeof state.bonusXP === 'number' ? state.bonusXP : 0 };
        }
        return state;
      },
    }
  )
);
