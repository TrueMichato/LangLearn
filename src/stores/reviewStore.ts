import { create } from 'zustand';
import { db, type Word, type Review } from '../db/schema';
import type { CardType } from '../lib/card-types';
import { processReview, type ProcessReviewOptions } from '../db/reviews';
import type { SM2Grade } from '../lib/sm2';

export type PracticeMode = 'word-to-meaning' | 'meaning-to-word' | 'both' | 'random';
export type ReviewSessionKind = 'scheduled' | 'practice';

export interface QueueItem {
  word: Word;
  review: Review;
  cardType: CardType | 'study';
  distractors?: string[];
}

interface ReviewSessionState {
  queue: QueueItem[];
  currentIndex: number;
  isFlipped: boolean;
  cardsReviewed: number;
  practiceMode: PracticeMode | null;
  sessionKind: ReviewSessionKind | null;
  sessionId: number;
  isGrading: boolean;
  setQueue: (items: QueueItem[], kind: ReviewSessionKind) => void;
  gradeCurrent: (grade: SM2Grade, options?: ProcessReviewOptions, expected?: QueueItem) => Promise<boolean>;
  flip: () => void;
  reset: () => void;
  setPracticeMode: (mode: PracticeMode) => void;
}

export const useReviewStore = create<ReviewSessionState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  cardsReviewed: 0,
  practiceMode: null,
  sessionKind: null,
  sessionId: 0,
  isGrading: false,

  setQueue: (items, kind) =>
    set((state) => ({
      queue: items, sessionKind: kind, sessionId: state.sessionId + 1,
      currentIndex: 0, isFlipped: false, cardsReviewed: 0, isGrading: false,
    })),

  gradeCurrent: async (grade, options, expected) => {
    const state = get();
    const current = state.queue[state.currentIndex];
    if (!current || !state.sessionKind || state.isGrading || (expected && expected !== current)) return false;
    set({ isGrading: true });
    try {
      // This is the single grading boundary shared by every card and shortcut.
      // Practice is deliberately memory-only: no review/log/evidence writes.
      const review = state.sessionKind === 'scheduled'
        ? await db.transaction('rw', [db.words, db.reviews, db.reviewLog],
            () => processReview(current.review.id!, grade, options))
        : current.review;
      if (get().sessionId !== state.sessionId) return false;
      set({
        queue: grade < 3 ? [...state.queue, { ...current, review }] : state.queue,
        currentIndex: state.currentIndex + 1,
        isFlipped: false,
        cardsReviewed: state.cardsReviewed + 1,
        isGrading: false,
      });
      return true;
    } catch (error) {
      if (get().sessionId === state.sessionId) set({ isGrading: false });
      throw error;
    }
  },

  flip: () => set({ isFlipped: true }),

  reset: () =>
    set((state) => ({
      queue: [], currentIndex: 0, isFlipped: false, cardsReviewed: 0,
      sessionKind: null, sessionId: state.sessionId + 1, isGrading: false,
    })),

  setPracticeMode: (mode) => set({ practiceMode: mode }),
}));
