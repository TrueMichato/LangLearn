import type { LegacyGrammarAlias, LessonReviewItem } from '../../lib/lesson-review';
import baselineJson from '../fixtures/arabic-grammar-reviewed-baseline.json';
import legacyJson from '../fixtures/grammar-retention-legacy.json';

export interface GrammarRetirement {
  reason: string;
  replacements: readonly string[];
  identities: readonly LegacyGrammarAlias[];
}

export type GrammarRetirements = Readonly<Record<string, GrammarRetirement>>;

// Test-side source retirements only. Saved learner cards are never deleted or
// adopted by the replacements; only these exact shipped wording pairs retire.
export const GRAMMAR_RETIREMENTS: GrammarRetirements = {
  'ar/broken-plural-patterns/plural-shape-recognition': {
    reason: 'The front asks for a lesson-specific list of example words rather than a bounded pattern task; retain existing plural analysis and production.',
    replacements: ['plural-predictability', 'rule-broken-plural-internal', 'books-plural'],
    identities: [{
      rule: 'Plural templates are recognition aids, not lexical words.',
      example: 'Which taught examples illustrate أَفْعَالٌ, فُعُولٌ and فِعَالٌ respectively?',
    }],
  },
  'ar/form-x/x-meaning-range': {
    reason: 'The open-ended meaning inventory is a whole-list task; specific seeking and considering applications plus prefix recall provide bounded coverage.',
    replacements: ['x-seeking', 'x-considering', 'rule-form-x-prefix'],
    identities: [{
      rule: 'Seeking is only one common Form X meaning.',
      example: 'Beyond requesting something, what other meaning types are illustrated by Form X here?',
    }],
  },
  'ar/predicate-types/predicate-inventory': {
    reason: 'The four-category list conflicts with the traditional three-type rule; bounded predicate analysis and recall already cover it.',
    replacements: ['phrase-predicate', 'verbal-predicate', 'sentence-link', 'rule-semi-sentence', 'rule-sentence-predicate-link'],
    identities: [{
      rule: 'A predicate can be non-clausal, a clause, or a semi-sentence.',
      example: 'Which four predicate types does this lesson distinguish?',
    }],
  },
  'ar/iraab-practice/reading-checklist': {
    reason: 'The five-step reading procedure is a lesson aid rather than one retrievable rule; retain the prose and bounded case-analysis targets.',
    replacements: [
      'preposition-government', 'inna-noun-change', 'subject-case', 'object-case',
      'idafa-internal-case', 'past-fixed-ending', 'prepositional-predicate',
      'rule-preposition-genitive', 'rule-idafa-second-noun',
    ],
    identities: [{
      rule: 'A role-first reading procedure is more reliable than reading every ending in isolation.',
      example: 'What sequence of checks does the walkthrough recommend for explaining endings?',
    }],
  },
  'ar/plural-paucity-abundance/abundance-pattern-set': {
    reason: 'An arbitrary list of three examples depends on the open lesson; one contextual pattern analysis plus existing lexical and quantity targets replaces list recitation.',
    replacements: [
      'abundance-months-pattern', 'vocab-shuhur', 'vocab-kilab',
      'rule-abundance-meaning', 'context-not-fixed-count',
    ],
    identities: [{
      rule: 'Abundance has more patterns than the four common paucity patterns.',
      example: 'Which three abundance-pattern examples are listed here?',
    }],
  },
};

const snapshot = baselineJson as {
  lessons: Record<string, { items: Record<string, { identities: string[][] }> }>;
};
const legacySnapshot = legacyJson as {
  lessons: Record<string, {
    authoredIds: string[];
    grammarPairs: (LegacyGrammarAlias & { authoredId?: string })[];
  }>;
};
const pairKey = (pair: LegacyGrammarAlias) => JSON.stringify([pair.rule, pair.example]);

function shippedIdentities(language: string, lessonId: string, itemId: string): string[][] | undefined {
  const legacy = legacySnapshot.lessons[`${language}/${lessonId}`];
  if (legacy?.authoredIds.includes(itemId)) {
    return legacy.grammarPairs.filter((pair) => pair.authoredId === itemId)
      .map((pair) => [pair.rule, pair.example]);
  }
  // The older shared snapshot predates all five Arabic retired authored IDs.
  // Preserve their exact frozen Arabic evidence, never infer it from live cards.
  return language === 'ar' ? snapshot.lessons[lessonId]?.items[itemId]?.identities : undefined;
}

export function validateRetirementRecords(records: GrammarRetirements = GRAMMAR_RETIREMENTS): string[] {
  return Object.entries(records).flatMap(([key, entry]) => {
    const [language, lessonId, itemId, extra] = key.split('/');
    const original = !extra ? shippedIdentities(language, lessonId, itemId) : undefined;
    const expected = original?.map((pair) => JSON.stringify(pair)).sort();
    const actual = entry.identities.map(pairKey).sort();
    return [
      ...(!original?.length ? [`${key}: retirement key is not a grammar identity in the frozen shipped snapshot`] : []),
      ...(!entry.reason.trim() ? [`${key}: retirement reason must be nonempty`] : []),
      ...(!entry.replacements.length || new Set(entry.replacements).size !== entry.replacements.length ||
        entry.replacements.some((id) => !id.trim() || id === itemId)
        ? [`${key}: retirement requires distinct replacement IDs`] : []),
      ...(JSON.stringify(actual) !== JSON.stringify(expected)
        ? [`${key}: retirement identities must match the exact frozen shipped pairs`] : []),
    ];
  });
}

export function lessonRetirements(
  lessonKey: string,
  records: GrammarRetirements = GRAMMAR_RETIREMENTS,
): [string, GrammarRetirement][] {
  return Object.entries(records)
    .filter(([key]) => key.slice(0, key.lastIndexOf('/')) === lessonKey)
    .map(([key, entry]) => [key.slice(key.lastIndexOf('/') + 1), entry]);
}

export function validateGrammarRetirements(
  lessonKey: string,
  items: readonly LessonReviewItem[],
  records: GrammarRetirements = GRAMMAR_RETIREMENTS,
): string[] {
  const entries = lessonRetirements(lessonKey, records);
  const errors = validateRetirementRecords(Object.fromEntries(entries.map(([id, entry]) => [`${lessonKey}/${id}`, entry])));
  for (const [id, entry] of entries) {
    if (items.some((item) => item.id === id)) errors.push(`${id}: retired source reappeared`);
    for (const replacement of entry.replacements) {
      if (!items.some((item) => item.id === replacement && item.provenance === 'authored')) {
        errors.push(`${id}: missing retirement replacement "${replacement}"`);
      }
    }
    const retiredPairs = new Set(entry.identities.map(pairKey));
    for (const item of items) {
      if (item.kind === 'vocabulary') continue;
      const pairs = [{ rule: item.rule, example: item.prompt }, ...item.legacyAliases];
      if (pairs.some((pair) => retiredPairs.has(pairKey(pair)))) {
        errors.push(`${id}: retired identity transferred to "${item.id}"`);
      }
    }
  }
  return errors;
}
