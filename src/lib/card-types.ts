export type CardType = 'classic' | 'reverse' | 'listening' | 'multiple-choice' | 'cloze' | 'grammar';

const LEARNING_TYPES: CardType[] = ['classic', 'reverse', 'cloze'];
const ALL_TYPES: CardType[] = ['classic', 'reverse', 'listening', 'multiple-choice', 'cloze'];

/** Assign a card type based on review maturity and word type */
export function assignCardType(repetitions: number, wordType?: string): CardType {
  if (wordType === 'grammar') return 'grammar';
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

/**
 * Whether a context sentence would give the answer away on the question side.
 *
 * Words captured from grammar lessons used to store `word (reading) — meaning`
 * as their context, which `Flashcard` prints under the prompt — so the English
 * meaning appeared directly beneath the word being tested. New captures no
 * longer do this, but decks built before the fix still contain such rows, so
 * the card checks at render time rather than trusting the stored data.
 */
export function contextRevealsAnswer(contextSentence: string, meaning: string): boolean {
  const context = contextSentence.trim().toLowerCase();
  const answer = meaning.trim().toLowerCase();
  if (!context || !answer) return false;
  return context.includes(answer);
}
