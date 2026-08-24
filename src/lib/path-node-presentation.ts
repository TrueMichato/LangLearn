import type {
  LearningPathNode,
  LearningPathNodeKind,
} from '../types/learning-path';

export const PATH_KIND_DETAILS: Record<
  LearningPathNodeKind,
  { emoji: string; label: string }
> = {
  letters: { emoji: '🔤', label: 'Letters' },
  vocab: { emoji: '📝', label: 'Vocabulary' },
  grammar: { emoji: '📖', label: 'Grammar' },
  sentence: { emoji: '🧩', label: 'Sentence practice' },
  cloze: { emoji: '✍️', label: 'Cloze practice' },
  listening: { emoji: '🎧', label: 'Listening practice' },
  dictation: { emoji: '🎙️', label: 'Dictation' },
  conjugation: { emoji: '🔁', label: 'Conjugation practice' },
  translation: { emoji: '🌐', label: 'Translation practice' },
  'minimal-pairs': { emoji: '👂', label: 'Minimal pairs' },
  numbers: { emoji: '🔢', label: 'Number practice' },
  reading: { emoji: '📚', label: 'Reading' },
  lyrics: { emoji: '🎵', label: 'Lyrics' },
  tests: { emoji: '✅', label: 'Proficiency test' },
};

export function pathNodeStatus(
  node: LearningPathNode,
  recommended: boolean,
): string {
  if (recommended) return 'Up next';
  if (node.requirement === 'enrichment') {
    if (node.state === 'completed') return 'Explored';
    return node.state === 'available' ? 'Explore' : 'Explore later';
  }
  if (node.state === 'completed') return 'Complete';
  return node.state === 'available' ? 'Also available' : 'Locked';
}

export function pathNodeAccessibleLabel(
  node: LearningPathNode,
  recommended: boolean,
): string {
  const kind = PATH_KIND_DETAILS[node.kind].label;
  const requirement =
    node.requirement === 'enrichment' ? 'Optional enrichment. ' : '';
  return `${node.title}. ${kind}. ${requirement}${pathNodeStatus(node, recommended)}.`;
}
