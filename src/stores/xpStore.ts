import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface XPState {
  bonusXP: number;
  creditedVocabAttempts: Record<string, number>;
  addXP: (amount: number) => void;
  /** Called while holding the vocabulary receipt's IndexedDB write lock. */
  creditVocabAttempt: (attemptId: string, amount: number) => void;
}

export const XP_STORAGE_KEY = 'langlearn-xp';
export const XP_STORAGE_VERSION = 2;

export function migrateXPState(persisted: unknown) {
  const state = (persisted ?? {}) as Partial<XPState>;
  return {
    bonusXP: typeof state.bonusXP === 'number' && Number.isFinite(state.bonusXP) ? state.bonusXP : 0,
    creditedVocabAttempts: state.creditedVocabAttempts ?? {},
  };
}

function durableXPState() {
  if (typeof localStorage === 'undefined') throw new Error('XP storage is unavailable');
  const raw = localStorage.getItem(XP_STORAGE_KEY);
  const payload = raw ? JSON.parse(raw) : null;
  if (payload && payload.version > XP_STORAGE_VERSION) throw new Error('XP storage needs a newer app');
  if (raw && (!payload?.state || typeof payload.state.bonusXP !== 'number' ||
    !Number.isFinite(payload.state.bonusXP))) throw new Error('XP storage needs recovery');
  if (payload?.state.creditedVocabAttempts !== undefined &&
    (!payload.state.creditedVocabAttempts || typeof payload.state.creditedVocabAttempts !== 'object' ||
      Array.isArray(payload.state.creditedVocabAttempts) ||
      !Object.values(payload.state.creditedVocabAttempts).every((xp) =>
        typeof xp === 'number' && Number.isInteger(xp) && xp >= 0))) throw new Error('XP reward tokens need recovery');
  return migrateXPState(payload?.state);
}

export const useXPStore = create<XPState>()(
  persist(
    (set, get) => ({
      bonusXP: 0,
      creditedVocabAttempts: {},
      addXP: (amount) => set((s) => {
        // Keep ordinary awards additive without letting a stale tab erase
        // vocabulary tokens (or the XP they protect) from the durable payload.
        let durable = { bonusXP: 0, creditedVocabAttempts: {} };
        try { durable = durableXPState(); } catch { /* Preserve existing addXP fallback behavior. */ }
        return {
          bonusXP: Math.max(s.bonusXP, durable.bonusXP) + amount,
          creditedVocabAttempts: { ...durable.creditedVocabAttempts, ...s.creditedVocabAttempts },
        };
      }),
      creditVocabAttempt: (attemptId, amount) => {
        if (!attemptId || !Number.isInteger(amount) || amount < 0) throw new Error('Invalid vocabulary reward');
        // Read durable state again: a previous write may have succeeded before
        // the receipt transaction failed, or another tab may have awarded XP.
        const durable = durableXPState();
        const tokens = { ...get().creditedVocabAttempts, ...durable.creditedVocabAttempts };
        const credited = Object.hasOwn(tokens, attemptId);
        if (credited && tokens[attemptId] !== amount) throw new Error('Vocabulary reward does not match its receipt');
        const next = {
          bonusXP: Math.max(get().bonusXP, durable.bonusXP) + (credited ? 0 : amount),
          creditedVocabAttempts: { ...tokens, [attemptId]: amount },
        };
        // Persist the token AND total before publishing success in memory.
        // Zustand may perform a second write; either failure remains retryable.
        localStorage.setItem(XP_STORAGE_KEY, JSON.stringify({ state: next, version: XP_STORAGE_VERSION }));
        set(next);
      },
    }),
    {
      name: XP_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (key) => typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
        setItem: (key, value) => {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        },
      })),
      // Versioned so a future shape change migrates the learner's earned XP
      // instead of silently falling back to the initial state — an unversioned
      // persist() that fails to rehydrate resets the counter to zero, which
      // reads to the learner as "the update deleted my progress".
      version: XP_STORAGE_VERSION,
      migrate: migrateXPState,
    }
  )
);
