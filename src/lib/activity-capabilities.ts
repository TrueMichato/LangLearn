import { ROUTES, lettersRoute } from './routes';
import type {
  LearningPathActivityKind,
  LearningPathSessionBounds,
} from '../types/learning-path';
import type { CurriculumLanguage } from './curriculum-policy';

export const GUIDED_ACTIVITY_KINDS = [
  'letters',
  'sentence',
  'cloze',
  'listening',
  'dictation',
  'conjugation',
  'translation',
  'minimal-pairs',
  'numbers',
  'reading',
  'lyrics',
  'tests',
] as const satisfies readonly LearningPathActivityKind[];

export interface ActivityCapability {
  available: boolean;
  label: string;
  route: string;
  session: LearningPathSessionBounds;
}

const DEFINITIONS: Record<
  LearningPathActivityKind,
  Omit<ActivityCapability, 'available' | 'route'> & { route: string }
> = {
  letters: {
    label: 'Letters',
    route: ROUTES.letters,
    session: { minItems: 1, targetItems: 5, maxItems: 10 },
  },
  sentence: {
    label: 'Sentence Builder',
    route: ROUTES.sentenceBuilder,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  cloze: {
    label: 'Cloze Practice',
    route: ROUTES.clozePractice,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  listening: {
    label: 'Listening Practice',
    route: ROUTES.listening,
    session: { minItems: 1, targetItems: 3, maxItems: 5 },
  },
  dictation: {
    label: 'Dictation Practice',
    route: `${ROUTES.listening}?mode=dictation`,
    session: { minItems: 3, targetItems: 5, maxItems: 10 },
  },
  conjugation: {
    label: 'Conjugation Practice',
    route: ROUTES.conjugations,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  translation: {
    label: 'Translation Practice',
    route: ROUTES.translation,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  'minimal-pairs': {
    label: 'Minimal Pairs',
    route: ROUTES.minimalPairs,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  numbers: {
    label: 'Number Practice',
    route: ROUTES.numberPractice,
    session: { minItems: 5, targetItems: 10, maxItems: 20 },
  },
  reading: {
    label: 'Reading',
    route: ROUTES.reader,
    session: { minItems: 1, targetItems: 1, maxItems: 3 },
  },
  lyrics: {
    label: 'Lyrics',
    route: ROUTES.lyrics,
    session: { minItems: 1, targetItems: 1, maxItems: 3 },
  },
  tests: {
    label: 'Tests',
    route: ROUTES.tests,
    session: { minItems: 10, targetItems: 20, maxItems: 50 },
  },
};

const ALL_LANGUAGES = new Set<CurriculumLanguage>([
  'ja',
  'ru',
  'ar',
  'es',
  'pt',
  'ro',
]);
const NUMBER_LANGUAGES = new Set<CurriculumLanguage>(['ar']);

export const ACTIVITY_CAPABILITIES: Record<
  CurriculumLanguage,
  Record<LearningPathActivityKind, ActivityCapability>
> = Object.fromEntries(
  [...ALL_LANGUAGES].map((language) => [
    language,
    Object.fromEntries(
      GUIDED_ACTIVITY_KINDS.map((kind) => {
        const definition = DEFINITIONS[kind];
        return [
          kind,
          {
            ...definition,
            route: kind === 'letters' ? lettersRoute(language) : definition.route,
            available: kind !== 'numbers' || NUMBER_LANGUAGES.has(language),
          },
        ];
      }),
    ),
  ]),
) as Record<
  CurriculumLanguage,
  Record<LearningPathActivityKind, ActivityCapability>
>;

export function getActivityCapability(
  language: CurriculumLanguage,
  kind: LearningPathActivityKind,
): ActivityCapability {
  return ACTIVITY_CAPABILITIES[language][kind];
}
