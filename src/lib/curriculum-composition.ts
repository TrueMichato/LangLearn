import {
  activity,
  defineLearningPath,
  grammar,
  unitLessons,
  vocab,
} from '../data/learning-paths/shared';
import type {
  ArabicLearningPathPolicy,
  LearningPathActivityKind,
  LearningPathLessonKind,
  LearningPathLessonRef,
  LearningPathManifest,
  LearningPathMilestoneRef,
  LearningPathRequirement,
  LearningPathUnitManifest,
} from '../types/learning-path';
import {
  ACTIVITY_CAPABILITIES,
  GUIDED_ACTIVITY_KINDS,
} from './activity-capabilities';
import { getDialectInfo } from './arabic-dialects';
import {
  classifyCatalogEntry,
  CURRICULUM_LANGUAGES,
  type CatalogClassification,
  type CatalogPolicyEntry,
  type CurriculumLanguage,
} from './curriculum-policy';

export interface CurriculumCatalogEntry extends CatalogPolicyEntry {
  title: string;
}

export interface CurriculumCatalogs {
  grammar: CurriculumCatalogEntry[];
  vocab: CurriculumCatalogEntry[];
}

interface ClassifiedLesson {
  kind: LearningPathLessonKind;
  entry: CurriculumCatalogEntry;
  classification: CatalogClassification;
  requirement: LearningPathRequirement;
  spoken: boolean;
  normalizedOrder: number;
}

const CORE_BATCH_SIZE = 5;
const ENRICHMENT_BATCH_SIZE = 6;
const SPOKEN_BATCH_SIZE = 4;
const ACTIVITIES_PER_CORE_UNIT = 2;

function isCurriculumLanguage(language: string): language is CurriculumLanguage {
  return (CURRICULUM_LANGUAGES as readonly string[]).includes(language);
}

function lessonKey(kind: LearningPathLessonKind, lessonId: string): string {
  return `${kind}:${lessonId}`;
}

function selectedDialectRequirement(
  language: CurriculumLanguage,
  classification: CatalogClassification,
  policy: ArabicLearningPathPolicy | undefined,
): { requirement: LearningPathRequirement; spoken: boolean } {
  if (
    language !== 'ar' ||
    !policy?.colloquialFocus ||
    policy.currentDialect == null ||
    classification.requirement !== 'enrichment'
  ) {
    return { requirement: classification.requirement, spoken: false };
  }
  const selected =
    classification.dialects === 'shared' ||
    classification.dialects?.includes(policy.currentDialect);
  return selected
    ? { requirement: 'required', spoken: true }
    : { requirement: 'enrichment', spoken: false };
}

function classifyCatalog(
  language: CurriculumLanguage,
  catalogs: CurriculumCatalogs,
  policy: ArabicLearningPathPolicy | undefined,
): ClassifiedLesson[] {
  return (['grammar', 'vocab'] as const).flatMap((kind) =>
    catalogs[kind].map((entry, index) => {
      const classification = classifyCatalogEntry(language, kind, entry);
      const selected = selectedDialectRequirement(
        language,
        classification,
        policy,
      );
      return {
        kind,
        entry,
        classification,
        ...selected,
        normalizedOrder: (index + 1) / Math.max(1, catalogs[kind].length),
      };
    }),
  );
}

function interleaveByCatalogProgress(
  lessons: readonly ClassifiedLesson[],
): ClassifiedLesson[] {
  return [...lessons].sort(
    (left, right) =>
      left.normalizedOrder - right.normalizedOrder ||
      (left.kind === right.kind
        ? 0
        : left.kind === 'grammar'
          ? -1
          : 1),
  );
}

function toLessonRef(lesson: ClassifiedLesson): LearningPathLessonRef {
  const ref =
    lesson.kind === 'grammar'
      ? grammar(lesson.entry.id)
      : vocab(lesson.entry.id);
  return { ...ref, requirement: lesson.requirement };
}

function batches<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generatedUnitId(
  prefix: string,
  lessons: readonly ClassifiedLesson[],
): string {
  const first = lessons[0];
  const last = lessons[lessons.length - 1];
  return `${prefix}-${first.kind}-${slug(first.entry.id)}-to-${last.kind}-${slug(last.entry.id)}`;
}

function availablePracticeKinds(
  language: CurriculumLanguage,
): LearningPathActivityKind[] {
  return GUIDED_ACTIVITY_KINDS.filter(
    (kind) =>
      kind !== 'letters' && ACTIVITY_CAPABILITIES[language][kind].available,
  );
}

function practiceRefsForUnit(
  language: CurriculumLanguage,
  unitId: string,
  unitIndex: number,
): LearningPathMilestoneRef[] {
  const kinds = availablePracticeKinds(language);
  return Array.from({ length: ACTIVITIES_PER_CORE_UNIT }, (_, offset) => {
    const kind = kinds[(unitIndex * ACTIVITIES_PER_CORE_UNIT + offset) % kinds.length];
    const capability = ACTIVITY_CAPABILITIES[language][kind];
    return activity(
      kind,
      `after-${slug(unitId)}`,
      capability.label,
      capability.route,
      capability.session,
    );
  });
}

function coreUnits(
  language: CurriculumLanguage,
  lessons: readonly ClassifiedLesson[],
): LearningPathUnitManifest[] {
  return batches(lessons, CORE_BATCH_SIZE).map((batch, index) => {
    const id = generatedUnitId('core', batch);
    const firstTitle = batch[0].entry.title;
    return {
      id,
      title: `Build on ${firstTitle}`,
      description:
        'Alternate lesson work with a short guided practice session.',
      lessons: [
        ...batch.map(toLessonRef),
        ...practiceRefsForUnit(language, id, index),
      ],
    };
  });
}

function attachSpokenArabicStrands(
  units: LearningPathUnitManifest[],
  spokenLessons: readonly ClassifiedLesson[],
  dialect: ArabicLearningPathPolicy['currentDialect'],
): LearningPathUnitManifest[] {
  const spokenBatches = batches(spokenLessons, SPOKEN_BATCH_SIZE);
  const dialectName =
    (dialect && getDialectInfo(dialect)?.name) ?? dialect ?? 'Arabic';
  if (spokenBatches.length === 0) return units;
  if (spokenBatches.length > units.length) {
    throw new Error('Arabic spoken strand has no core unit to run alongside');
  }
  return units.map((unit, index) => {
    const spoken = spokenBatches[index];
    if (!spoken || unit.strands) return unit;
    return {
      id: unit.id,
      title: unit.title,
      description: unit.description,
      strands: [
        {
          id: 'msa-core',
          title: 'MSA core',
          description: 'Keep building the shared written foundation.',
          lessons: unit.lessons,
        },
        {
          id: `spoken-${dialect}`,
          title: `Spoken ${dialectName}`,
          description:
            'Build the selected spoken variety alongside the shared core.',
          lessons: spoken.map(toLessonRef),
        },
      ],
    };
  });
}

function enrichmentUnits(
  lessons: readonly ClassifiedLesson[],
): LearningPathUnitManifest[] {
  return batches(lessons, ENRICHMENT_BATCH_SIZE).map((batch) => ({
    id: generatedUnitId('enrichment', batch),
    title: `Explore ${batch[0].entry.title}`,
    description:
      'Optional reference material that stays available without blocking the core path.',
    lessons: batch.map(toLessonRef),
  }));
}

export function composeComprehensiveLearningPath(
  manifest: LearningPathManifest,
  catalogs: CurriculumCatalogs,
  policy?: ArabicLearningPathPolicy,
): LearningPathManifest {
  if (!isCurriculumLanguage(manifest.language)) return manifest;

  const authoredKeys = new Set(
    [
      ...(manifest.letterUnitLessons ?? []),
      ...manifest.units.flatMap(unitLessons),
    ]
      .filter(
        (item): item is LearningPathLessonRef =>
          item.kind === 'grammar' || item.kind === 'vocab',
      )
      .map((item) => lessonKey(item.kind, item.lessonId)),
  );
  const classified = classifyCatalog(
    manifest.language,
    catalogs,
    policy,
  ).filter(
    (lesson) => !authoredKeys.has(lessonKey(lesson.kind, lesson.entry.id)),
  );
  const requiredCore = interleaveByCatalogProgress(
    classified.filter(
      (lesson) => lesson.requirement === 'required' && !lesson.spoken,
    ),
  );
  const spoken = interleaveByCatalogProgress(
    classified.filter((lesson) => lesson.spoken),
  );
  const enrichment = interleaveByCatalogProgress(
    classified.filter((lesson) => lesson.requirement === 'enrichment'),
  );

  let generatedCore = coreUnits(manifest.language, requiredCore);
  if (
    manifest.language === 'ar' &&
    policy?.colloquialFocus &&
    policy.currentDialect
  ) {
    generatedCore = attachSpokenArabicStrands(
      generatedCore,
      spoken,
      policy.currentDialect,
    );
  }

  return defineLearningPath({
    ...manifest,
    units: [
      ...manifest.units,
      ...generatedCore,
      ...enrichmentUnits(enrichment),
    ],
  });
}
