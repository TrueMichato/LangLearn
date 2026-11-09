import { saveWordsToVocabulary } from '../db/words';
import { isLexical, normalizeLexeme } from './lexical';

export interface PracticeCaptureWord {
  word: string;
  lemma?: string;
  reading?: string;
  meaning?: string;
  context?: string;
  tags?: readonly string[];
}

export function uniqueCaptureWords(words: readonly PracticeCaptureWord[], language: string) {
  const unique = new Map<string, PracticeCaptureWord>();
  for (const word of words) {
    const key = normalizeLexeme(word.lemma ?? word.word, language);
    if (!isLexical(key)) continue;
    const previous = unique.get(key);
    if (!previous || (!previous.meaning && word.meaning)) unique.set(key, word);
  }
  return [...unique.values()];
}

export async function saveCapturedPracticeWord(language: string, word: PracticeCaptureWord, {
  context = '', source, tags = [],
}: { context?: string; source?: string; tags?: readonly string[] } = {}) {
  const value = (word.lemma ?? word.word).trim();
  const meaning = word.meaning?.trim();
  if (!isLexical(value) || !meaning) throw new Error('A word and meaning are required');
  return saveWordsToVocabulary([{
    language, word: value, reading: word.reading?.trim() ?? '', meaning,
    contextSentence: word.context ?? context, sourceTextId: null,
    tags: [...new Set([...tags, ...(word.tags ?? []), ...(source ? [source] : [])])],
  }]);
}
