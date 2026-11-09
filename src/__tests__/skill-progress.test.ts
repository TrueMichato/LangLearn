import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, DB_NAME } from '../db/schema';
import { buildBackupPayload, importAllData } from '../db/backup';
import { loadSkillProgress, recordSkillAnswer } from '../db/skill-progress';

beforeEach(async () => {
  await db.skillProgress.clear();
  await db.settings.clear();
});

describe('local skill counters', () => {
  it('updates counters transactionally without transcripts and isolates languages and tasks', async () => {
    await Promise.all([
      recordSkillAnswer('es', 'minimal-pairs', 'es-1', false),
      recordSkillAnswer('es', 'minimal-pairs', 'es-1', true),
    ]);
    await recordSkillAnswer('ar', 'numbers', 'numeral-to-word/ones', true);
    await recordSkillAnswer('ar', 'numbers', 'word-to-numeral/ones', false);
    expect(await loadSkillProgress('es', 'minimal-pairs')).toEqual([{
      id: 'es/minimal-pairs/es-1', language: 'es', activity: 'minimal-pairs', skill: 'es-1',
      attempts: 2, correct: 1,
    }]);
    expect(await loadSkillProgress('es', 'numbers')).toEqual([]);
    expect(await loadSkillProgress('ar', 'numbers')).toHaveLength(2);
  });

  it('round-trips through backups and merges monotonically without double-counting', async () => {
    await recordSkillAnswer('es', 'minimal-pairs', 'es-1', true);
    const payload = await buildBackupPayload();
    expect(payload.tables.skillProgress).toHaveLength(1);
    await db.skillProgress.clear();
    await importAllData(JSON.stringify(payload));
    await recordSkillAnswer('es', 'minimal-pairs', 'es-1', false);
    await importAllData(JSON.stringify(payload), 'merge');
    await importAllData(JSON.stringify(payload), 'merge');
    expect((await loadSkillProgress('es', 'minimal-pairs'))[0]).toMatchObject({ attempts: 2, correct: 1 });
  });

  it('adds one schema upgrade and freezes pre-upgrade evidence before resolving new gates', async () => {
    const stores = Object.fromEntries(db.tables.filter((table) => table.name !== 'skillProgress')
      .map((table) => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map((index) => index.src)].join(', ')]));
    await db.delete();
    const legacy = new Dexie(DB_NAME);
    legacy.version(11).stores(stores);
    await legacy.open();
    await legacy.table('lessonProgress').put({
      id: 'ja/particles', language: 'ja', lessonId: 'particles', completed: true,
      completedAt: '2026-01-01', quizScore: 0, attempts: 1,
    });

    legacy.close();
    await db.open();
    expect(db.verno).toBe(12);
    expect(await db.skillProgress.count()).toBe(0);
    const frozen = JSON.parse((await db.settings.get('guided-path-source-v1/ja'))!.value);
    expect(frozen.progress).toHaveLength(1);
    await db.lessonProgress.clear();
    expect(JSON.parse((await db.settings.get('guided-path-source-v1/ja'))!.value).progress).toHaveLength(1);
  });

  it('restoring old progress in merge mode refreshes compatibility without reading post-upgrade progress', async () => {
    await db.settings.put({ key: 'guided-path-source-v1/ja',
      value: JSON.stringify({ progress: [], activityProgress: [] }) });
    await db.settings.put({ key: 'guided-path-baseline-v2/ja', value: '{}' });
    await importAllData(JSON.stringify({
      version: 2, schemaVersion: 11, tables: {
        lessonProgress: [{ id: 'ja/particles', language: 'ja', lessonId: 'particles', completed: true }],
      },
    }), 'merge');
    expect(await db.settings.get('guided-path-baseline-v2/ja')).toBeUndefined();
    expect(JSON.parse((await db.settings.get('guided-path-source-v1/ja'))!.value).progress)
      .toEqual([{ id: 'ja/particles', language: 'ja', lessonId: 'particles', completed: true }]);
  });

  it('upserts synthesized compatibility settings without clearing omitted live settings on partial old replacement', async () => {
    const frozenDaily = {
      key: 'daily-practice:v1:2026-11-09:ja',
      value: JSON.stringify({ itemIds: ['frozen-word'], questions: [{ prompt: 'Frozen question' }] }),
    };
    const unrelated = { key: 'unrelated-setting', value: 'keep me' };
    const baseline = { key: 'guided-path-baseline-v2/ja',
      value: JSON.stringify({ version: 2, accessibleNodeIds: ['vocab:greetings'], completedLessonIds: [] }) };
    await db.settings.bulkPut([frozenDaily, unrelated, baseline]);

    await importAllData(JSON.stringify({
      version: 2, schemaVersion: 11, tables: { lessonProgress: [] },
    }), 'replace');

    expect(await db.settings.get(frozenDaily.key)).toEqual(frozenDaily);
    expect(await db.settings.get(unrelated.key)).toEqual(unrelated);
    expect(await db.settings.get(baseline.key)).toEqual(baseline);
    expect(await db.lessonProgress.count()).toBe(0);
    expect(JSON.parse((await db.settings.get('guided-path-source-v1/ja'))!.value))
      .toEqual({ progress: [], activityProgress: [] });
    expect(await db.settings.count()).toBe(9); // Three retained settings plus six compatibility sources.
  });

  it('still replaces settings when the old backup explicitly includes that table', async () => {
    await db.settings.put({ key: 'unrelated-setting', value: 'replace me' });
    const progress = { id: 'ja/particles', language: 'ja', lessonId: 'particles', completed: true };
    const incoming = { key: 'restored-setting', value: 'restored' };

    await importAllData(JSON.stringify({
      version: 2, schemaVersion: 11, tables: { settings: [incoming], lessonProgress: [progress] },
    }), 'replace');

    expect(await db.settings.get('unrelated-setting')).toBeUndefined();
    expect(await db.settings.get(incoming.key)).toEqual(incoming);
    expect(JSON.parse((await db.settings.get('guided-path-source-v1/ja'))!.value))
      .toEqual({ progress: [progress], activityProgress: [] });
  });
});
