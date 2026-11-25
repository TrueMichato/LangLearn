import type { Word } from '../db/schema';
import { REVIEWED_GRAMMAR_LESSONS } from './grammar-reviewed';

export function isReviewedGrammarLesson(language: string, lessonId?: string | null): boolean {
  return !!lessonId && Object.hasOwn(REVIEWED_GRAMMAR_LESSONS, language) &&
    REVIEWED_GRAMMAR_LESSONS[language].includes(lessonId);
}

export function reviewedGrammarLessonId(word: Word): string | undefined {
  if (word.type !== 'grammar') return;
  let id = word.lessonSource?.lessonId;
  if (!word.lessonSource) {
    const tags = word.tags ?? [];
    const explicit = tags.filter((tag) => tag.startsWith('lesson:'));
    if (explicit.length === 1) id = explicit[0].slice('lesson:'.length);
    // The old saver wrote exactly ['grammar', lessonId]. Other bare tags
    // may be personal topics rather than evidence of lesson membership.
    else if (!explicit.length && tags.length === 2 && tags.includes('grammar')) {
      id = tags.find((tag) => tag !== 'grammar');
    }
  }
  return isReviewedGrammarLesson(word.language, id) ? id : undefined;
}

/**
 * A declarative "recall the rule" card. Only reviewed lessons guarantee that
 * concept cards are rule recall; elsewhere they still mix in application tasks.
 */
export function isRuleRecallCard(word: Word): boolean {
  return word.grammarKind === 'concept' && reviewedGrammarLessonId(word) !== undefined;
}
