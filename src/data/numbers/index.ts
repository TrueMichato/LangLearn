import { arNumbers, type NumberEntry } from './ar-numbers';

export type { NumberEntry } from './ar-numbers';

const NUMBERS_BY_LANGUAGE: Record<string, NumberEntry[]> = {
  ar: arNumbers,
};

export function getNumbersForLanguage(lang: string): NumberEntry[] {
  return NUMBERS_BY_LANGUAGE[lang] ?? [];
}

export function hasNumbers(lang: string): boolean {
  return (NUMBERS_BY_LANGUAGE[lang]?.length ?? 0) > 0;
}

export const NUMBER_LANGUAGES = Object.keys(NUMBERS_BY_LANGUAGE);
