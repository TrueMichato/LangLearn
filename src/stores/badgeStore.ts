import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BadgeState {
  unlockedBadges: Record<string, string>; // id → unlockedAt ISO date
  lastToast: string | null;
  unlockBadge: (id: string) => void;
  clearToast: () => void;
  isUnlocked: (id: string) => boolean;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      unlockedBadges: {},
      lastToast: null,

      unlockBadge: (id) =>
        set((s) => ({
          unlockedBadges: {
            ...s.unlockedBadges,
            [id]: new Date().toISOString(),
          },
          lastToast: id,
        })),

      clearToast: () => set({ lastToast: null }),

      isUnlocked: (id) => id in get().unlockedBadges,
    }),
    {
      name: 'langlearn-badges',
      storage: createJSONStorage(() => localStorage),
      // Badges are a permanent record of what the learner achieved. Version the
      // store so a shape change migrates them forward instead of quietly
      // resetting the collection to empty.
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<BadgeState>;
        return {
          ...state,
          unlockedBadges: state.unlockedBadges ?? {},
        };
      },
    }
  )
);
