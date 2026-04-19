import { HIRAGANA } from './hiragana';
import { KATAKANA } from './katakana';
import { KANJI } from './kanji';
import { CYRILLIC, CYRILLIC_LOWERCASE } from './cyrillic';
import type { Character } from './hiragana';

export type { Character };

export const ALPHABET_DATA: Record<string, { name: string; characters: Character[] }[]> = {
  ja: [
    { name: 'Hiragana', characters: HIRAGANA },
    { name: 'Katakana', characters: KATAKANA },
    { name: 'Kanji (N5)', characters: KANJI },
  ],
  ru: [
    { name: 'Cyrillic (Uppercase)', characters: CYRILLIC },
    { name: 'Cyrillic (Lowercase)', characters: CYRILLIC_LOWERCASE },
  ],
};

export function getAlphabetsForLanguage(lang: string) {
  return ALPHABET_DATA[lang] ?? [];
}
