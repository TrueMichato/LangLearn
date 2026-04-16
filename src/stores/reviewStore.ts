import { create } from 'zustand';
import type { Word, Review } from '../db/schema';
import type { CardType } from '../lib/card-types';

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
  setQueue: (items: QueueItem[]) => void;
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
