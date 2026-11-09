import { type KnowledgeEvidence, type KnowledgeSnapshot, strongerEvidence } from './knowledge';
import { isLexical, normalizeLanguage, normalizeLexeme, type LexicalDocument } from './lexical';

export interface CoverageCounts {
  readonly total: number;
  readonly familiar: number;
  readonly reviewBacked: number;
  readonly learning: number;
  readonly saved: number;
  readonly unknown: number;
  /** null for an empty denominator, never a false 100%. */
  readonly familiarPercentage: number | null;
  readonly reviewBackedPercentage: number | null;
}

export interface LexicalCoverage {
  readonly language: string;
  readonly snapshotRevision: string;
  readonly status: 'ready' | 'empty';
  readonly mode: LexicalDocument['mode'];
  readonly occurrences: CoverageCounts;
  readonly distinct: CoverageCounts;
  readonly unknownWords: readonly string[];
  readonly complete: boolean;
  readonly limitations: readonly string[];
}

function counts(evidence: readonly KnowledgeEvidence[]): CoverageCounts {
  const total = evidence.length;
  const familiar = evidence.filter((entry) => entry.familiar).length;
  const reviewBacked = evidence.filter((entry) => entry.reviewBacked).length;
  return Object.freeze({
    total, familiar, reviewBacked,
    learning: evidence.filter((entry) => !entry.familiar && entry.state === 'learning').length,
    saved: evidence.filter((entry) => !entry.familiar && entry.state === 'saved').length,
    unknown: evidence.filter((entry) => entry.state === 'unknown').length,
    familiarPercentage: total ? 100 * familiar / total : null,
    reviewBackedPercentage: total ? 100 * reviewBacked / total : null,
  });
}

/** Pure; re-analyze a cached document against a new snapshot without re-tokenizing. */
export function analyzeLexicalCoverage(
  document: LexicalDocument,
  snapshot: KnowledgeSnapshot,
): LexicalCoverage {
  if (normalizeLanguage(document.language) !== snapshot.language) {
    throw new Error('Text and knowledge languages must match');
  }
  const lang = snapshot.language;
  const tokens = document.tokens.filter((token) => isLexical(token.surface));
  const evidence = tokens.map((token) => snapshot.getEvidence(token.surface, token.lemma));
  // Match explicit multi-token targets only in their complete local context.
  // Knowing "good morning" must not independently certify "good".
  const separator = lang === 'ja' ? '' : ' ';
  const phraseKeys = snapshot.entries.filter((entry) =>
    lang === 'ja' || entry.key.includes(' '));
  const maxLength = phraseKeys.reduce((max, entry) => Math.max(max, entry.key.length), 0);
  for (let start = 0; start < tokens.length && maxLength > 0; start++) {
    let surface = '';
    let lemma = '';
    for (let end = start; end < tokens.length; end++) {
      if (end > start && tokens[end].boundaryBefore) break;
      const prefix = end === start ? '' : separator;
      surface += prefix + normalizeLexeme(tokens[end].surface, lang);
      lemma += prefix + normalizeLexeme(tokens[end].lemma ?? tokens[end].surface, lang);
      if (Math.min(surface.length, lemma.length) > maxLength) break;
      if (end === start) continue;
      const match = snapshot.getEvidence(surface, lemma);
      if (match.state === 'unknown') continue;
      for (let i = start; i <= end; i++) evidence[i] = strongerEvidence(evidence[i], match);
    }
  }
  // A distinct type counts as covered only if every occurrence is covered;
  // phrase-local evidence must not hide an unknown standalone occurrence.
  const distinct = new Map<string, KnowledgeEvidence>();
  tokens.forEach((token, index) => {
    const key = normalizeLexeme(token.lemma ?? token.surface, lang);
    const previous = distinct.get(key);
    const current = evidence[index];
    distinct.set(key, previous && strongerEvidence(previous, current) !== previous
      ? previous : current);
  });
  const missing = snapshot.missingLessonIds.length
    ? [`Unresolved completed vocabulary lessons: ${snapshot.missingLessonIds.join(', ')}.`] : [];
  return Object.freeze({
    language: lang, snapshotRevision: snapshot.revision,
    status: tokens.length ? 'ready' : 'empty', mode: document.mode,
    occurrences: counts(evidence), distinct: counts([...distinct.values()]),
    unknownWords: Object.freeze([...distinct].filter(([, entry]) => !entry.familiar).map(([key]) => key)),
    complete: snapshot.complete,
    limitations: Object.freeze([...document.limitations, ...missing]),
  });
}
