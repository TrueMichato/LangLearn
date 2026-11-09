import { loadKnowledgeSnapshot } from '../db/knowledge';
import { getFrequencyRank, getFrequencyTier } from '../data/frequency';
import type { KnowledgeSnapshot } from './knowledge';
import { analyzeLexicalCoverage, type LexicalCoverage } from './lexical-coverage';
import { tokenizeLexicalText } from './lexical-tokenizer';

export interface TextAnalysis {
  totalWords: number;
  uniqueWords: number;
  knownWords: number;
  knownPercentage: number; // 0-100
  comprehensionLevel: 'easy' | 'comfortable' | 'challenging' | 'difficult';
  unknownHighFrequency: string[]; // unknown words that are high-frequency (top 500)
  coverage: LexicalCoverage;
}

function getComprehensionLevel(percentage: number): TextAnalysis['comprehensionLevel'] {
  if (percentage >= 95) return 'easy';
  if (percentage >= 90) return 'comfortable';
  if (percentage >= 80) return 'challenging';
  return 'difficult';
}

/** Legacy fields remain distinct-vocabulary figures; new consumers use coverage. */
export async function analyzeText(
  text: string, language: string, snapshot?: KnowledgeSnapshot,
): Promise<TextAnalysis> {
  const [document, knowledge] = await Promise.all([
    tokenizeLexicalText(text, language), snapshot ?? loadKnowledgeSnapshot(language),
  ]);
  const coverage = analyzeLexicalCoverage(document, knowledge);
  const knownPercentage = Math.round(coverage.distinct.familiarPercentage ?? 0);

  // Find unknown words that are high-frequency (top 500) — worth learning
  const unknownHighFrequency = [...coverage.unknownWords]
    .filter((w) => {
      const rank = getFrequencyRank(w, knowledge.language);
      const tier = getFrequencyTier(rank);
      return tier === 'essential' || tier === 'common';
    })
    .sort((a, b) => {
      const ra = getFrequencyRank(a, knowledge.language) ?? Infinity;
      const rb = getFrequencyRank(b, knowledge.language) ?? Infinity;
      return ra - rb;
    });

  return {
    totalWords: coverage.occurrences.total,
    uniqueWords: coverage.distinct.total,
    knownWords: coverage.distinct.familiar,
    knownPercentage,
    comprehensionLevel: getComprehensionLevel(knownPercentage),
    unknownHighFrequency,
    coverage,
  };
}

/** Familiar normalized lexical entries; saving alone is not knowledge. */
export async function getKnownWordSet(language: string): Promise<Set<string>> {
  const snapshot = await loadKnowledgeSnapshot(language);
  return new Set(snapshot.entries.filter((entry) => entry.familiar).map((entry) => entry.key));
}
