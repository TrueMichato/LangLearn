import { activity } from './shared';
import { ACTIVITY_CAPABILITIES } from '../../lib/activity-capabilities';
import type { CurriculumLanguage } from '../../lib/curriculum-policy';
import type { LearningPathActivityRef, LearningPathManifest, LearningPathMilestoneRef } from '../../types/learning-path';

export const CHECKPOINT_PATH_VERSION = 2;

const SOUND_ANCHORS: Record<CurriculumLanguage, string> = {
  ja: 'grammar:particles',
  ru: 'grammar:pronunciation-rules',
  ar: 'grammar:pronunciation',
  es: 'grammar:pronunciation',
  pt: 'grammar:pronunciation',
  ro: 'grammar:pronunciation',
};
const SOUND_CATEGORIES: Record<CurriculumLanguage, string[]> = {
  ja: ['voicing', 'vowel-length'],
  ru: ['hard-soft'],
  ar: ['emphatic', 'throat'],
  es: ['rolled'], // Never require discrimination of Spanish homophones.
  pt: ['open-closed', 'nasal'],
  ro: ['a-vowels', 'diacritic-consonants'],
};
const SENTENCE_ANCHORS: Record<CurriculumLanguage, string> = {
  ja: 'grammar:particles',
  ru: 'grammar:cases',
  ar: 'grammar:nominal-sentence',
  es: 'grammar:ser-estar',
  pt: 'grammar:ser-estar',
  ro: 'grammar:present-a-fi-avea',
};
const SENTENCE_IDS: Record<CurriculumLanguage, number[]> = {
  ja: [1, 2, 3, 4, 5],
  ru: [1, 2, 6, 7, 8],
  ar: [1, 2, 3, 8, 12],
  es: [1, 3, 6, 7, 8],
  pt: [1, 4, 5, 9, 13],
  ro: [1, 4, 7, 9, 10],
};

/** Add only the missing foundation practice; retain all established activity IDs. */
export function withFoundationCheckpoints(manifest: LearningPathManifest): LearningPathManifest {
  const language = manifest.language as CurriculumLanguage;
  if (!SOUND_ANCHORS[language]) return manifest;
  const after = new Map<string, LearningPathActivityRef[]>();
  const existing = new Set(manifest.units.flatMap((unit) =>
    unit.strands ? unit.strands.flatMap((strand) => strand.lessons) : unit.lessons)
    .map((node) => 'milestoneId' in node ? node.milestoneId : `${node.kind}:${node.lessonId}`));
  const add = (anchor: string, node: LearningPathActivityRef) => {
    if (existing.has(node.milestoneId)) return;
    after.set(anchor, [...(after.get(anchor) ?? []), {
      ...node, introducedIn: CHECKPOINT_PATH_VERSION, prerequisites: [anchor],
    }]);
  };
  const sounds = ACTIVITY_CAPABILITIES[language]['minimal-pairs'];
  add(SOUND_ANCHORS[language], {
    ...activity('minimal-pairs', `foundation-sounds-after-${SOUND_ANCHORS[language].replace(':', '-')}-v2`, 'Hear the sounds you just learned',
      sounds.route, { minItems: 5, targetItems: 5, maxItems: 5 }),
    scope: { categories: SOUND_CATEGORIES[language] },
  });
  const sentences = ACTIVITY_CAPABILITIES[language].sentence;
  add(SENTENCE_ANCHORS[language], {
    ...activity('sentence', `foundation-sentences-after-${SENTENCE_ANCHORS[language].replace(':', '-')}-v2`, 'Put your foundations into sentences',
      sentences.route, { minItems: 5, targetItems: 5, maxItems: 5 }),
    scope: {
      difficulty: 'easy',
      itemIds: SENTENCE_IDS[language].map((id) => `${language}-e${String(id).padStart(2, '0')}`),
    },
  });
  if (language === 'ar') {
    add('vocab:numbers-1-20', {
      ...activity('numbers', 'first-numbers-after-vocab-numbers-1-20-v2', 'Recognize your first numbers',
        ACTIVITY_CAPABILITIES.ar.numbers.route, { minItems: 5, targetItems: 5, maxItems: 5 }),
      scope: { ranges: ['ones', 'teens', 'tens'],
        itemIds: Array.from({ length: 20 }, (_, index) => String(index + 1)),
        task: 'numeral-to-word' },
    });
  }
  const insert = (lessons: LearningPathMilestoneRef[]) =>
    lessons.flatMap((lesson) => [lesson, ...(after.get(`${lesson.kind}:${lesson.lessonId}`) ?? [])]);
  return {
    ...manifest,
    units: manifest.units.map((unit) => unit.strands
      ? { ...unit, strands: unit.strands.map((strand) => ({ ...strand, lessons: insert(strand.lessons) })) }
      : { ...unit, lessons: insert(unit.lessons) }),
  };
}
