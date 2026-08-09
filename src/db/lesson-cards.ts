import { db, type Word } from './schema';
import { addWord, bulkAddWords } from './words';
import { buildGrammarCardFields, type GrammarCardSource } from '../lib/grammar-cards';
import { captureTags, lessonTag, type CaptureCandidate } from '../lib/lesson-capture';

/** What a sync pass changed, so the lesson can report it honestly. */
export interface GrammarCardSync {
  added: number;
  repaired: number;
}

/**
 * Grammar cards created before this change were tagged with the bare lesson id.
 * Both forms are matched so existing cards are recognised and repaired rather
 * than duplicated.
 */
function isFromLesson(word: Word, lessonId: string): boolean {
  return word.tags.includes(lessonTag(lessonId)) || word.tags.includes(lessonId);
}

/** Identity of a grammar card: the rule it teaches plus the prompt it asks. */
function cardKey(rule: string, prompt: string): string {
  return `${rule.trim()}::${prompt.trim()}`;
}

/**
 * Bring a lesson's stored grammar cards in line with its content.
 *
 * The previous implementation skipped the whole lesson as soon as a single card
 * existed, so every content correction was invisible to anyone who had already
 * completed the lesson — which is everyone the fix was for. This adds what is
 * missing and rewrites cards whose stored fields no longer match the lesson,
 * while leaving review scheduling untouched.
 */
const inFlight = new Map<string, Promise<GrammarCardSync>>();

export function syncLessonGrammarCards(
  cards: GrammarCardSource[],
  language: string,
  lessonId: string,
): Promise<GrammarCardSync> {
  // Two overlapping calls would both read an empty deck and both insert, which
  // is how a lesson ended up with every card duplicated.
  const key = `${language}/${lessonId}`;
  const running = inFlight.get(key);
  if (running) return running;

  const pending = runSync(cards, language, lessonId).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, pending);
  return pending;
}

async function runSync(
  cards: GrammarCardSource[],
  language: string,
  lessonId: string,
): Promise<GrammarCardSync> {
  const existing = await db.words
    .where('type')
    .equals('grammar')
    .filter((word) => word.language === language && isFromLesson(word, lessonId))
    .toArray();

  const byKey = new Map<string, Word>();
  for (const word of existing) {
    byKey.set(cardKey(word.grammarRule ?? '', word.contextSentence ?? ''), word);
  }

  let added = 0;
  let repaired = 0;

  for (const card of cards) {
    const fields = buildGrammarCardFields(card);
    if (!fields) continue;

    const key = cardKey(fields.grammarRule, fields.contextSentence);
    const match = byKey.get(key);
    if (!match) {
      const id = await addWord({
        ...fields,
        language,
        sourceTextId: null,
        tags: ['grammar', lessonTag(lessonId)],
        type: 'grammar',
      });
      // Record it so a lesson that declares the same card twice adds it once.
      byKey.set(key, { ...fields, id, language, sourceTextId: null, tags: ['grammar', lessonTag(lessonId)], type: 'grammar' } as Word);
      added++;
      continue;
    }

    const needsRepair =
      match.word !== fields.word ||
      match.reading !== fields.reading ||
      match.meaning !== fields.meaning ||
      !match.tags.includes(lessonTag(lessonId));

    if (needsRepair) {
      await db.words.update(match.id!, {
        word: fields.word,
        reading: fields.reading,
        meaning: fields.meaning,
        tags: Array.from(new Set([...match.tags, 'grammar', lessonTag(lessonId)])),
      });
      repaired++;
    }
  }

  return { added, repaired };
}

/** Which of a lesson's candidates are already saved for this language. */
export async function findSavedCandidates(
  candidates: CaptureCandidate[],
  language: string,
): Promise<Set<string>> {
  if (candidates.length === 0) return new Set();

  // One indexed read per language beats one lookup per candidate — a lesson can
  // offer several hundred.
  const existing = await db.words.where('language').equals(language).toArray();
  const saved = new Set(existing.map((word) => word.word));
  return new Set(candidates.filter((c) => saved.has(c.word)).map((c) => c.id));
}

/** Save selected lesson candidates, skipping any that already exist. */
export async function saveCandidates(
  candidates: CaptureCandidate[],
  language: string,
  lessonId: string,
): Promise<number> {
  const alreadySaved = await findSavedCandidates(candidates, language);
  const seen = new Set<string>();
  const rows = candidates
    .filter((candidate) => {
      if (alreadySaved.has(candidate.id) || seen.has(candidate.word)) return false;
      seen.add(candidate.word);
      return true;
    })
    .map((candidate) => ({
      word: candidate.word,
      reading: candidate.reading,
      meaning: candidate.meaning,
      language,
      contextSentence: candidate.contextSentence,
      sourceTextId: null,
      tags: captureTags(lessonId, candidate.isSentence),
      type: 'word' as const,
    }));

  if (rows.length === 0) return 0;
  return bulkAddWords(rows);
}
