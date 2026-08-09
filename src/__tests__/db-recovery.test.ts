import { describe, it, expect } from 'vitest';
import {
  classifyOpenError,
  needsPreUpgradeSnapshot,
  MAX_SNAPSHOTS,
  snapshotProgressRows,
  suspectsDataLoss,
} from '../db/recovery';

describe('classifyOpenError', () => {
  it('recognises a stale bundle by error name', () => {
    // The data is completely intact in this case, and telling the learner so is
    // the difference between "reload" and "clear site data".
    const err = Object.assign(new Error('boom'), { name: 'VersionError' });
    expect(classifyOpenError(err)).toEqual({ kind: 'version-mismatch', error: err });
  });

  it('recognises a stale bundle by message when the name is missing', () => {
    const err = new Error(
      'The requested version (9) is less than the existing version (10).',
    );
    expect(classifyOpenError(err).kind).toBe('version-mismatch');
  });

  it('classifies anything else as a generic failure', () => {
    expect(classifyOpenError(new Error('aborted')).kind).toBe('failed');
  });

  it('wraps a non-Error rejection', () => {
    const status = classifyOpenError('something odd');
    expect(status.kind).toBe('failed');
    expect((status as { error: Error }).error).toBeInstanceOf(Error);
  });
});

describe('needsPreUpgradeSnapshot', () => {
  it('snapshots when an upgrade is pending', () => {
    expect(needsPreUpgradeSnapshot(9, 10)).toBe(true);
  });

  it('does not snapshot a fresh install', () => {
    expect(needsPreUpgradeSnapshot(0, 10)).toBe(false);
  });

  it('does not snapshot when already current', () => {
    expect(needsPreUpgradeSnapshot(10, 10)).toBe(false);
  });

  it('does not snapshot when the stored db is newer', () => {
    expect(needsPreUpgradeSnapshot(11, 10)).toBe(false);
  });
});

describe('snapshot retention', () => {
  it('keeps a bounded number of copies', () => {
    // Snapshots are full copies and compete with the learner's own data for the
    // origin quota, so the cap has to stay small.
    expect(MAX_SNAPSHOTS).toBeGreaterThan(0);
    expect(MAX_SNAPSHOTS).toBeLessThanOrEqual(5);
  });
});


describe('snapshotProgressRows', () => {
  const payload = (tables: Record<string, unknown[]>) => JSON.stringify({ tables });

  it('counts rows across every progress table', () => {
    expect(
      snapshotProgressRows(
        payload({ words: [1, 2, 3], reviews: [1], badges: [1], dailyActivity: [1, 2] }),
      ),
    ).toBe(7);
  });

  it('ignores tables that do not represent progress', () => {
    // Settings and texts can be legitimately empty for a long-time learner, so
    // counting them would make an empty database look populated.
    expect(snapshotProgressRows(payload({ settings: [1, 2], texts: [1] }))).toBe(0);
  });

  it('treats an unreadable payload as empty rather than throwing', () => {
    expect(snapshotProgressRows('not json')).toBe(0);
  });
});

describe('suspectsDataLoss', () => {
  const base = {
    liveProgressRows: 0,
    snapshotProgressRows: 40,
    dismissedFor: null as string | null,
    snapshotCreatedAt: '2025-01-02T00:00:00.000Z',
  };

  it('fires when the database is empty but a snapshot holds progress', () => {
    expect(suspectsDataLoss(base)).toBe(true);
  });

  it('stays quiet when the learner still has data', () => {
    expect(suspectsDataLoss({ ...base, liveProgressRows: 1 })).toBe(false);
  });

  it('stays quiet for a brand new learner with no snapshot content', () => {
    // A first-run user must never be shown a recovery screen.
    expect(suspectsDataLoss({ ...base, snapshotProgressRows: 0 })).toBe(false);
  });

  it('stays quiet once dismissed for that snapshot', () => {
    expect(suspectsDataLoss({ ...base, dismissedFor: base.snapshotCreatedAt })).toBe(false);
  });

  it('fires again when a newer snapshot appears after an old dismissal', () => {
    // Dismissing "I meant to reset" should not silence a genuine later loss.
    expect(suspectsDataLoss({ ...base, dismissedFor: '2024-01-01T00:00:00.000Z' })).toBe(true);
  });
});
