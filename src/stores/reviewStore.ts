import { create } from 'zustand';
import type { Word, Review } from '../db/schema';
import type { CardType } from '../lib/card-types';

export type PracticeMode = 'word-to-meaning' | 'meaning-to-word' | 'both' | 'random';

export interface QueueItem {
  word: Word;
  review: Review;
  cardType: CardType;
  distractors?: string[];
}

interface ReviewSessionState {
  queue: QueueItem[];
  currentIndex: number;
  isFlipped: boolean;
  cardsReviewed: number;
  practiceMode: PracticeMode | null;
  setQueue: (items: QueueItem[]) => void;
  flip: () => void;
  next: () => void;
  reset: () => void;
  setPracticeMode: (mode: PracticeMode) => void;
}

export const useReviewStore = create<ReviewSessionState>((set) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  cardsReviewed: 0,
  practiceMode: null,

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
    set({ queue: [], currentIndex: 0, isFlipped: false, cardsReviewed: 0, practiceMode: null }),

  setPracticeMode: (mode) => set({ practiceMode: mode }),
}));
