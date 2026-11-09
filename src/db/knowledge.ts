import { liveQuery } from 'dexie';
import { db } from './schema';
import lessonTargets from '../data/lesson-targets.json';
import { buildKnowledgeSnapshot, type KnowledgeSnapshot } from '../lib/knowledge';
import { normalizeLanguage } from '../lib/lexical';

/** One consistent read per snapshot, never a database scan per story/item. */
export async function loadKnowledgeSnapshot(language: string): Promise<KnowledgeSnapshot> {
  const lang = normalizeLanguage(language);
  return db.transaction('r', db.words, db.reviews, db.lessonProgress, async () => {
    const words = await db.words.where('language').equals(lang).toArray();
    const ids = words.flatMap((word) => word.id === undefined ? [] : [word.id]);
    const reviews = ids.length ? await db.reviews.where('wordId').anyOf(ids).toArray() : [];
    const lessons = await db.lessonProgress.where('language').equals(lang).toArray();
    return buildKnowledgeSnapshot({ language: lang, words, reviews, lessons, lessonTargets });
  });
}

/** Dexie observes writes, deletes, bulk imports, and other tabs automatically. */
export function observeKnowledgeSnapshot(
  language: string,
  next: (snapshot: KnowledgeSnapshot) => void,
  error: (error: unknown) => void,
): () => void {
  const subscription = liveQuery(() => loadKnowledgeSnapshot(language)).subscribe({ next, error });
  return () => subscription.unsubscribe();
}
