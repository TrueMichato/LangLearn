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
    { name: 'langlearn-xp' }
  )
);
