import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, DB_NAME, CURRENT_SCHEMA_VERSION } from '../db/schema';
import { buildBackupPayload, importAllData, importRecoveryData, normalizePayload } from '../db/backup';
import { createReadingProgress, readingProgressId, type ReadingProgress } from '../db/reading-progress';
import { buildRecoveryCapsule, parseRecoveryCapsule } from '../db/recovery-capsule';

const date = '2026-11-26T00:00:00.000Z';
const content = 'Hola.\n\nOtro párrafo.';
const curated = () => ({
  ...createReadingProgress({ kind: 'curated', language: 'es', curatedId: 'hola' }, 'Hola', content),
  position: content.indexOf('Otro'), purpose: 'close-study' as const, reflection: 'A greeting.', updatedAt: date,
});
const saved = (textId: number) => ({
  ...curated(),
  source: { kind: 'saved' as const, language: 'es', textId, createdAt: date },
  id: readingProgressId({ kind: 'saved', language: 'es', textId, createdAt: date }),
});
beforeEach(async () => { await db.open(); await Promise.all(db.tables.map((table) => table.clear())); });

describe('Reader backup and recovery', () => {
  it('round-trips the exact curated copy, place, purpose and reflection through export, replace and recovery capsule', async () => {
    const progress = curated();
    await db.readingProgress.put(progress);
    const backup = await buildBackupPayload();
    expect(backup.tables.readingProgress).toEqual([progress]);
    const capsule = await buildRecoveryCapsule();
    expect(parseRecoveryCapsule(JSON.stringify(capsule))?.payload.tables.readingProgress).toEqual([progress]);
    await db.readingProgress.clear();
    await importAllData(JSON.stringify(backup));
    expect(await db.readingProgress.get(progress.id)).toEqual(progress);
  });

  it('remaps imported text IDs and captured-word links without matching an unrelated title/date', async () => {
    await db.texts.add({ id: 1, title: 'Saved', language: 'es', content: 'Different content', createdAt: date });
    const progress = saved(1);
    await importAllData(JSON.stringify({
      version: 2, schemaVersion: 13, tables: {
        texts: [{ id: 1, title: 'Saved', language: 'es', content, createdAt: date, translation: 'Hello.' }],
        readingProgress: [progress],
        words: [{ id: 2, language: 'es', word: 'hola', reading: '', meaning: 'hello',
          sourceTextId: 1, contextSentence: 'Hola.', type: 'word', tags: [], createdAt: date }],
      },
    }), 'merge');
    const texts = await db.texts.toArray();
    expect(texts).toHaveLength(2);
    const imported = texts.find((row) => row.content === content)!;
    expect(imported.id).not.toBe(1);
    const restored = (await db.readingProgress.toArray())[0];
    expect(restored.source).toMatchObject({ kind: 'saved', textId: imported.id });
    expect(restored.id).toBe(readingProgressId(restored.source));
    expect((await db.words.toArray())[0].sourceTextId).toBe(imported.id);
    expect(imported.translation).toBe('Hello.');
  });

  it('merges an exact duplicate source and keeps the more recent place without summing progress', async () => {
    await db.texts.add({ id: 8, title: 'Saved', language: 'es', content, createdAt: date });
    const existing = { ...saved(8), position: 0, updatedAt: '2026-11-27T00:00:00.000Z' };
    await db.readingProgress.put(existing);
    await importAllData(JSON.stringify({ version: 2, tables: {
      texts: [{ id: 1, title: 'Saved', language: 'es', content, createdAt: date }],
      readingProgress: [saved(1)],
    } }), 'merge');
    expect(await db.texts.count()).toBe(1);
    expect(await db.readingProgress.toArray()).toEqual([existing]);
  });

  it.each(['replace', 'merge'] as const)('rejects invalid imported progress atomically in %s mode', async (mode) => {
    await db.readingProgress.put(curated());
    for (const invalid of [
      null, { ...curated(), position: -1 }, { ...curated(), position: 1 },
      { ...curated(), id: 'wrong' }, { ...curated(), purpose: 'mastered' },
      { ...curated(), source: { kind: 'curated', language: 'es', curatedId: '../../wrong' } },
    ]) {
      await expect(importAllData(JSON.stringify({
        version: 2, tables: { readingProgress: [invalid], texts: [] },
      }), mode)).rejects.toThrow(/malformed/);
      expect(await db.readingProgress.toArray()).toEqual([curated()]);
    }
    expect(() => normalizePayload({ version: 2, tables: { readingProgress: {} } })).toThrow(/malformed/);
  });

  it('keeps new reading data when an older backup does not carry it, even with reused text IDs', async () => {
    const progress = saved(1);
    await db.readingProgress.put(progress);
    const result = await importAllData(JSON.stringify({ version: 2, schemaVersion: 12, tables: {
      texts: [{ id: 1, title: 'Other import', language: 'es', content: 'Other text', createdAt: '2020-01-01' }],
    } }));
    expect(result.untouchedTables).toContain('readingProgress');
    expect(await db.readingProgress.get(progress.id)).toEqual(progress);
  });

  it('refuses ambiguous orphan merges rather than linking to a local numeric ID', async () => {
    await db.texts.add({ id: 1, title: 'Unrelated', language: 'es', content, createdAt: date });
    await expect(importAllData(JSON.stringify({ version: 2, tables: { readingProgress: [saved(1)] } }), 'merge'))
      .rejects.toThrow(/no matching text/);
    expect(await db.readingProgress.count()).toBe(0);
  });

  it('retains both competing reflections by refusing merge or recovery without modifying live data', async () => {
    await db.readingProgress.put(curated());
    const backup = { version: 2, schemaVersion: 13, exportedAt: date, localStorage: {}, tables: {
      readingProgress: [{ ...curated(), reflection: 'A different reflection.' }],
    } };
    await expect(importAllData(JSON.stringify(backup), 'merge')).rejects.toThrow(/reflections conflict/);
    await expect(importRecoveryData(backup, async () => {})).rejects.toThrow(/reflections conflict/);
    expect(await db.readingProgress.toArray()).toEqual([curated()]);
  });

  it('restores valid missing reading places during recovery and keeps newer live ones', async () => {
    const live = { ...curated(), position: 0, updatedAt: '2026-11-28T00:00:00.000Z' };
    await db.readingProgress.put(live);
    const other = createReadingProgress({ kind: 'curated', language: 'ar', curatedId: 'story' }, 'نص', 'أقرأ.');
    await importRecoveryData({
      version: 2, schemaVersion: 13, exportedAt: date, localStorage: {}, tables: { readingProgress: [curated(), other] },
    }, async () => {});
    expect(await db.readingProgress.get(live.id)).toEqual(live);
    expect(await db.readingProgress.get(other.id)).toEqual(other);
  });

  it('upgrades a real v12 database additively without replaying its historical migration', async () => {
    const stores = Object.fromEntries(db.tables.filter((table) => table.name !== 'readingProgress').map((table) =>
      [table.name, [table.schema.primKey.src, ...table.schema.indexes.map((index) => index.src)].join(', ')]));
    db.close();
    await Dexie.delete(DB_NAME);
    const previous = new Dexie(DB_NAME);
    previous.version(12).stores(stores);
    await previous.open();
    await previous.table('settings').put({ key: 'guided-path-source-v1/es', value: 'original v12 baseline' });
    await previous.table('texts').put({ id: 4, title: 'Retained', content, language: 'es', createdAt: date });
    await previous.table('skillProgress').put({ id: 'es/numbers/basic', language: 'es', activity: 'numbers', skill: 'basic', attempts: 2, correct: 1 });
    previous.close();
    await db.open();
    expect(db.verno).toBe(CURRENT_SCHEMA_VERSION);
    expect((await db.settings.get('guided-path-source-v1/es'))?.value).toBe('original v12 baseline');
    expect((await db.texts.get(4))?.content).toBe(content);
    expect(await db.skillProgress.count()).toBe(1);
    expect(await db.readingProgress.count()).toBe(0);
    const place: ReadingProgress = curated();
    await db.readingProgress.put(place);
    expect(await db.readingProgress.get(place.id)).toEqual(place);
  });
});
