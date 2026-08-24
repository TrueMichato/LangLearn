import { arSentences } from './ar-sentences';
import { esSentences } from './es-sentences';
import { jaSentences, type PracticeSentence } from './ja-sentences';
import { ptSentences } from './pt-sentences';
import { roSentences } from './ro-sentences';
import { ruSentences } from './ru-sentences';

export type { PracticeSentence };

export const SENTENCES_BY_LANGUAGE: Record<string, PracticeSentence[]> = {
  ja: jaSentences,
  ru: ruSentences,
  pt: ptSentences,
  es: esSentences,
  ar: arSentences,
  ro: roSentences,
};

export const SENTENCE_LANGUAGES = Object.keys(SENTENCES_BY_LANGUAGE);

export function getPracticeSentences(language: string): PracticeSentence[] {
  return SENTENCES_BY_LANGUAGE[language] ?? [];
}
