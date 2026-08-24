import { describe, expect, it } from 'vitest';
import { LEARNING_PATHS } from '../data/learning-paths';
import { unitLessons } from '../data/learning-paths/shared';
import { ACTIVITY_CAPABILITIES, GUIDED_ACTIVITY_KINDS } from '../lib/activity-capabilities';
import {
  composeComprehensiveLearningPath,
  type CurriculumCatalogEntry,
} from '../lib/curriculum-composition';
import {
  classifyCatalogEntry,
  CURRICULUM_LANGUAGES,
  type CurriculumLanguage,
} from '../lib/curriculum-policy';
import { parseGuidedPracticeQuery } from '../lib/guided-practice';
import { MAX_TEST_OUT_LESSONS } from '../lib/lesson-assessment-limits';
import { resolveLearningPath } from '../lib/learning-path';
import type {
  ArabicDialect,
  LearningPathActivityRef,
  LearningPathLessonRef,
} from '../types/learning-path';

const GRAMMAR_INDEXES = import.meta.glob(
  '../../public/content/grammar/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, CurriculumCatalogEntry[]>;
const VOCAB_INDEXES = import.meta.glob(
  '../../public/content/vocab/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, CurriculumCatalogEntry[]>;

const EXPECTED_CORE_COUNTS = {
  ja: { grammar: 50, vocab: 60, enrichment: 129 },
  ru: { grammar: 47, vocab: 70, enrichment: 0 },
  ar: { grammar: 166, vocab: 135, enrichment: 67 },
  es: { grammar: 55, vocab: 63, enrichment: 0 },
  pt: { grammar: 38, vocab: 41, enrichment: 0 },
  ro: { grammar: 50, vocab: 67, enrichment: 0 },
} as const;

function indexFor(
  indexes: Record<string, CurriculumCatalogEntry[]>,
  language: CurriculumLanguage,
): CurriculumCatalogEntry[] {
  const match = Object.entries(indexes).find(([path]) =>
    path.endsWith(`/${language}/index.json`),
  );
  if (!match) throw new Error(`Missing ${language} catalog`);
  return match[1];
}

function catalogs(language: CurriculumLanguage) {
  return {
    grammar: indexFor(GRAMMAR_INDEXES, language),
    vocab: indexFor(VOCAB_INDEXES, language),
  };
}

function milestones(language: CurriculumLanguage, dialect?: ArabicDialect) {
  const composed = composeComprehensiveLearningPath(
    LEARNING_PATHS[language],
    catalogs(language),
    language === 'ar'
      ? { colloquialFocus: dialect != null, currentDialect: dialect ?? null }
      : undefined,
  );
  return [
    ...(composed.letterUnitLessons ?? []),
    ...composed.units.flatMap(unitLessons),
  ];
}

function lessonRefs(
  language: CurriculumLanguage,
  dialect?: ArabicDialect,
): LearningPathLessonRef[] {
  return milestones(language, dialect).filter(
    (item): item is LearningPathLessonRef =>
      item.kind === 'grammar' || item.kind === 'vocab',
  );
}

describe('comprehensive curriculum composition', () => {
  it.each(CURRICULUM_LANGUAGES)(
    'includes every %s catalog lesson exactly once',
    (language) => {
      const refs = lessonRefs(language);
      const keys = refs.map((ref) => `${ref.kind}:${ref.lessonId}`);
      const expected = [
        ...catalogs(language).grammar.map((entry) => `grammar:${entry.id}`),
        ...catalogs(language).vocab.map((entry) => `vocab:${entry.id}`),
      ];

      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.sort()).toEqual(expected.sort());
    },
  );

  it.each(Object.entries(EXPECTED_CORE_COUNTS))(
    '%s has the exact required core and enrichment counts',
    (language, expected) => {
      const refs = lessonRefs(language as CurriculumLanguage);
      expect(
        refs.filter(
          (ref) => ref.kind === 'grammar' && ref.requirement !== 'enrichment',
        ),
      ).toHaveLength(expected.grammar);
      expect(
        refs.filter(
          (ref) => ref.kind === 'vocab' && ref.requirement !== 'enrichment',
        ),
      ).toHaveLength(expected.vocab);
      expect(
        refs.filter((ref) => ref.requirement === 'enrichment'),
      ).toHaveLength(expected.enrichment);
    },
  );

  it('keeps Arabic MSA core required and dialect material optional by default', () => {
    const refs = lessonRefs('ar');
    const byKey = new Map(
      refs.map((ref) => [`${ref.kind}:${ref.lessonId}`, ref]),
    );

    for (const kind of ['grammar', 'vocab'] as const) {
      for (const entry of catalogs('ar')[kind]) {
        const classification = classifyCatalogEntry('ar', kind, entry);
        expect(byKey.get(`${kind}:${entry.id}`)?.requirement ?? 'required').toBe(
          classification.requirement,
        );
      }
    }
  });

  it('moves only the selected Arabic spoken strand into required work', () => {
    const egyptian = lessonRefs('ar', 'egyptian');
    const levantine = lessonRefs('ar', 'levantine');
    const egyptianByKey = new Map(
      egyptian.map((ref) => [`${ref.kind}:${ref.lessonId}`, ref]),
    );
    const levantineByKey = new Map(
      levantine.map((ref) => [`${ref.kind}:${ref.lessonId}`, ref]),
    );

    for (const kind of ['grammar', 'vocab'] as const) {
      for (const entry of catalogs('ar')[kind]) {
        const classification = classifyCatalogEntry('ar', kind, entry);
        const key = `${kind}:${entry.id}`;
        if (classification.requirement === 'required') {
          expect(egyptianByKey.get(key)?.requirement ?? 'required').toBe('required');
          expect(levantineByKey.get(key)?.requirement ?? 'required').toBe('required');
        } else if (
          classification.dialects === 'shared' ||
          classification.dialects?.includes('egyptian')
        ) {
          expect(egyptianByKey.get(key)?.requirement).toBe('required');
        } else {
          expect(egyptianByKey.get(key)?.requirement).toBe('enrichment');
        }
      }
    }

    expect([...egyptianByKey.keys()].sort()).toEqual(
      [...levantineByKey.keys()].sort(),
    );
  });

  it.each([
    'egyptian',
    'levantine',
    'gulf',
    'maghrebi',
    'iraqi',
  ] satisfies ArabicDialect[])(
    'requires shared and %s Arabic material while leaving other dialects optional',
    (dialect) => {
      const refs = lessonRefs('ar', dialect);
      const byKey = new Map(
        refs.map((ref) => [`${ref.kind}:${ref.lessonId}`, ref]),
      );

      for (const kind of ['grammar', 'vocab'] as const) {
        for (const entry of catalogs('ar')[kind]) {
          const classification = classifyCatalogEntry('ar', kind, entry);
          const selected =
            classification.requirement === 'required' ||
            classification.dialects === 'shared' ||
            classification.dialects?.includes(dialect);
          expect(
            byKey.get(`${kind}:${entry.id}`)?.requirement ?? 'required',
          ).toBe(selected ? 'required' : 'enrichment');
        }
      }
    },
  );

  it('keeps Iraqi comparison-only and unsupported dialect grammar optional', () => {
    const iraqi = new Map(
      lessonRefs('ar', 'iraqi').map((ref) => [
        `${ref.kind}:${ref.lessonId}`,
        ref,
      ]),
    );

    expect(iraqi.get('grammar:dialect-future-continuous')?.requirement).toBe(
      'required',
    );
    for (const lessonId of [
      'msa-vs-dialects',
      'dialect-comparison',
      'dialect-pronouns-verbs',
      'dialect-negation',
    ]) {
      expect(iraqi.get(`grammar:${lessonId}`)?.requirement).toBe('enrichment');
    }
  });

  it.each(CURRICULUM_LANGUAGES)(
    'recurs every supported %s activity with valid deterministic descriptors',
    (language) => {
      const content = catalogs(language);
      const path = resolveLearningPath(LEARNING_PATHS[language], content, {
        progress: [],
        completedLetters: new Set(),
      });
      const nodes = path.units.flatMap((unit) => unit.nodes);

      for (const kind of GUIDED_ACTIVITY_KINDS) {
        const capability = ACTIVITY_CAPABILITIES[language][kind];
        const activityNodes = nodes.filter((node) => node.kind === kind);
        if (!capability.available) {
          expect(activityNodes, `${language}/${kind}`).toHaveLength(0);
          continue;
        }
        expect(
          activityNodes.length,
          `${language}/${kind}`,
        ).toBeGreaterThanOrEqual(kind === 'letters' ? 1 : 2);
        for (const node of activityNodes) {
          if (kind === 'letters') continue;
          const parsed = parseGuidedPracticeQuery(
            node.route.split('?')[1] ?? '',
            kind,
          );
          expect(parsed.kind).toBe('guided');
          if (parsed.kind === 'guided') {
            expect(parsed.descriptor.session).toEqual(capability.session);
            expect(parsed.descriptor.seed).toBe(
              `${language}/${(node as typeof node & { milestoneId: string }).milestoneId}`,
            );
          }
        }
      }
    },
  );

  it('keeps generated units compact and enrichment reachable without recommending it', () => {
    const language = 'ja';
    const composed = composeComprehensiveLearningPath(
      LEARNING_PATHS[language],
      catalogs(language),
    );
    const generated = composed.units.slice(LEARNING_PATHS[language].units.length);
    expect(generated.every((unit) => unitLessons(unit).length <= 7)).toBe(true);

    const path = resolveLearningPath(LEARNING_PATHS[language], catalogs(language), {
      progress: [],
      completedLetters: new Set(),
    });
    const enrichment = path.units
      .flatMap((unit) => unit.nodes)
      .filter((node) => node.requirement === 'enrichment');
    expect(enrichment.length).toBeGreaterThan(0);
    expect(enrichment.every((node) => node.state === 'available')).toBe(true);
    expect(
      enrichment.some((node) => node.id === path.recommendedNodeId),
    ).toBe(false);
    expect(
      path.testOutOptions.every((checkpoint) =>
        checkpoint.lessonIds.every((lessonId) =>
          lessonRefs(language)
            .filter((ref) => ref.requirement !== 'enrichment')
            .some((ref) => ref.lessonId === lessonId),
        ),
      ),
    ).toBe(true);
    expect(
      path.testOutOptions.every(
        (checkpoint) => checkpoint.lessonCount <= MAX_TEST_OUT_LESSONS,
      ),
    ).toBe(true);
  });

  it.each(CURRICULUM_LANGUAGES)(
    'keeps %s core and enrichment counts separate with one recommendation',
    (language) => {
      const path = resolveLearningPath(
        LEARNING_PATHS[language],
        catalogs(language),
        {
          progress: [],
          completedLetters: new Set(),
        },
      );
      const nodes = path.units.flatMap((unit) => unit.nodes);
      const required = nodes.filter(
        (node) => (node.requirement ?? 'required') === 'required',
      );
      const enrichment = nodes.filter(
        (node) => node.requirement === 'enrichment',
      );
      const recommended = nodes.filter(
        (node) => node.id === path.recommendedNodeId,
      );

      expect(path.completedCount).toBe(0);
      expect(path.totalCount).toBe(required.length);
      expect(path.enrichmentCompletedCount).toBe(0);
      expect(path.enrichmentTotalCount).toBe(enrichment.length);
      expect(recommended).toHaveLength(1);
      expect(recommended[0]).toMatchObject({
        requirement: 'required',
        state: 'available',
      });
      expect(enrichment.every((node) => node.state === 'available')).toBe(true);
    },
  );

  it('uses stable semantic IDs for generated activities', () => {
    const activities = milestones('es').filter(
      (item): item is LearningPathActivityRef =>
        item.kind !== 'grammar' && item.kind !== 'vocab',
    );
    expect(activities.every((item) => item.milestoneId.includes('after-core-'))).toBe(
      true,
    );
    expect(new Set(activities.map((item) => item.milestoneId)).size).toBe(
      activities.length,
    );
  });
});
