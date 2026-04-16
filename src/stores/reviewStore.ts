import { create } from 'zustand';
import type { Word, Review } from '../db/schema';

interface ReviewSessionState {
  queue: Array<{ word: Word; review: Review }>;
  currentIndex: number;
  isFlipped: boolean;
  cardsReviewed: number;
  setQueue: (items: Array<{ word: Word; review: Review }>) => void;
  flip: () => void;
  next: () => void;
  reset: () => void;
}

export const useReviewStore = create<ReviewSessionState>((set) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  cardsReviewed: 0,

  setQueue: (items) =>
    set({ queue: items, currentIndex: 0, isFlipped: false, cardsReviewed: 0 }),

  flip: () => set({ isFlipped: true }),

  next: () =>
    set((s) => ({
      currentIndex: s.currentIndex + 1,
      isFlipped: false,
      cardsReviewed: s.cardsReviewed + 1,
    })),

  reset: () =>
    set({ queue: [], currentIndex: 0, isFlipped: false, cardsReviewed: 0 }),
}));
