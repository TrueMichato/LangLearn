import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  weeklyGoalMinutes: number;
  activeLanguages: string[];
  showStressMarks: boolean;
  darkMode: boolean;
  fontSize: number;
  ttsRate: number;
  reviewBatchSize: number;
  setWeeklyGoal: (minutes: number) => void;
  addLanguage: (lang: string) => void;
  removeLanguage: (lang: string) => void;
  toggleStressMarks: () => void;
  toggleDarkMode: () => void;
  setFontSize: (size: number) => void;
  setTtsRate: (rate: number) => void;
  setReviewBatchSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weeklyGoalMinutes: 60,
      activeLanguages: ['ja', 'ru'],
      showStressMarks: true,
      darkMode: false,
      fontSize: 18,
      ttsRate: 0.9,
      reviewBatchSize: 25,

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

      toggleStressMarks: () =>
        set((s) => ({ showStressMarks: !s.showStressMarks })),

      toggleDarkMode: () =>
        set((s) => {
          const newMode = !s.darkMode;
          document.documentElement.classList.toggle('dark', newMode);
          return { darkMode: newMode };
        }),

      setFontSize: (size) => set({ fontSize: size }),
      setTtsRate: (rate) => set({ ttsRate: rate }),
      setReviewBatchSize: (size) => set({ reviewBatchSize: size }),
    }),
    {
      name: 'langlearn-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
