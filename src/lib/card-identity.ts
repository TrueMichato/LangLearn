import type { LessonItemSource, LessonSourceSnapshot, Word } from '../db/schema';

type IdentifiableWord = Pick<Word, 'language' | 'word'> & Partial<Word>;

export function storedWordType(word: Partial<Word>): Word['type'] {
  return word.type ?? (word.tags?.includes('letters') ? 'letter' : 'word');
}

export function grammarPair(rule: string, prompt: string): string {
  return JSON.stringify([rule.trim(), prompt.trim()]);
}

function sourceKey(source: LessonItemSource): string {
  return JSON.stringify([
    source.provenance === 'custom' ? 'custom' : 'lesson',
    source.lessonId,
    source.itemId,
  ]);
}

export function mergeLessonSources(
  existing: LessonItemSource[] = [],
  incoming: LessonItemSource[] = [],
): LessonItemSource[] {
  const sources = new Map(existing.map((source) => [sourceKey(source), source]));
  for (const source of incoming) {
    const previous = sources.get(sourceKey(source));
    sources.set(sourceKey(source), previous ? { ...source, ...previous } : source);
  }
  return [...sources.values()];
}

function lessonIds(word: Partial<Word>): Set<string> {
  if (word.lessonSource) return new Set([word.lessonSource.lessonId]);
  const explicit = (word.tags ?? []).filter((tag) => tag.startsWith('lesson:'));
  return new Set(explicit.length
    ? explicit.map((tag) => tag.slice(7))
    : (word.tags ?? []).filter((tag) => tag !== 'grammar'));
}

function legacyPairs(word: Partial<Word>): Set<string> {
  return new Set([
    storedGrammarPair(word),
    ...(word.lessonSource?.legacyAliases ?? []).map((alias) =>
      grammarPair(alias.rule, alias.example)),
  ]);
}

function storedGrammarPair(word: Partial<Word>): string {
  // Pre-v9 backups stored the rule in `word` and had no recoverable prompt.
  return word.grammarRule === undefined
    ? grammarPair(word.word ?? '', '')
    : grammarPair(word.grammarRule, word.contextSentence ?? '');
}

/** Source IDs win; exact legacy prompts are a bridge, never an answer-text key. */
export function sameStoredCard(left: IdentifiableWord, right: IdentifiableWord): boolean {
  if (left.language !== right.language || storedWordType(left) !== storedWordType(right)) return false;
  if (storedWordType(left) !== 'grammar') return left.word === right.word;

  const a = left.lessonSource;
  const b = right.lessonSource;
  if (a && b && sourceKey(a) === sourceKey(b)) return true;
  if (a?.provenance === 'custom' || b?.provenance === 'custom') return false;
  if (a && b && a.provenance !== 'legacy' && b.provenance !== 'legacy') return false;

  const leftLessons = lessonIds(left);
  const rightLessons = lessonIds(right);
  if (![...leftLessons].some((id) => rightLessons.has(id))) {
    // Unscoped old imports can only be recognised by their entire question.
    if (leftLessons.size || rightLessons.size) return false;
    return left.word === right.word && left.meaning === right.meaning &&
      left.reading === right.reading &&
      storedGrammarPair(left) === storedGrammarPair(right);
  }
  const pairs = legacyPairs(left);
  return [...legacyPairs(right)].some((pair) => pairs.has(pair));
}

export function storedCardKey(word: IdentifiableWord): string {
  const type = storedWordType(word);
  if (type !== 'grammar') return JSON.stringify([type, word.language, word.word]);
  if (word.lessonSource) {
    return JSON.stringify([type, word.language, sourceKey(word.lessonSource)]);
  }
  return JSON.stringify([
    type, word.language, [...lessonIds(word)].sort(),
    storedGrammarPair(word),
  ]);
}

export function lessonSourceSnapshot(word: Partial<Word>): LessonSourceSnapshot {
  return {
    word: word.word ?? '',
    reading: word.reading ?? '',
    meaning: word.meaning ?? '',
    contextSentence: word.contextSentence ?? '',
    ...(word.grammarRule !== undefined ? { grammarRule: word.grammarRule } : {}),
    ...(word.grammarKind !== undefined ? { grammarKind: word.grammarKind } : {}),
    ...(word.grammarFormat !== undefined ? { grammarFormat: word.grammarFormat } : {}),
  };
}

export function sourceWordingUnchanged(word: Word): boolean {
  return !word.learnerEdited && word.lessonSourceSnapshot !== undefined &&
    JSON.stringify(lessonSourceSnapshot(word)) === JSON.stringify(lessonSourceSnapshot(word.lessonSourceSnapshot));
}

/** Attach provenance without replacing live wording or any scheduling fields. */
export function mergeStoredCardMetadata(existing: Word, incoming: Partial<Word>): Partial<Word> {
  const updates: Partial<Word> = {
    tags: [...new Set([...(existing.tags ?? []), ...(incoming.tags ?? [])])],
  };
  const sources = mergeLessonSources(existing.lessonSources, incoming.lessonSources);
  if (sources.length) updates.lessonSources = sources;
  if (existing.type === 'grammar' && incoming.lessonSource &&
    (!existing.lessonSource || existing.lessonSource.provenance === 'legacy') &&
    incoming.lessonSource.provenance !== 'custom') {
    updates.lessonSource = incoming.lessonSource;
    // With no baseline, differing legacy wording may be a learner edit.
    const unchanged = ['word', 'reading', 'meaning', 'contextSentence', 'grammarRule']
      .every((field) => existing[field as keyof Word] === incoming[field as keyof Word]);
    const knownUnedited = sourceWordingUnchanged(existing);
    updates.learnerEdited = existing.learnerEdited || (!unchanged && !knownUnedited);
    updates.grammarKind = existing.grammarKind ?? incoming.grammarKind;
    updates.grammarFormat = existing.grammarFormat ?? incoming.grammarFormat;
    if (unchanged || knownUnedited) updates.lessonSourceSnapshot = lessonSourceSnapshot({ ...existing, ...updates });
  } else if (existing.type === 'grammar' && existing.lessonSource && incoming.lessonSource) {
    const aliases = [
      ...(existing.lessonSource.legacyAliases ?? []),
      ...(incoming.lessonSource.legacyAliases ?? []),
    ];
    updates.lessonSource = {
      ...existing.lessonSource,
      legacyAliases: aliases.filter((alias, index) => aliases.findIndex((other) =>
        other.rule === alias.rule && other.example === alias.example) === index),
    };
  }
  return updates;
}
