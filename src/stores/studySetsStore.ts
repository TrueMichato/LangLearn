import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StudySet {
  id: string;
  name: string;
  description: string;
  type: 'custom' | 'smart';
  tags: string[];
  smartFilter?: 'due-today' | 'weakest' | 'from-grammar' | 'from-letters' | 'recent';
  language?: string;
  createdAt: string;
}

interface StudySetsState {
  sets: StudySet[];
  _initialized: boolean;
  addSet: (set: StudySet) => void;
  updateSet: (id: string, updates: Partial<StudySet>) => void;
  deleteSet: (id: string) => void;
  ensureDefaults: () => void;
}

const DEFAULT_SMART_SETS: StudySet[] = [
  {
    id: 'smart-due-today',
    name: 'Due Today',
    description: 'Words with reviews due now',
    type: 'smart',
    tags: [],
    smartFilter: 'due-today',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'smart-weakest',
    name: 'Weakest Words',
    description: 'Your 20 lowest ease-factor words',
    type: 'smart',
    tags: [],
    smartFilter: 'weakest',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'smart-from-grammar',
    name: 'From Grammar Lessons',
    description: 'Words tagged from grammar practice',
    type: 'smart',
    tags: [],
    smartFilter: 'from-grammar',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'smart-from-letters',
    name: 'From Letter Practice',
    description: 'Words tagged from letter drills',
    type: 'smart',
    tags: [],
    smartFilter: 'from-letters',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'smart-recent',
    name: 'Recently Added',
    description: 'Words added in the last 7 days',
    type: 'smart',
    tags: [],
    smartFilter: 'recent',
    createdAt: new Date().toISOString(),
  },
];

export const useStudySetsStore = create<StudySetsState>()(
  persist(
    (set, get) => ({
      sets: [],
      _initialized: false,

      addSet: (newSet) =>
        set((s) => ({ sets: [...s.sets, newSet] })),

      updateSet: (id, updates) =>
        set((s) => ({
          sets: s.sets.map((ss) => (ss.id === id ? { ...ss, ...updates } : ss)),
        })),

      deleteSet: (id) =>
        set((s) => ({ sets: s.sets.filter((ss) => ss.id !== id) })),

      ensureDefaults: () => {
        const state = get();
        if (state._initialized) return;
        const existing = state.sets.map((s) => s.id);
        const missing = DEFAULT_SMART_SETS.filter((d) => !existing.includes(d.id));
        set({ sets: [...state.sets, ...missing], _initialized: true });
      },
    }),
    {
      name: 'langlearn-study-sets',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
