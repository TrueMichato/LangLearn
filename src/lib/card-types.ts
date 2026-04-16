export type CardType = 'classic' | 'reverse' | 'listening' | 'multiple-choice';

const LEARNING_TYPES: CardType[] = ['classic', 'reverse'];
const ALL_TYPES: CardType[] = ['classic', 'reverse', 'listening', 'multiple-choice'];

/** Assign a card type based on review maturity */
export function assignCardType(repetitions: number): CardType {
  if (repetitions <= 1) return 'classic';
  if (repetitions <= 3) return LEARNING_TYPES[Math.floor(Math.random() * LEARNING_TYPES.length)];
  return ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
}

/** Select 3 distractor meanings from other words, excluding the correct answer */
export function selectDistractors(
  correctMeaning: string,
  otherWords: Array<{ meaning: string }>
): string[] {
  const pool = otherWords
    .map((w) => w.meaning)
    .filter((m) => m !== correctMeaning);
  return shuffle(pool).slice(0, 3);
}

/** Fisher-Yates shuffle (returns a new array) */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
