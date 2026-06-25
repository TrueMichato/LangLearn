/** Pure helpers for grammar SRS cards, shared by lesson generation and the review card. */

export interface GrammarCardSource {
  rule: string;
  hint?: string;
  example?: string;
  answer?: string;
  explanation: string;
}

export interface GrammarCardFields {
  word: string;
  reading: string;
  contextSentence: string;
  meaning: string;
  grammarRule: string;
}

/** A blank placeholder: a run of ASCII underscores or full-width underscores. */
export const BLANK_REGEX = /[_＿]{2,}/;

export function hasBlank(sentence: string | undefined | null): boolean {
  return !!sentence && BLANK_REGEX.test(sentence);
}

/** Replace the blank placeholder in the prompt with the answer for the reveal side. */
export function fillBlank(sentence: string, answer: string): string {
  if (!sentence || !answer) return sentence;
  if (BLANK_REGEX.test(sentence)) {
    return sentence.replace(new RegExp(BLANK_REGEX.source, 'g'), answer);
  }
  return sentence;
}

/**
 * Map a grammar-card source block to the Word fields stored for SRS.
 *
 * The prompt (example sentence, which contains a `___` blank when present) becomes the
 * question side; the answer becomes the hidden side; the rule is kept separate so it never
 * leaks onto the question. Returns null when there is nothing to test.
 */
export function buildGrammarCardFields(card: GrammarCardSource): GrammarCardFields | null {
  const prompt = card.example ?? '';
  const answer = card.answer ?? '';
  if (!answer && !prompt) return null;
  return {
    word: answer || card.rule,
    reading: card.hint ?? '',
    contextSentence: prompt,
    meaning: card.explanation,
    grammarRule: card.rule,
  };
}
