import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  weeklyGoalMinutes: number;
  activeLanguages: string[];
  showStressMarks: boolean;
  setWeeklyGoal: (minutes: number) => void;
  addLanguage: (lang: string) => void;
  removeLanguage: (lang: string) => void;
  toggleStressMarks: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weeklyGoalMinutes: 60,
      activeLanguages: ['ja', 'ru'],

      setWeeklyGoal: (minutes) => set({ weeklyGoalMinutes: minutes }),

      addLanguage: (lang) =>
        set((s) => ({
          activeLanguages: s.activeLanguages.includes(lang)
            ? s.activeLanguages
            : [...s.activeLanguages, lang],
        })),

      removeLanguage: (lang) =>
        set((s) => ({
          activeLanguages: s.activeLanguages.filter((l) => l !== lang),
        })),
    }),
    {
      name: 'langlearn-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
