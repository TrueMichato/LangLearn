import { ACTIVITY_CAPABILITIES } from './activity-capabilities';
import {
  CURRICULUM_LANGUAGES,
  type CurriculumLanguage,
} from './curriculum-policy';
import type {
  LearningPathActivityKind,
  LearningPathActivityRef,
  LearningPathSessionBounds,
} from '../types/learning-path';

export const GUIDED_MILESTONE_QUERY_PARAM = 'guided';
export const GUIDED_LANGUAGE_QUERY_PARAM = 'guidedLanguage';
export const GUIDED_MIN_ITEMS_QUERY_PARAM = 'guidedMin';
export const GUIDED_TARGET_ITEMS_QUERY_PARAM = 'guidedTarget';
export const GUIDED_MAX_ITEMS_QUERY_PARAM = 'guidedMax';

const GUIDED_PARAMS = [
  GUIDED_MILESTONE_QUERY_PARAM,
  GUIDED_LANGUAGE_QUERY_PARAM,
  GUIDED_MIN_ITEMS_QUERY_PARAM,
  GUIDED_TARGET_ITEMS_QUERY_PARAM,
  GUIDED_MAX_ITEMS_QUERY_PARAM,
] as const;

export interface GuidedPracticeDescriptor {
  activity: LearningPathActivityKind;
  milestoneId: string;
  language: CurriculumLanguage;
  session: LearningPathSessionBounds;
  seed: string;
}

export type GuidedPracticeQuery =
  | { kind: 'standalone' }
  | { kind: 'invalid'; message: string }
  | { kind: 'guided'; descriptor: GuidedPracticeDescriptor };

function isCurriculumLanguage(value: string): value is CurriculumLanguage {
  return (CURRICULUM_LANGUAGES as readonly string[]).includes(value);
}

function parsePositiveInteger(value: string | null): number | null {
  if (value == null || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function milestonePattern(kind: LearningPathActivityKind): RegExp {
  return new RegExp(`^${kind}:[a-z0-9]+(?:-[a-z0-9]+)*$`);
}

export function guidedActivityRoute(
  milestone: LearningPathActivityRef,
  language: string,
): string {
  if (!isCurriculumLanguage(language)) {
    throw new Error(`Unsupported guided activity language: ${language}`);
  }
  const params = new URLSearchParams(milestone.route.split('?')[1] ?? '');
  params.set(GUIDED_MILESTONE_QUERY_PARAM, milestone.milestoneId);
  params.set(GUIDED_LANGUAGE_QUERY_PARAM, language);
  params.set(GUIDED_MIN_ITEMS_QUERY_PARAM, String(milestone.session.minItems));
  params.set(GUIDED_TARGET_ITEMS_QUERY_PARAM, String(milestone.session.targetItems));
  params.set(GUIDED_MAX_ITEMS_QUERY_PARAM, String(milestone.session.maxItems));
  return `${milestone.route.split('?')[0]}?${params.toString()}`;
}

export function parseGuidedPracticeQuery(
  search: string | URLSearchParams,
  expectedActivity: LearningPathActivityKind,
): GuidedPracticeQuery {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : search;
  const hasGuidedParam = GUIDED_PARAMS.some((name) => params.has(name));
  if (!hasGuidedParam) return { kind: 'standalone' };

  const milestoneId = params.get(GUIDED_MILESTONE_QUERY_PARAM) ?? '';
  const language = params.get(GUIDED_LANGUAGE_QUERY_PARAM) ?? '';
  const minItems = parsePositiveInteger(
    params.get(GUIDED_MIN_ITEMS_QUERY_PARAM),
  );
  const targetItems = parsePositiveInteger(
    params.get(GUIDED_TARGET_ITEMS_QUERY_PARAM),
  );
  const maxItems = parsePositiveInteger(
    params.get(GUIDED_MAX_ITEMS_QUERY_PARAM),
  );

  if (!milestonePattern(expectedActivity).test(milestoneId)) {
    return {
      kind: 'invalid',
      message:
        'This guided practice link is not valid. Return to your learning path and open the step again.',
    };
  }
  if (!isCurriculumLanguage(language)) {
    return {
      kind: 'invalid',
      message:
        'This guided practice link uses an unsupported language. Return to your learning path and open the step again.',
    };
  }
  if (
    minItems == null ||
    targetItems == null ||
    maxItems == null ||
    minItems > targetItems ||
    targetItems > maxItems
  ) {
    return {
      kind: 'invalid',
      message:
        'This guided practice link has invalid session limits. Return to your learning path and open the step again.',
    };
  }

  const capability = ACTIVITY_CAPABILITIES[language][expectedActivity];
  if (
    !capability.available ||
    minItems !== capability.session.minItems ||
    targetItems !== capability.session.targetItems ||
    maxItems !== capability.session.maxItems
  ) {
    return {
      kind: 'invalid',
      message:
        'This guided practice step is no longer available. Return to your learning path for the current version.',
    };
  }

  return {
    kind: 'guided',
    descriptor: {
      activity: expectedActivity,
      milestoneId,
      language,
      session: { minItems, targetItems, maxItems },
      seed: `${language}/${milestoneId}`,
    },
  };
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const shuffled = [...items];
  const random = createSeededRandom(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function selectGuidedItems<T>(
  items: readonly T[],
  descriptor: GuidedPracticeDescriptor,
  itemKey: (item: T) => string,
): T[] {
  const stableItems = [...items].sort((left, right) =>
    itemKey(left).localeCompare(itemKey(right)),
  );
  return seededShuffle(stableItems, descriptor.seed).slice(
    0,
    Math.min(descriptor.session.targetItems, stableItems.length),
  );
}

export function seededBoolean(seed: string, index: number): boolean {
  return createSeededRandom(`${seed}/${index}`)() >= 0.5;
}

export function validateGuidedCompletion(
  descriptor: GuidedPracticeDescriptor,
  itemsCompleted: number,
  score?: number,
): string {
  if (
    !Number.isSafeInteger(itemsCompleted) ||
    itemsCompleted < descriptor.session.minItems ||
    itemsCompleted > descriptor.session.maxItems
  ) {
    return `This session finished with ${itemsCompleted} items, outside the guided range of ${descriptor.session.minItems}–${descriptor.session.maxItems}. Return to the learning path and open the step again.`;
  }
  if (score != null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return 'This session produced an invalid score, so path progress was not saved.';
  }
  return '';
}
