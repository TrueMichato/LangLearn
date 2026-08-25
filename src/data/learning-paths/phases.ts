import type {
  LearningPathContinuationPhaseStart,
  LearningPathPhase,
} from '../../types/learning-path';
import { vocab } from './shared';

type CurriculumLanguage = 'ja' | 'ru' | 'ar' | 'es' | 'pt' | 'ro';

export interface LearningPathPhasePlan {
  phases: LearningPathPhase[];
  continuation: LearningPathContinuationPhaseStart[];
}

export const LEARNING_PATH_PHASE_PLANS: Record<
  CurriculumLanguage,
  LearningPathPhasePlan
> = {
  ja: {
    phases: [
      {
        id: 'kana-first-sentences',
        title: 'Kana and first sentences',
        description: 'Build the script and the grammar of simple daily exchanges.',
      },
      {
        id: 'everyday-japanese',
        title: 'Everyday Japanese',
        description: 'Grow your range across practical situations and familiar topics.',
      },
      {
        id: 'jlpt-n4-range',
        title: 'JLPT N4 range',
        description: 'Connect broader vocabulary with intermediate sentence patterns.',
      },
      {
        id: 'jlpt-n3-expression',
        title: 'JLPT N3 expression',
        description: 'Work with abstract, formal, and written Japanese.',
      },
    ],
    continuation: [
      { phaseId: 'everyday-japanese' },
      { phaseId: 'jlpt-n4-range', startsAt: vocab('n4-verbs') },
      { phaseId: 'jlpt-n3-expression', startsAt: vocab('n3-verbs') },
    ],
  },
  ru: {
    phases: [
      {
        id: 'cyrillic-first-sentences',
        title: 'Cyrillic and first sentences',
        description: 'Learn the script while building your first useful sentences.',
      },
      {
        id: 'daily-life-russian',
        title: 'Daily-life Russian',
        description: 'Expand through routines, places, feelings, and practical needs.',
      },
      {
        id: 'connected-russian',
        title: 'Connected Russian',
        description: 'Link ideas with aspect, motion, and more precise expression.',
      },
      {
        id: 'russian-in-context',
        title: 'Russian in context',
        description: 'Use Russian across culture, formal settings, and real situations.',
      },
    ],
    continuation: [
      { phaseId: 'daily-life-russian' },
      { phaseId: 'connected-russian', startsAt: vocab('aspect-pairs') },
      { phaseId: 'russian-in-context', startsAt: vocab('proverbs') },
    ],
  },
  ar: {
    phases: [
      {
        id: 'script-first-conversations',
        title: 'Script and first conversations',
        description: 'Build letter confidence and the structure of simple exchanges.',
      },
      {
        id: 'everyday-msa',
        title: 'Everyday MSA',
        description: 'Use the shared written core for daily life and familiar topics.',
      },
      {
        id: 'broader-expression',
        title: 'Broader expression',
        description: 'Grow into work, culture, media, and connected speech.',
      },
      {
        id: 'formal-public-life',
        title: 'Formal and public life',
        description: 'Handle civic, professional, and more formal communication.',
      },
      {
        id: 'specialized-fluency',
        title: 'Specialized fluency',
        description: 'Explore precise language for advanced real-world domains.',
      },
    ],
    continuation: [
      { phaseId: 'everyday-msa' },
      { phaseId: 'broader-expression', startsAt: vocab('kitchen') },
      { phaseId: 'formal-public-life', startsAt: vocab('law-justice') },
      { phaseId: 'specialized-fluency', startsAt: vocab('abstract-concepts') },
    ],
  },
  es: {
    phases: [
      {
        id: 'first-conversations',
        title: 'First conversations',
        description: 'Build a dependable base for simple everyday exchanges.',
      },
      {
        id: 'everyday-spanish',
        title: 'Everyday Spanish',
        description: 'Expand through routines, travel, feelings, and practical needs.',
      },
      {
        id: 'connected-expression',
        title: 'Connected expression',
        description: 'Discuss work, ideas, media, and the world with more range.',
      },
      {
        id: 'spanish-in-the-world',
        title: 'Spanish in the world',
        description: 'Practice regional language, idioms, and real-life situations.',
      },
    ],
    continuation: [
      { phaseId: 'everyday-spanish' },
      { phaseId: 'connected-expression', startsAt: vocab('workplace') },
      { phaseId: 'spanish-in-the-world', startsAt: vocab('at-the-airport') },
    ],
  },
  pt: {
    phases: [
      {
        id: 'first-conversations',
        title: 'First conversations',
        description: 'Build a dependable base for simple everyday exchanges.',
      },
      {
        id: 'everyday-portuguese',
        title: 'Everyday Portuguese',
        description: 'Expand through routines, travel, feelings, and practical needs.',
      },
      {
        id: 'independent-expression',
        title: 'Independent expression',
        description: 'Use broader vocabulary to share ideas and experiences.',
      },
      {
        id: 'portuguese-in-context',
        title: 'Portuguese in context',
        description: 'Practice work, society, media, and real-world communication.',
      },
    ],
    continuation: [
      { phaseId: 'everyday-portuguese' },
      { phaseId: 'independent-expression', startsAt: vocab('technology') },
      { phaseId: 'portuguese-in-context', startsAt: vocab('workplace') },
    ],
  },
  ro: {
    phases: [
      {
        id: 'first-conversations',
        title: 'First conversations',
        description: 'Build a dependable base for simple everyday exchanges.',
      },
      {
        id: 'everyday-romanian',
        title: 'Everyday Romanian',
        description: 'Expand through routines, travel, feelings, and practical needs.',
      },
      {
        id: 'connected-expression',
        title: 'Connected expression',
        description: 'Discuss work, ideas, media, and the world with more range.',
      },
      {
        id: 'romanian-in-the-world',
        title: 'Romanian in the world',
        description: 'Use Romanian across services, society, and real situations.',
      },
    ],
    continuation: [
      { phaseId: 'everyday-romanian' },
      { phaseId: 'connected-expression', startsAt: vocab('technology') },
      { phaseId: 'romanian-in-the-world', startsAt: vocab('survival-phrases') },
    ],
  },
};

export function getLearningPathPhasePlan(
  language: string,
): LearningPathPhasePlan | null {
  return LEARNING_PATH_PHASE_PLANS[language as CurriculumLanguage] ?? null;
}
