import type { LessonInventory, QuizCorrection } from '../../helpers/grammar-retention';

// Literal shipped [rule, example] pair plus the only approved successor ID
// (null = retired: no saved review may transfer to a new target).
export type PreviousIdentity = readonly [rule: string, example: string, successor: string | null];

export interface LessonBaseline {
  quizzes: readonly [count: number, sha256: string];
  identities: readonly PreviousIdentity[];
}

export interface ReviewedBatch {
  inventories: LessonInventory[];
  /** `${lessonId}/${ruleCardId}` → why its front may show another card's one-word answer. */
  ruleFrontExemptions: Record<string, string>;
  /** `${lessonId}` → why the lesson cannot pair a production cloze with an interpretation Q&A. */
  pairingExemptions: Record<string, string>;
  /** Reviewed factual repairs to authored quizzes; every other quiz payload stays frozen. */
  quizCorrections: QuizCorrection[];
}
