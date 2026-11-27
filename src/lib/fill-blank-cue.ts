/**
 * Cue and hint helpers for vocab "fill in the blank" items.
 *
 * The cue is the English meaning shown before answering so the blank is
 * answerable without guessing: the full sentence `translation` when authored,
 * otherwise the legacy word-level `hint`.
 */

export interface FillBlankCueSource {
  hint?: string;
  translation?: string;
}

export interface FillBlankCue {
  text: string;
  kind: 'translation' | 'hint';
}

export function fillBlankCue(item: FillBlankCueSource): FillBlankCue | null {
  const translation = item.translation?.trim();
  if (translation) return { text: translation, kind: 'translation' };
  const hint = item.hint?.trim();
  if (hint) return { text: hint, kind: 'hint' };
  return null;
}

const COMBINING_MARK = /\p{M}/u;
const ARABIC_TATWEEL = '\u0640';

/** First visible base character (code-point safe, skipping leading combining marks). */
export function firstBaseCharacter(text: string): string {
  for (const char of Array.from(text.normalize('NFC').trim())) {
    if (COMBINING_MARK.test(char) || char === ARABIC_TATWEEL) continue;
    return char;
  }
  return '';
}

const KANJI = /\p{Script=Han}/u;

interface ReadingSource {
  word: string;
  reading: string;
}

/**
 * Kana reading for a Japanese answer when a lesson word clearly matches it:
 * an exact match, or a single word sharing the answer's leading kanji
 * (covers conjugated answers such as 焼き for 焼く).
 */
export function japaneseAnswerReading(answer: string, words: readonly ReadingSource[]): string | null {
  const target = answer.trim();
  if (!target) return null;
  const exact = words.find((w) => w.word.trim() === target);
  if (exact?.reading.trim()) return exact.reading.trim();
  const first = firstBaseCharacter(target);
  if (!KANJI.test(first)) return null;
  const matches = words.filter((w) => firstBaseCharacter(w.word) === first && w.reading.trim());
  return matches.length === 1 ? matches[0].reading.trim() : null;
}

/** Kind first-letter hint, e.g. `Starts with “к”`. */
export function firstLetterHint(
  answer: string,
  language: string,
  words: readonly ReadingSource[] = [],
): string | null {
  const answerLetter = firstBaseCharacter(answer);
  if (!answerLetter) return null;
  if (language === 'ja' && KANJI.test(answerLetter)) {
    const sound = firstBaseCharacter(japaneseAnswerReading(answer, words) ?? '');
    if (sound) return `Starts with the sound “${sound}”`;
  }
  return `Starts with “${answerLetter}”`;
}
