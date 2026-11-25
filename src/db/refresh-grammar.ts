import { reviewedGrammarLessonId } from '../lib/grammar-review-scope';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { sourceWordingUnchanged } from '../lib/card-identity';
import { reconcileSavedLessonItems, type RefreshLessonCounts } from './lesson-cards';
import { db, type Word } from './schema';

export interface GrammarRefreshResult extends RefreshLessonCounts {
  unavailable: number;
}

async function readSource(language: string, lessonId: string) {
  const url = `${import.meta.env.BASE_URL}content/grammar/${language}/${lessonId}.md`;
  try {
    // The installed app precaches these revisioned lessons. Without a service
    // worker the browser may still have an HTTP-cached copy while offline.
    const response = await fetch(url).catch(() => fetch(url, { cache: 'only-if-cached', mode: 'same-origin' }));
    if (!response.ok) return null;
    const { items, diagnostics } = parseLessonReviewItems(await response.text());
    const grammar = items.filter((item) => item.kind !== 'vocabulary');
    return diagnostics.length || !grammar.length ? null : grammar;
  } catch {
    return null;
  }
}

/** Only language codes and lesson IDs are used in content requests; learner wording stays local. */
export async function refreshSavedGrammarCards(words: readonly Word[]): Promise<GrammarRefreshResult> {
  const result: GrammarRefreshResult = { updated: 0, unchanged: 0, skipped: 0, unavailable: 0 };
  const lessons = new Map<string, { language: string; lessonId: string; ids: Set<number> }>();
  for (const word of words) {
    const lessonId = reviewedGrammarLessonId(word);
    if (!lessonId || word.id === undefined) continue;
    if (!sourceWordingUnchanged(word) || word.lessonSource?.provenance === 'custom') {
      result.skipped++;
      continue;
    }
    const key = `${word.language}/${lessonId}`;
    const lesson = lessons.get(key) ?? { language: word.language, lessonId, ids: new Set<number>() };
    lesson.ids.add(word.id);
    lessons.set(key, lesson);
  }
  const sources = await Promise.all(Array.from(lessons.values(), async (lesson) =>
    ({ ...lesson, items: await readSource(lesson.language, lesson.lessonId) })));
  // No fetches inside IndexedDB transactions. Re-read ownership and wording
  // under the write lock, and commit all available lessons or none.
  await db.transaction('rw', db.words, async () => {
    for (const { language, lessonId, ids, items } of sources) {
      if (!items) {
        result.unavailable += ids.size;
        continue;
      }
      const counts = await reconcileSavedLessonItems(items, language, lessonId, ids);
      result.updated += counts.updated;
      result.unchanged += counts.unchanged;
      result.skipped += counts.skipped;
    }
  });
  return result;
}
