import { evidenceHash, type KnowledgeSnapshot } from './knowledge';
import { analyzeLexicalCoverage, type LexicalCoverage } from './lexical-coverage';
import { normalizeLanguage, type LexicalDocument, type LexicalToken } from './lexical';

export interface PracticeCandidate {
  readonly id: string;
  readonly language: string;
  readonly difficulty?: string | number;
  /** Full lexical occurrences, including repetition, or explicit authored targets. */
  readonly vocabulary?: readonly (string | LexicalToken)[];
  /** Prefer a cached full-text document when support-vocabulary fit matters. */
  readonly document?: LexicalDocument;
  /** Same IDs as lessonProgress.lessonId (vocab/... or bare grammar IDs). */
  readonly prerequisites?: readonly string[];
  /** Authored beginner-first order; never inferred from English prompts. */
  readonly order?: number;
}

export interface PracticeSelectionOptions {
  readonly language: string;
  readonly seed: string;
  /** Hard manual bounds. The selector never expands this set or the language. */
  readonly difficulties?: readonly (string | number)[];
  readonly session: { readonly minItems: number; readonly targetItems: number; readonly maxItems: number };
}

export interface RankedPracticeItem {
  readonly id: string;
  readonly score: number;
  readonly coverage: LexicalCoverage | null;
  readonly missingPrerequisites: readonly string[];
}

export interface PracticeSelection {
  readonly language: string;
  readonly seed: string;
  readonly snapshot: KnowledgeSnapshot;
  readonly itemIds: readonly string[];
  readonly items: readonly RankedPracticeItem[];
  readonly eligibleCount: number;
  readonly meetsMinimum: boolean;
  readonly limitedMatch: boolean;
  readonly reasons: readonly string[];
}

function documentFor(candidate: PracticeCandidate, language: string): LexicalDocument | null {
  if (candidate.document) {
    if (normalizeLanguage(candidate.document.language) !== language) {
      throw new Error(`Mismatched practice metadata language: ${candidate.id}`);
    }
    return candidate.document;
  }
  if (!candidate.vocabulary?.length) return null;
  return {
    language, mode: 'surface',
    tokens: candidate.vocabulary.map((word) => typeof word === 'string'
      ? { surface: word, boundaryBefore: true }
      : { ...word, boundaryBefore: word.boundaryBefore ?? true }),
    limitations: ['Coverage uses supplied vocabulary targets, not necessarily every word in the prompt.'],
  };
}

/**
 * Pure bounded ranking, not a due-card scheduler. Persist/retain this result
 * at attempt start; call again only for a new attempt/retry, not on live updates.
 */
export function selectPracticeItems(
  candidates: readonly PracticeCandidate[],
  snapshot: KnowledgeSnapshot,
  options: PracticeSelectionOptions,
): PracticeSelection {
  const language = normalizeLanguage(options.language);
  if (language !== snapshot.language) throw new Error('Practice and knowledge languages must match');
  const { minItems, targetItems, maxItems } = options.session;
  if (![minItems, targetItems, maxItems].every((n) => Number.isSafeInteger(n) && n > 0) ||
    minItems > targetItems || targetItems > maxItems) {
    throw new Error('Invalid practice session bounds');
  }
  const seen = new Set<string>();
  const completed = new Set(snapshot.completedLessonIds);
  const zeroData = snapshot.familiarCount === 0;
  const ranked = candidates.filter((candidate) =>
    normalizeLanguage(candidate.language) === language &&
    (!options.difficulties || (candidate.difficulty !== undefined &&
      options.difficulties.includes(candidate.difficulty))))
    .map((candidate) => {
      if (!candidate.id || seen.has(candidate.id)) throw new Error(`Duplicate/empty practice ID: ${candidate.id}`);
      seen.add(candidate.id);
      const document = documentFor(candidate, language);
      const coverage = document ? analyzeLexicalCoverage(document, snapshot) : null;
      const fraction = coverage?.occurrences.familiarPercentage;
      const missingPrerequisites = Object.freeze(
        (candidate.prerequisites ?? []).filter((id) => !completed.has(id)),
      );
      const total = coverage?.occurrences.total ?? 0;
      const weak = total && coverage
        ? (coverage.occurrences.learning + coverage.occurrences.saved +
          coverage.occurrences.familiar - coverage.occurrences.reviewBacked) / total : 0;
      const beginner = candidate.difficulty === 'beginner' || candidate.difficulty === 'elementary' ||
        candidate.difficulty === 1;
      // 85% is a soft fit target. Weak-word reinforcement is a small tie-break,
      // never enough to make largely unfamiliar material a good lexical match.
      const score = (fraction == null ? 1 : Math.abs(fraction / 100 - 0.85)) +
        Math.min(missingPrerequisites.length, 3) * 0.08 - weak * 0.025 +
        (zeroData && !options.difficulties && !beginner ? 0.2 : 0);
      const item: RankedPracticeItem = Object.freeze({
        id: candidate.id, score, coverage, missingPrerequisites,
      });
      return { item, order: candidate.order ?? Number.MAX_SAFE_INTEGER,
        tie: evidenceHash(`${options.seed}\0${candidate.id}`) };
    });
  ranked.sort((a, b) => a.item.score - b.item.score ||
    (zeroData ? a.order - b.order : 0) ||
    a.tie.localeCompare(b.tie) || a.item.id.localeCompare(b.item.id));
  const selected = ranked.slice(0, targetItems).map(({ item }) => item);
  const reasons: string[] = [];
  if (ranked.length < targetItems) reasons.push('The chosen pool has fewer items than the session target.');
  if (!ranked.length) reasons.push('No items match the selected language and difficulty.');
  if (zeroData) reasons.push('No familiar vocabulary evidence yet; using available introductory material within your filters.');
  if (!snapshot.complete) reasons.push('Some completed vocabulary lesson targets could not be resolved.');
  if (selected.some((item) => item.coverage?.occurrences.familiarPercentage == null)) {
    reasons.push('Some items have missing lexical metadata; their familiarity is unknown.');
  }
  if (selected.some((item) => item.coverage?.mode === 'japanese-fallback')) {
    reasons.push('Some items use approximate Japanese segmentation because the tokenizer was unavailable.');
  }
  if (selected.some((item) => item.missingPrerequisites.length)) {
    reasons.push('Some items reference lessons not yet completed.');
  }
  if (selected.some((item) => {
    const coverage = item.coverage?.occurrences.familiarPercentage;
    return coverage != null && (coverage < 80 || coverage > 90);
  })) reasons.push('The available pool does not closely match the mostly-familiar stretch target.');
  return Object.freeze({
    language, seed: options.seed, snapshot,
    itemIds: Object.freeze(selected.map((item) => item.id)), items: Object.freeze(selected),
    eligibleCount: ranked.length, meetsMinimum: selected.length >= minItems,
    limitedMatch: reasons.length > 0, reasons: Object.freeze(reasons),
  });
}
