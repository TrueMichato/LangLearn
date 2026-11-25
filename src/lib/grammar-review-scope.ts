import type { Word } from '../db/schema';
import ruleIds from 'virtual:grammar-rule-ids';
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
 * Lesson membership alone doesn't certify a saved kind: older comprehension
 * tasks could also be saved as concepts. Verify the current authored identity.
 */
export function isRuleRecallCard(word: Word): boolean {
  const source = word.lessonSource;
  return word.type === 'grammar' && word.grammarKind === 'concept' && source?.provenance === 'authored' &&
    (ruleIds[`${word.language}/${source.lessonId}`]?.includes(source.itemId) ?? false);
}
