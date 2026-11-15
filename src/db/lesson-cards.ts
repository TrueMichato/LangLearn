import { db, type LessonItemSource, type Word } from './schema';
import { addWord, saveWordsToVocabulary } from './words';
import { normalizeGrammarCardSource, type GrammarCardSource } from '../lib/grammar-cards';
import { captureTags, lessonTag, type CaptureCandidate } from '../lib/lesson-capture';
import type { LessonReviewItem } from '../lib/lesson-review';
import {
  lessonSourceSnapshot,
  mergeStoredCardMetadata,
  sameStoredCard,
  sourceWordingUnchanged,
  storedWordType,
} from '../lib/card-identity';

export interface GrammarCardSync {
  added: number;
  repaired: number;
}

export interface SaveLessonReviewResult {
  added: number;
  alreadySaved: number;
  /** New authored/legacy grammar cards only; custom captures earn no new bonus. */
  grammarAdded: number;
}

export interface ReconcileSavedLessonResult {
  repaired: number;
}

function itemSource(item: LessonReviewItem, lessonId: string): LessonItemSource {
  return {
    lessonId,
    itemId: item.id,
    provenance: item.provenance,
    sourceSection: item.sourceSection,
    ...(item.kind !== 'vocabulary' ? {
      legacyAliases: [
        { rule: item.rule, example: item.prompt },
        ...item.legacyAliases,
      ],
    } : {}),
  };
}

function itemWord(item: LessonReviewItem, language: string, lessonId: string): Omit<Word, 'id' | 'createdAt'> {
  const source = itemSource(item, lessonId);
  if (item.kind === 'vocabulary') {
    return {
      word: item.word,
      reading: item.reading,
      meaning: item.meaning,
      contextSentence: item.contextSentence,
      language,
      sourceTextId: null,
      tags: captureTags(lessonId, item.isSentence),
      type: 'word',
      lessonSources: [source],
      ...(item.learnerEdited ? { learnerEdited: true } : {}),
    };
  }
  const fields = {
    word: item.answer,
    reading: item.hint,
    meaning: item.explanation,
    contextSentence: item.prompt,
    grammarRule: item.rule,
    grammarKind: item.kind,
    grammarFormat: item.format,
  };
  return {
    ...fields,
    language,
    sourceTextId: null,
    tags: ['grammar', lessonTag(lessonId)],
    type: 'grammar',
    lessonSource: source,
    lessonSourceSnapshot: lessonSourceSnapshot(fields),
    ...(item.learnerEdited ? { learnerEdited: true } : {}),
  };
}

/** Read-only saved-state lookup, including exact legacy identities and aliases. */
export async function findSavedLessonItems(
  items: LessonReviewItem[],
  language: string,
  lessonId: string,
): Promise<Set<string>> {
  if (!items.length) return new Set();
  const existing = await db.words.where('language').equals(language).toArray();
  return new Set(items.filter((item) => {
    const row = itemWord(item, language, lessonId);
    return existing.some((word) => sameStoredCard(word, row));
  }).map((item) => item.id));
}

async function reconcileExistingItem(
  match: Word,
  row: Omit<Word, 'id' | 'createdAt'>,
  item: LessonReviewItem,
): Promise<boolean> {
  const updates = mergeStoredCardMetadata(match, row);
  if (item.kind !== 'vocabulary') {
    const source = row.lessonSource!;
    const keepAuthoredSource = match.lessonSource?.provenance === 'authored' && source.provenance === 'legacy';
    if (match.lessonSource) {
      const aliases = [
        ...(match.lessonSource.legacyAliases ?? []),
        ...(source.legacyAliases ?? []),
      ];
      updates.lessonSource = {
        ...(keepAuthoredSource ? match.lessonSource : source),
        legacyAliases: aliases.filter((alias, index) =>
          aliases.findIndex((other) =>
            other.rule === alias.rule && other.example === alias.example) === index),
      };
    }
    if (source.provenance !== 'custom' && !keepAuthoredSource &&
      !item.learnerEdited && sourceWordingUnchanged(match)) {
      Object.assign(updates, lessonSourceSnapshot(row), {
        lessonSourceSnapshot: lessonSourceSnapshot(row),
      });
    }
    if (item.learnerEdited) updates.learnerEdited = true;
  }
  const changed = Object.entries(updates).some(([key, value]) =>
    JSON.stringify(match[key as keyof Word]) !== JSON.stringify(value));
  if (changed) {
    await db.words.update(match.id!, updates);
    Object.assign(match, updates);
  }
  return changed;
}

/**
 * Adopt/repair only cards already saved. Loading source material must never add
 * missing or previously declined items, create reviews, or award saving XP.
 */
export async function reconcileSavedLessonItems(
  items: LessonReviewItem[],
  language: string,
  lessonId: string,
): Promise<ReconcileSavedLessonResult> {
  let repaired = 0;
  if (!items.length) return { repaired };
  await db.transaction('rw', db.words, async () => {
    const existing = await db.words.where('language').equals(language).toArray();
    for (const item of items) {
      if (item.provenance === 'custom' || item.learnerEdited) continue;
      const row = itemWord(item, language, lessonId);
      const match = existing.find((word) => sameStoredCard(word, row));
      if (match && await reconcileExistingItem(match, row, item)) repaired++;
    }
  });
  return { repaired };
}

async function saveItems(
  items: LessonReviewItem[],
  language: string,
  lessonId: string,
): Promise<SaveLessonReviewResult & { repaired: number }> {
  const result = { added: 0, alreadySaved: 0, grammarAdded: 0, repaired: 0 };
  if (!items.length) return result;

  // IndexedDB serialises overlapping read-write transactions across tabs, not
  // just callers sharing this JS module. Nested lexical saves join this batch.
  await db.transaction('rw', [db.words, db.reviews], async () => {
    const existing = await db.words.where('language').equals(language).toArray();
    for (const item of items) {
      const row = itemWord(item, language, lessonId);
      if (item.kind === 'vocabulary') {
        const saved = await saveWordsToVocabulary([row]);
        result.added += saved.added;
        result.alreadySaved += saved.alreadySaved;
        continue;
      }

      const match = existing.find((word) => sameStoredCard(word, row));
      if (match) {
        if (await reconcileExistingItem(match, row, item)) result.repaired++;
        result.alreadySaved++;
        continue;
      }

      const id = await addWord(row);
      existing.push({ ...row, id, createdAt: new Date().toISOString() });
      result.added++;
      if (item.provenance === 'authored' || item.provenance === 'legacy') result.grammarAdded++;
    }
  });
  return result;
}

/** Only the caller's selected items are saved; failures roll the entire batch back. */
export async function saveLessonReviewItems(
  items: LessonReviewItem[],
  language: string,
  lessonId: string,
): Promise<SaveLessonReviewResult> {
  const { added, alreadySaved, grammarAdded } = await saveItems(items, language, lessonId);
  return { added, alreadySaved, grammarAdded };
}

/** Compatibility for explicit old callers, never invoked just for completion. */
export async function syncLessonGrammarCards(
  cards: GrammarCardSource[],
  language: string,
  lessonId: string,
): Promise<GrammarCardSync> {
  const items = cards.map(normalizeGrammarCardSource).filter((item) => item !== null);
  const { added, repaired } = await saveItems(items, language, lessonId);
  return { added, repaired };
}

export async function findSavedCandidates(
  candidates: CaptureCandidate[],
  language: string,
): Promise<Set<string>> {
  if (!candidates.length) return new Set();
  const existing = await db.words.where('language').equals(language).toArray();
  const saved = new Set(existing.filter((word) => storedWordType(word) === 'word').map((word) => word.word));
  return new Set(candidates.filter((candidate) => saved.has(candidate.word)).map((candidate) => candidate.id));
}

export async function saveCandidates(
  candidates: CaptureCandidate[],
  language: string,
  lessonId: string,
): Promise<number> {
  const items: LessonReviewItem[] = candidates.map((candidate) => ({
    ...candidate,
    kind: 'vocabulary',
    provenance: candidate.provenance ?? 'formatting',
    priority: candidate.priority ?? 'optional',
    sourceSection: candidate.sourceSection ?? '',
  }));
  return (await saveLessonReviewItems(items, language, lessonId)).added;
}
