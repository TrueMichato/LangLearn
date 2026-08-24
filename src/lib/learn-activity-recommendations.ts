import type {
  LearningPath,
  LearningPathNodeKind,
} from '../types/learning-path';
import { ROUTES } from './routes';

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
  tests: { emoji: '✅', label: 'test' },
};

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
