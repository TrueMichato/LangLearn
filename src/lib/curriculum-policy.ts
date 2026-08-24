import type {
  ArabicDialect,
  LearningPathLessonKind,
  LearningPathRequirement,
} from '../types/learning-path';

export const CURRICULUM_LANGUAGES = ['ja', 'ru', 'ar', 'es', 'pt', 'ro'] as const;
export type CurriculumLanguage = (typeof CURRICULUM_LANGUAGES)[number];

export interface CatalogPolicyEntry {
  id: string;
  source?: string;
  group?: string;
  dialect?: string;
}

export interface CatalogClassification {
  requirement: LearningPathRequirement;
  dialects?: readonly ArabicDialect[] | 'shared';
}

/**
 * The canonical Japanese course predates the grouped reference catalogs.
 * Keeping the exact ids here makes additions fail closed instead of silently
 * putting a reference lesson on the required path.
 */
export const JA_CORE_GRAMMAR_IDS = new Set([
  'particles',
  'verb-forms',
  'adjectives',
  'counters',
  'giving-receiving',
  'potential',
  'conditional',
  'passive',
  'causative',
  'honorific',
  'relative-clauses',
  'desire',
  'quoting',
  'comparatives',
  'time-expressions',
  'conjunctions',
  'sentence-particles',
  'patterns',
  'transitive-intransitive',
  'nominalizers',
  'volitional',
  'imperative',
  'hearsay',
  'temo',
  'compound-verbs',
  'te-form-uses',
  'permission-prohibition',
  'obligation',
  'try-attempt',
  'become-change',
  'giving-actions',
  'purpose',
  'while-during',
  'respect-humble',
  'formal-written',
  'tofugu-particle-wa',
  'tofugu-particle-ga',
  'tofugu-particle-wo',
  'tofugu-particle-ni',
  'tofugu-particle-de',
  'tofugu-particle-he',
  'tofugu-particle-to',
  'tofugu-particle-mo',
  'tofugu-particle-ka',
  'tofugu-particle-ne',
  'tofugu-particle-yo',
  'tofugu-particle-yone',
  'tofugu-particle-ya',
  'tofugu-particle-no-noun-modifier',
  'tofugu-particle-no-nominalizer',
]);

/** Exact dialect applicability for Arabic colloquial grammar. */
export const AR_DIALECT_GRAMMAR: Readonly<
  Record<string, readonly ArabicDialect[] | 'shared'>
> = {
  'msa-vs-dialects': [],
  'egyptian-basics': ['egyptian'],
  'levantine-basics': ['levantine'],
  'gulf-basics': ['gulf'],
  'everyday-phrases': 'shared',
  'maghrebi-basics': ['maghrebi'],
  'dialect-pronouns-verbs': ['egyptian', 'levantine', 'maghrebi'],
  'dialect-negation': ['egyptian', 'levantine', 'gulf', 'maghrebi'],
  'dialect-future-continuous': ['egyptian', 'levantine', 'iraqi'],
  'arabizi-chat': [],
  'dialect-comparison': [],
  'dialect-object-pronouns': ['egyptian', 'levantine', 'gulf', 'maghrebi'],
  'dialect-question-words': ['egyptian', 'levantine'],
  'dialect-verb-conjugation': ['egyptian', 'levantine'],
  'dialect-there-is': 'shared',
  'dialect-demonstratives': 'shared',
  'dialect-genitive-markers': 'shared',
  'dialect-want-verbs': 'shared',
  'dialect-ability-verbs': 'shared',
  'dialect-go-verbs': 'shared',
};

const ARABIC_DIALECTS = new Set<ArabicDialect>([
  'egyptian',
  'levantine',
  'gulf',
  'maghrebi',
  'iraqi',
]);

export function classifyCatalogEntry(
  language: CurriculumLanguage,
  kind: LearningPathLessonKind,
  entry: CatalogPolicyEntry,
): CatalogClassification {
  if (language === 'ja' && kind === 'grammar') {
    if (JA_CORE_GRAMMAR_IDS.has(entry.id)) return { requirement: 'required' };
    if (entry.source === 'tofugu' || entry.id.startsWith('taekim-')) {
      return { requirement: 'enrichment' };
    }
    throw new Error(`Unclassified Japanese grammar entry: ${entry.id}`);
  }

  if (language === 'ar' && kind === 'grammar') {
    const dialects = AR_DIALECT_GRAMMAR[entry.id];
    return dialects
      ? { requirement: 'enrichment', dialects }
      : { requirement: 'required' };
  }

  if (language === 'ar' && kind === 'vocab') {
    if (!entry.dialect || entry.dialect === 'msa' || entry.dialect === 'all') {
      return {
        requirement: 'required',
        dialects: entry.dialect === 'all' ? 'shared' : undefined,
      };
    }
    if (!ARABIC_DIALECTS.has(entry.dialect as ArabicDialect)) {
      throw new Error(`Unknown Arabic vocabulary dialect: ${entry.dialect}`);
    }
    return {
      requirement: 'enrichment',
      dialects: [entry.dialect as ArabicDialect],
    };
  }

  return { requirement: 'required' };
}
