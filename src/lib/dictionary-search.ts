import { db } from '../db/schema';
import { lookupWord } from './dictionary';
import { wordExists } from '../db/words';

export interface DictResult {
  word: string;
  reading: string;
  meaning: string;
  source: 'local' | 'online';
  inDeck: boolean;
}

export async function searchDictionary(
  query: string,
  language: string,
): Promise<DictResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toLowerCase();

  // Local search: filter words in the DB by language
  const allWords = await db.words.where('language').equals(language).toArray();
  const localMatches = allWords.filter(
    (w) =>
      w.word.toLowerCase().includes(q) ||
      w.reading.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q),
  );

  const localResults: DictResult[] = localMatches.map((w) => ({
    word: w.word,
    reading: w.reading,
    meaning: w.meaning,
    source: 'local' as const,
    inDeck: true,
  }));

  // Online search: only if local results < 3
  if (localResults.length < 3) {
    try {
      const online = await lookupWord(trimmed, language);
      if (online) {
        const alreadyInDeck = await wordExists(online.word, language);
        const alreadyInResults = localResults.some(
          (r) => r.word === online.word,
        );
        if (!alreadyInResults) {
          localResults.push({
            word: online.word,
            reading: online.reading,
            meaning: online.meanings.join('; '),
            source: 'online',
            inDeck: alreadyInDeck,
          });
        }
      }
    } catch {
      // Online lookup failed — return local results only
    }
  }

  return localResults;
}
