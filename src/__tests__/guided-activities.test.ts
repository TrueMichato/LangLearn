import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  completeGuidedActivityMilestone,
  guidedActivityProgressId,
  loadGuidedActivityProgress,
  recordGuidedActivityAttempt,
} from '../db/guided-activities';
import { importAllData } from '../db/backup';
import { db } from '../db/schema';

beforeEach(async () => {
  await db.guidedActivityProgress.clear();
});

afterEach(async () => {
  await db.guidedActivityProgress.clear();
});

describe('guided activity progress', () => {
  it('records attempts idempotently on one stable row', async () => {
    const input = {
      language: 'es',
      milestoneId: 'sentence:foundations-1',
      activity: 'sentence' as const,
    };
    await recordGuidedActivityAttempt({
      ...input,
      itemsCompleted: 7,
      score: 60,
    });
    const row = await recordGuidedActivityAttempt({
      ...input,
      itemsCompleted: 4,
      score: 50,
    });

    expect(await db.guidedActivityProgress.count()).toBe(1);
    expect(row).toMatchObject({
      id: guidedActivityProgressId('es', 'sentence:foundations-1'),
      attempts: 2,
      itemsCompleted: 7,
      bestScore: 60,
    });
  });

  it('completes a milestone once while retaining the strongest result', async () => {
    const first = await completeGuidedActivityMilestone({
      language: 'ar',
      milestoneId: 'listening:unit-1',
      activity: 'listening',
      itemsCompleted: 3,
      score: 70,
      completedAt: '2026-01-01T00:00:00.000Z',
    });
    const second = await completeGuidedActivityMilestone({
      language: 'ar',
      milestoneId: 'listening:unit-1',
      activity: 'listening',
      itemsCompleted: 5,
      score: 90,
      completedAt: '2026-02-01T00:00:00.000Z',
    });

    expect(first.completedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(second).toMatchObject({
      completedAt: '2026-01-01T00:00:00.000Z',
      itemsCompleted: 5,
      bestScore: 90,
      attempts: 0,
    });
    expect(await db.guidedActivityProgress.count()).toBe(1);
  });

  it('loads only the requested language', async () => {
    await completeGuidedActivityMilestone({
      language: 'ja',
      milestoneId: 'reading:unit-1',
      activity: 'reading',
      itemsCompleted: 1,
    });
    await completeGuidedActivityMilestone({
      language: 'ru',
      milestoneId: 'reading:unit-1',
      activity: 'reading',
      itemsCompleted: 1,
    });

    expect(await loadGuidedActivityProgress('ja')).toHaveLength(1);
  });

  it('merges restored progress monotonically', async () => {
    await db.guidedActivityProgress.put({
      id: 'es/sentence:foundations-1',
      language: 'es',
      milestoneId: 'sentence:foundations-1',
      activity: 'sentence',
      completedAt: null,
      attempts: 2,
      itemsCompleted: 4,
      bestScore: 40,
    });

    await importAllData(
      JSON.stringify({
        version: 2,
        exportedAt: '2026-01-01T00:00:00.000Z',
        schemaVersion: 11,
        tables: {
          guidedActivityProgress: [
            {
              id: 'es/sentence:foundations-1',
              language: 'es',
              milestoneId: 'sentence:foundations-1',
              activity: 'sentence',
              completedAt: '2026-01-01T00:00:00.000Z',
              attempts: 1,
              itemsCompleted: 10,
              bestScore: 90,
            },
          ],
        },
        localStorage: {},
      }),
      'merge',
    );

    expect(
      await db.guidedActivityProgress.get('es/sentence:foundations-1'),
    ).toMatchObject({
      completedAt: '2026-01-01T00:00:00.000Z',
      attempts: 2,
      itemsCompleted: 10,
      bestScore: 90,
    });
  });
});
