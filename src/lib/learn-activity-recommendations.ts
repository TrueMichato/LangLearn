import type { LearningPath } from '../types/learning-path';
import { ROUTES } from './routes';

export interface LearnActivityRecommendation {
  to: string;
  emoji: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
}

const KIND_DETAILS = {
  letters: { emoji: '🔤', label: 'letters' },
  vocab: { emoji: '📝', label: 'vocabulary' },
  grammar: { emoji: '📖', label: 'grammar' },
} as const;

export function getPathRecommendations(
  path: LearningPath | null,
): LearnActivityRecommendation[] {
  const current = path?.units
    .flatMap((unit) => unit.nodes)
    .find((node) => node.id === path.recommendedNodeId);
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
      subtitle: 'Use cloze questions to make it stick',
    });
  } else if (current.kind === 'vocab') {
    recommendations.push({
      to: ROUTES.sentenceBuilder,
      emoji: '✏️',
      title: 'Use the words',
      subtitle: 'Build a sentence with what you are learning',
    });
  }

  return recommendations;
}
