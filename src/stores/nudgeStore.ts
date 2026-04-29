import { create } from 'zustand';

export interface InAppNudge {
  id: string;
  title: string;
  body: string;
  /** Optional CTA button label. */
  ctaLabel?: string;
  /** Optional CTA action; if returns a promise, dismissed after it resolves. */
  ctaAction?: () => void | Promise<void>;
  tone?: 'info' | 'warm' | 'celebrate';
}

interface NudgeStore {
  nudges: InAppNudge[];
  push: (n: Omit<InAppNudge, 'id'> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

export const useNudgeStore = create<NudgeStore>((set) => ({
  nudges: [],
  push: (n) =>
    set((s) => {
      const id = n.id ?? `nudge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // De-dupe by id
      if (s.nudges.some((x) => x.id === id)) return s;
      return { nudges: [...s.nudges, { ...n, id }] };
    }),
  dismiss: (id) => set((s) => ({ nudges: s.nudges.filter((n) => n.id !== id) })),
}));
