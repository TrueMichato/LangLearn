import { db } from '../db/schema';
import { getFrequencyRank, getFrequencyTier } from '../data/frequency';

export interface TextAnalysis {
  totalWords: number;
  uniqueWords: number;
  knownWords: number;
  knownPercentage: number; // 0-100
  comprehensionLevel: 'easy' | 'comfortable' | 'challenging' | 'difficult';
  unknownHighFrequency: string[]; // unknown words that are high-frequency (top 500)
}

/**
 * Tokenize text into word tokens.
 * For Japanese, uses basic character-class splitting (no kuromoji dependency).
 * For other languages, splits on whitespace/punctuation.
 */
function tokenizeForAnalysis(text: string, language: string): string[] {
  if (language === 'ja') {
    // Split into runs of kanji, hiragana, or katakana
    const matches = text.match(/[\u4e00-\u9faf\u3400-\u4dbf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+/g);
    return matches ?? [];
  }

  // For other languages, split on whitespace/punctuation and normalise
  return text
    .toLowerCase()
    .split(/[^a-zA-Zа-яА-ЯёЁ\u00C0-\u024F]+/)
    .filter((t) => t.length > 0);
}

function getComprehensionLevel(percentage: number): TextAnalysis['comprehensionLevel'] {
  if (percentage >= 95) return 'easy';
  if (percentage >= 90) return 'comfortable';
  if (percentage >= 80) return 'challenging';
  return 'difficult';
}

export async function analyzeText(text: string, language: string): Promise<TextAnalysis> {
  const allTokens = tokenizeForAnalysis(text, language);
  const totalWords = allTokens.length;

  const uniqueSet = new Set(allTokens.map((t) => t.toLowerCase()));
  const uniqueWords = uniqueSet.size;

  if (uniqueWords === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      knownWords: 0,
      knownPercentage: 100,
      comprehensionLevel: 'easy',
      unknownHighFrequency: [],
    };
  }

  // Query user's known words — language is indexed
  const userWords = await db.words.where('language').equals(language).toArray();
  const knownSet = new Set(userWords.map((w) => w.word.toLowerCase()));

  let knownCount = 0;
  const unknownUnique: string[] = [];

  for (const word of uniqueSet) {
    if (knownSet.has(word)) {
      knownCount++;
    } else {
      unknownUnique.push(word);
    }
  }

  const knownPercentage = uniqueWords > 0 ? Math.round((knownCount / uniqueWords) * 100) : 100;

  // Find unknown words that are high-frequency (top 500) — worth learning
  const unknownHighFrequency = unknownUnique
    .filter((w) => {
      const rank = getFrequencyRank(w, language);
      const tier = getFrequencyTier(rank);
      return tier === 'essential' || tier === 'common';
    })
    .sort((a, b) => {
      const ra = getFrequencyRank(a, language) ?? Infinity;
      const rb = getFrequencyRank(b, language) ?? Infinity;
      return ra - rb;
    });

  return {
    totalWords,
    uniqueWords,
    knownWords: knownCount,
    knownPercentage,
    comprehensionLevel: getComprehensionLevel(knownPercentage),
    unknownHighFrequency,
  };
}

/** Build a Set of the user's known words (lowercased) for a language. */
export async function getKnownWordSet(language: string): Promise<Set<string>> {
  const userWords = await db.words.where('language').equals(language).toArray();
  return new Set(userWords.map((w) => w.word.toLowerCase()));
}
