import { HIRAGANA } from './hiragana';
import { KATAKANA } from './katakana';
import { CYRILLIC } from './cyrillic';
import type { Character } from './hiragana';

export type { Character };

export const ALPHABET_DATA: Record<string, { name: string; characters: Character[] }[]> = {
  ja: [
    { name: 'Hiragana', characters: HIRAGANA },
    { name: 'Katakana', characters: KATAKANA },
  ],
  ru: [
    { name: 'Cyrillic', characters: CYRILLIC },
  ],
};

export function getAlphabetsForLanguage(lang: string) {
  return ALPHABET_DATA[lang] ?? [];
}
