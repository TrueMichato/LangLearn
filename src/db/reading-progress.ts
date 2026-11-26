import { db, type Text } from './schema';

export type ReadingPurpose = 'main-idea' | 'close-study';
export type ReadingSource =
  | { kind: 'curated'; language: string; curatedId: string }
  | { kind: 'saved'; language: string; textId: number; createdAt: string };

export interface ReadingProgress {
  id: string;
  language: string;
  source: ReadingSource;
  title: string;
  /** Exact last-read source: detects changes and keeps curated reading available offline. */
  content: string;
  /** UTF-16 offset of a source paragraph, never a screen coordinate. */
  position: number;
  purpose: ReadingPurpose;
  highlight: boolean;
  reflection: string;
  updatedAt: string;
}

export type ReadingProgressChanges = Partial<Pick<ReadingProgress, 'position' | 'purpose' | 'highlight' | 'reflection'>>;

export class ReadingReflectionConflict extends Error {
  readonly current: ReadingProgress;
  constructor(current: ReadingProgress) {
    super('Another tab changed this reflection. Your draft is kept here, not saved. Keep this page open or copy your draft before choosing which version to use.');
    this.name = 'ReadingReflectionConflict';
    this.current = current;
  }
}

export function readingProgressId(source: ReadingSource): string {
  return source.kind === 'curated'
    ? `curated/${source.language}/${source.curatedId}`
    : `saved/${source.language}/${source.textId}/${encodeURIComponent(source.createdAt)}`;
}

export function savedReadingSource(text: Text & { id: number }): ReadingSource {
  return { kind: 'saved', language: text.language, textId: text.id, createdAt: text.createdAt };
}

export function readingParagraphPositions(content: string): number[] {
  const positions = [0];
  for (const match of content.matchAll(/[^\r\n]+/gu)) {
    const first = match[0].search(/\S/u);
    if (first < 0 || match.index === 0) continue;
    positions.push(match.index + first);
  }
  return positions;
}

export function paragraphPositionAt(content: string, offset: number): number {
  return readingParagraphPositions(content).findLast((position) => position <= offset) ?? 0;
}

export function createReadingProgress(source: ReadingSource, title: string, content: string): ReadingProgress {
  return {
    id: readingProgressId(source), language: source.language, source, title, content,
    position: 0, purpose: 'main-idea', highlight: false, reflection: '', updatedAt: new Date().toISOString(),
  };
}

export function isReadingProgress(value: unknown): value is ReadingProgress {
  if (!value || typeof value !== 'object') return false;
  const row = value as ReadingProgress;
  const source = row.source;
  if (!source || typeof source !== 'object' || typeof source.language !== 'string' ||
    !/^[a-z]{2}$/u.test(source.language) || row.language !== source.language) return false;
  if (source.kind === 'curated') {
    if (typeof source.curatedId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u.test(source.curatedId)) return false;
  } else if (source.kind === 'saved') {
    if (!Number.isSafeInteger(source.textId) || source.textId < 1 || typeof source.createdAt !== 'string') return false;
  } else return false;
  let id: string;
  try { id = readingProgressId(source); } catch { return false; }
  return row.id === id && typeof row.title === 'string' &&
    typeof row.content === 'string' && row.content.trim().length > 0 &&
    Number.isSafeInteger(row.position) && readingParagraphPositions(row.content).includes(row.position) &&
    (row.purpose === 'main-idea' || row.purpose === 'close-study') &&
    typeof row.highlight === 'boolean' && typeof row.reflection === 'string' && row.reflection.length <= 4000 &&
    typeof row.updatedAt === 'string' && Number.isFinite(Date.parse(row.updatedAt));
}

/** Reject an entire import rather than skip an unreadable place or reflection. */
export function assertReadingProgressRows(rows: unknown): asserts rows is ReadingProgress[] {
  if (!Array.isArray(rows) || !rows.every(isReadingProgress) ||
    new Set(rows.map((row) => row.id)).size !== rows.length) {
    throw new Error('Reading progress is malformed or has duplicate identities. Nothing was restored. Keep the original backup.');
  }
}

export function resolveReadingProgress(progress: ReadingProgress | undefined, source: ReadingSource, content: string) {
  const fresh = createReadingProgress(source, progress?.title ?? '', content);
  if (!progress) return { ...fresh, reason: 'new' as const };
  if (!isReadingProgress(progress)) return { ...fresh, reason: 'invalid' as const };
  if (progress.id !== fresh.id) return { ...fresh, reason: 'different' as const };
  if (progress.content !== content) return { ...progress, content, position: 0, reason: 'changed' as const };
  return { ...progress, reason: 'restored' as const };
}

export function matchesSavedReading(progress: ReadingProgress, text: Text | undefined): boolean {
  const source = progress.source;
  return source.kind === 'saved' && !!text && text.id === source.textId &&
    text.language === source.language && text.createdAt === source.createdAt;
}

async function assertSavedSource(progress: ReadingProgress): Promise<void> {
  if (progress.source.kind === 'saved') {
    const text = await db.texts.get(progress.source.textId);
    if (!matchesSavedReading(progress, text) || text?.content !== progress.content) {
      throw new Error('This saved text was deleted or changed. Reopen it from the library; your previous reading place is unchanged.');
    }
  }
}

/** Reopening reads and preserves the latest support/reflection fields under the same lock. */
export async function openReadingProgress(source: ReadingSource, title: string, content: string) {
  const fresh = createReadingProgress(source, title, content);
  assertReadingProgressRows([fresh]);
  return db.transaction('rw', db.readingProgress, db.texts, async () => {
    await assertSavedSource(fresh);
    const current = await db.readingProgress.get(fresh.id);
    if (current) assertReadingProgressRows([current]);
    const { reason, ...resolved } = resolveReadingProgress(current, source, content);
    const progress = { ...resolved, title, updatedAt: fresh.updatedAt };
    await db.readingProgress.put(progress);
    return { progress, reason };
  });
}

/** A cached row is an optimistic base, never permission to replace unrelated fields. */
export async function saveReadingProgress(base: ReadingProgress, changes?: ReadingProgressChanges): Promise<ReadingProgress> {
  if (changes && Object.keys(changes).some((key) => !['position', 'purpose', 'highlight', 'reflection'].includes(key))) {
    throw new Error('Unsupported reading progress update. No fields were changed.');
  }
  assertReadingProgressRows([{ ...base, ...changes }]);
  return db.transaction('rw', db.readingProgress, db.texts, async () => {
    await assertSavedSource(base);
    const current = await db.readingProgress.get(base.id);
    if (!current) {
      if (changes !== undefined) throw new Error('This reading place was removed. Reopen the text before saving again.');
      await db.readingProgress.add(base);
      return base;
    }
    assertReadingProgressRows([current]);
    if (current.content !== base.content) {
      throw new Error('This text changed in another tab. Reopen it before saving; the newer reading place is unchanged.');
    }
    if (!changes) return current;
    if (Object.hasOwn(changes, 'reflection') && current.reflection !== base.reflection &&
      current.reflection !== changes.reflection) throw new ReadingReflectionConflict(current);
    const next = { ...current, ...changes, updatedAt: new Date().toISOString() };
    await db.readingProgress.put(next);
    return next;
  });
}

export function mergeReadingProgress(existing: ReadingProgress, incoming: ReadingProgress): ReadingProgress {
  if (existing.reflection && incoming.reflection && existing.reflection !== incoming.reflection) {
    throw new Error('Reading reflections conflict. Nothing was restored. Keep both backups and export your current data.');
  }
  const latest = Date.parse(incoming.updatedAt) > Date.parse(existing.updatedAt) ? incoming : existing;
  return { ...latest, reflection: existing.reflection || incoming.reflection };
}
