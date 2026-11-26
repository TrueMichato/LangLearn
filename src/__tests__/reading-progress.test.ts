import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/schema';
import { deleteText } from '../db/texts';
import {
  createReadingProgress, isReadingProgress, paragraphPositionAt, readingParagraphPositions,
  readingProgressId, resolveReadingProgress, saveReadingProgress,
} from '../db/reading-progress';

beforeEach(async () => { await Promise.all(db.tables.map((table) => table.clear())); });

describe('durable Reader places', () => {
  const content = '  Hola, mundo.\n\n  Otro párrafo.\r\n';
  const source = { kind: 'curated' as const, language: 'es', curatedId: 'hello' };

  it('restores a semantic paragraph, purpose and optional reflection without scoring', async () => {
    const progress = createReadingProgress(source, 'Hola', content);
    progress.position = paragraphPositionAt(content, content.indexOf('párrafo'));
    progress.purpose = 'close-study';
    progress.reflection = 'A greeting and another thought.';
    await saveReadingProgress(progress);
    const restored = await db.readingProgress.get(progress.id);
    expect(resolveReadingProgress(restored, source, content)).toMatchObject({
      position: content.indexOf('Otro'), purpose: 'close-study', reflection: progress.reflection,
    });
    expect(await db.words.count()).toBe(0);
    expect(await db.reviews.count()).toBe(0);
    expect(await db.testHistory.count()).toBe(0);
  });

  it('does not restore a position to changed content or a different identity', () => {
    const progress = { ...createReadingProgress(source, 'Hola', content), position: content.indexOf('Otro') };
    expect(resolveReadingProgress(progress, source, 'A replacement.')).toMatchObject({ position: 0, reason: 'changed' });
    expect(resolveReadingProgress(progress, { ...source, language: 'pt' }, content)).toMatchObject({
      position: 0, reason: 'different',
    });
    expect(readingProgressId(source)).not.toBe(readingProgressId({ ...source, language: 'pt' }));
  });

  it('uses original offsets for Arabic, emoji, CRLF and blank lines', () => {
    const original = '🐈 كلمة.\r\n\r\n  ثانية!\n';
    expect(readingParagraphPositions(original)).toEqual([0, original.indexOf('ثانية')]);
    expect(paragraphPositionAt(original, original.length - 1)).toBe(original.indexOf('ثانية'));
  });

  it('updates only the requested field when another tab has saved reflection and reading preferences', async () => {
    const stale = createReadingProgress(source, 'Hola', content);
    await saveReadingProgress(stale);
    await db.readingProgress.put({ ...stale, reflection: 'My saved reflection', purpose: 'close-study', highlight: true });
    const position = content.indexOf('Otro');
    await saveReadingProgress({ ...stale, position }, { position });
    expect(await db.readingProgress.get(stale.id)).toMatchObject({
      position, reflection: 'My saved reflection', purpose: 'close-study', highlight: true,
    });
  });

  it('refuses a stale reflection edit transactionally rather than replacing another tab’s work', async () => {
    const stale = createReadingProgress(source, 'Hola', content);
    await saveReadingProgress(stale);
    await db.readingProgress.put({ ...stale, reflection: 'Other tab’s thought.' });
    await expect(saveReadingProgress(stale, { reflection: 'My draft.', position: content.indexOf('Otro') }))
      .rejects.toMatchObject({ name: 'ReadingReflectionConflict', current: { reflection: 'Other tab’s thought.' } });
    expect(await db.readingProgress.get(stale.id)).toMatchObject({ position: 0, reflection: 'Other tab’s thought.' });
  });

  it('serializes competing reflection edits and permits clearing only against the observed saved value', async () => {
    const base = createReadingProgress(source, 'Hola', content);
    await saveReadingProgress(base);
    const results = await Promise.allSettled([
      saveReadingProgress(base, { reflection: 'First thought.' }),
      saveReadingProgress(base, { reflection: 'Second thought.' }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const current = (await db.readingProgress.get(base.id))!;
    await expect(saveReadingProgress(base, { reflection: '' })).rejects.toMatchObject({ name: 'ReadingReflectionConflict' });
    await saveReadingProgress(current, { reflection: '' });
    expect((await db.readingProgress.get(base.id))?.reflection).toBe('');
  });

  it('refuses malformed records instead of discarding them or moving to an invented position', () => {
    const valid = createReadingProgress(source, 'Hola', content);
    for (const changes of [
      { position: -1 }, { position: 1.5 }, { position: content.length + 1 },
      { position: content.indexOf('párrafo') }, { purpose: 'fluent' },
      { source: { ...source, curatedId: '../other' } }, { updatedAt: 'invalid' },
      { id: 'curated/es/wrong' }, { reflection: 5 }, { content: '' },
    ]) expect(isReadingProgress({ ...valid, ...changes })).toBe(false);
    expect(isReadingProgress(valid)).toBe(true);
  });

  it('deletes only the saved text’s progress, atomically, and refuses writes after deletion', async () => {
    const id = await db.texts.add({ title: 'Saved', language: 'es', content, createdAt: '2026-11-26T00:00:00.000Z' }) as number;
    const saved = createReadingProgress({ kind: 'saved', language: 'es', textId: id, createdAt: '2026-11-26T00:00:00.000Z' }, 'Saved', content);
    const curated = createReadingProgress(source, 'Hola', content);
    await saveReadingProgress(saved);
    await saveReadingProgress(curated);
    await deleteText(id);
    expect(await db.readingProgress.get(saved.id)).toBeUndefined();
    expect(await db.readingProgress.get(curated.id)).toEqual(curated);
    await expect(saveReadingProgress(saved)).rejects.toThrow(/deleted|changed/i);
    expect(await db.readingProgress.get(saved.id)).toBeUndefined();
  });
});
