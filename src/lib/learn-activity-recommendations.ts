import type {
  LearningPath,
  LearningPathNodeKind,
} from '../types/learning-path';
import { ROUTES } from './routes';
import { getActivityCapability } from './activity-capabilities';
import { CURRICULUM_LANGUAGES, type CurriculumLanguage } from './curriculum-policy';
import { parseGuidedPracticeQuery } from './guided-practice';
import { getLanguageLabel } from './languages';

export interface LearnActivityRecommendation {
  to: string;
  emoji: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

const KIND_DETAILS: Record<
  LearningPathNodeKind,
  { emoji: string; label: string }
> = {
  letters: { emoji: '🔤', label: 'letters' },
  vocab: { emoji: '📝', label: 'vocabulary' },
  grammar: { emoji: '📖', label: 'grammar' },
  sentence: { emoji: '🧩', label: 'sentence practice' },
  cloze: { emoji: '✍️', label: 'cloze practice' },
  listening: { emoji: '🎧', label: 'listening practice' },
  dictation: { emoji: '🎙️', label: 'dictation practice' },
  conjugation: { emoji: '🔁', label: 'conjugation practice' },
  translation: { emoji: '🌐', label: 'translation practice' },
  'minimal-pairs': { emoji: '👂', label: 'minimal-pair practice' },
  numbers: { emoji: '🔢', label: 'number practice' },
  reading: { emoji: '📚', label: 'reading practice' },
  lyrics: { emoji: '🎵', label: 'lyrics practice' },
  tests: { emoji: '✅', label: 'practice check' },
};

export function getInputRecommendation(
  language: string | undefined,
  path: LearningPath | null = null,
  after?: 'listening' | 'reading',
): LearnActivityRecommendation | null {
  if (!language || !(CURRICULUM_LANGUAGES as readonly string[]).includes(language)) return null;
  const supportedLanguage = language as CurriculumLanguage;
  const currentUnit = path?.language === language
    ? path.units.find((unit) => unit.nodes.some((node) => node.id === path.recommendedNodeId))
    : undefined;
  const currentKind = currentUnit?.nodes.find((node) => node.id === path?.recommendedNodeId)?.kind;
  const previousKind = after ?? (currentKind === 'listening' || currentKind === 'reading' ? currentKind : undefined);
  const input = currentUnit?.nodes.find((node) => {
    if ((node.kind !== 'reading' && node.kind !== 'listening') ||
      node.kind === previousKind || node.id === path?.recommendedNodeId || node.state === 'locked') return false;
    const capability = getActivityCapability(supportedLanguage, node.kind);
    const query = parseGuidedPracticeQuery(node.route.split('?')[1] ?? '', node.kind);
    return capability.available && node.route.split('?')[0] === capability.route &&
      query.kind === 'guided' && query.descriptor.language === language;
  });
  if (input) {
    return {
      to: input.route,
      emoji: KIND_DETAILS[input.kind].emoji,
      title: input.title,
      subtitle: 'An optional activity from this path unit, not a match to your lesson vocabulary.',
    };
  }
  const kind = previousKind === 'listening' ? 'reading' : 'listening';
  const capability = getActivityCapability(supportedLanguage, kind);
  if (!capability.available) return null;
  return {
    to: capability.route,
    emoji: KIND_DETAILS[kind].emoji,
    title: kind === 'reading' ? `Read in ${getLanguageLabel(language)}` : `Try listening in ${getLanguageLabel(language)}`,
    subtitle: kind === 'reading'
      ? 'A beginner-friendly option: choose an Easy text in Library, or continue your reading.'
      : 'A beginner-friendly option: choose Easy on Listening. You can use the transcript anytime.',
  };
}

export function getPathRecommendations(
  path: LearningPath | null,
  language: string | undefined = path?.language,
): LearnActivityRecommendation[] {
  if (!path || path.language !== language) return [];
  const current = path?.units
    .flatMap((unit) => unit.nodes)
    .find((node) => node.id === path.recommendedNodeId && node.state === 'available');
  if (!current) return [];

  const detail = KIND_DETAILS[current.kind];
  const recommendations: LearnActivityRecommendation[] = [
    {
      to: current.route,
      emoji: detail.emoji,
      title: current.title,
      subtitle: `Your next ${detail.label} step`,
    },
  ];

  if (current.kind === 'grammar') {
    recommendations.push({
      to: ROUTES.clozePractice,
      emoji: '🧩',
      title: 'Practice the pattern',
      subtitle: 'Explore cloze questions; not limited to this lesson',
    });
  } else if (current.kind === 'vocab') {
    recommendations.push({
      to: ROUTES.sentenceBuilder,
      emoji: '✏️',
      title: 'Use the words',
      subtitle: 'Explore sentence practice; not limited to this lesson',
    });
  }

  const input = getInputRecommendation(language, path,
    current.kind === 'listening' || current.kind === 'reading' ? current.kind : undefined);
  if (input && !recommendations.some((item) => item.to === input.to)) recommendations.push(input);
  return recommendations;
}
