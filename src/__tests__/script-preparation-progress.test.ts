import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/schema';
import { exportAllData, importAllData } from '../db/backup';
import { deferScriptPreparation, loadScriptPreparationDeferred } from '../lib/guided-learning-progress';
import { loadLearningPath } from '../lib/learning-path';
import { resolveHomePrimaryAction } from '../lib/home-primary-action';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';

const indexes = import.meta.glob('../../public/content/{grammar,vocab}/*/index.json',
  { eager: true, import: 'default' }) as Record<string, unknown>;

beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => indexes[`../../public/${url.slice(url.indexOf('content/'))}`],
  })));
  await Promise.all(db.tables.map((table) => table.clear()));
});
afterEach(() => vi.unstubAllGlobals());

describe('persisted script continuation', () => {
  it.each(['ja', 'ru', 'ar'])('%s preserves real progress and recommends words after a fresh load', async (language) => {
    const before = await loadLearningPath(language);
    expect(before?.recommendedNodeId).toMatch(/^letters:/);
    const learningTables = db.tables.filter((table) => table.name !== 'settings');
    const records = await Promise.all(learningTables.map((table) => table.toArray()));
    const settings = useSettingsStore.getState();
    const xp = useXPStore.getState();

    await deferScriptPreparation(language);
    expect(await loadScriptPreparationDeferred(language)).toBe(true);
    expect(await loadScriptPreparationDeferred('es')).toBe(false);
    expect(await Promise.all(learningTables.map((table) => table.toArray()))).toEqual(records);
    expect(useSettingsStore.getState()).toBe(settings);
    expect(useXPStore.getState()).toBe(xp);

    const after = await loadLearningPath(language);
    expect(after?.recommendedNodeId).toBe('vocab:greetings');
    expect(after?.units[0].nodes).toEqual(before?.units[0].nodes);
    expect(after?.completedCount).toBe(0);
    expect(resolveHomePrimaryAction({
      dueCards: 0, language, learning: { status: 'ready', attempt: null, path: after },
    })).toMatchObject({ kind: 'path', route: '/vocab-lessons?lesson=greetings' });

    // Visiting preparation again is a read, not a reversal of the learner's choice.
    expect((await loadLearningPath(language))?.recommendedNodeId).toBe('vocab:greetings');
  });

  it('does not interpret other stored values as a choice to defer', async () => {
    await db.settings.put({ key: 'guided-script-deferred-v1/ja', value: '{"completed":true}' });
    expect(await loadScriptPreparationDeferred('ja')).toBe(false);
  });

  it.each(['replace', 'merge'] as const)('retains the navigation choice through %s backup restore without inventing progress', async (mode) => {
    await deferScriptPreparation('ru');
    const backup = await exportAllData();
    await db.settings.clear();
    expect(await loadScriptPreparationDeferred('ru')).toBe(false);
    await importAllData(backup, mode);
    expect(await loadScriptPreparationDeferred('ru')).toBe(true);
    expect(await db.lessonProgress.count()).toBe(0);
    expect(await db.characterProgress.count()).toBe(0);
    expect((await loadLearningPath('ru'))?.recommendedNodeId).toBe('vocab:greetings');
  });
});
