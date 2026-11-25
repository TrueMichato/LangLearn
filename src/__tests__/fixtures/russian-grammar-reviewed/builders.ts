import type { LessonReviewFormat, LessonReviewPriority } from '../../../lib/lesson-review';
import type { GrammarTeachingPoint, VocabularyTeachingPoint } from '../../helpers/grammar-retention';

export function apply(
  id: string, priority: LessonReviewPriority, format: LessonReviewFormat, sourceSection: string,
  objective: string, prompt: string, answer: string,
): GrammarTeachingPoint {
  return { id, kind: 'rule', priority, format, sourceSection, objective, prompt, answer };
}

export function recall(
  id: string, priority: LessonReviewPriority, sourceSection: string,
  objective: string, prompt: string, answer: string,
): GrammarTeachingPoint {
  return { id, kind: 'concept', priority, format: 'qa', sourceSection, objective, prompt, answer };
}

export function word(
  id: string, sourceSection: string, target: string, meaning: string,
  priority: LessonReviewPriority = 'optional',
): VocabularyTeachingPoint {
  return {
    id, kind: 'vocabulary', priority, sourceSection, word: target, meaning,
    objective: `Recognize ${target} as a word meaning ${meaning}.`,
  };
}
