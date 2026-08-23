import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  readRecentLearnActivities,
  recordRecentLearnActivity,
} from '../lib/recent-learn-activities';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('recent Learn activities', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage(),
    });
    vi.restoreAllMocks();
  });

  afterAll(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it('keeps three unique activities in most-recent order', () => {
    recordRecentLearnActivity('/grammar', 1);
    recordRecentLearnActivity('/listening', 2);
    recordRecentLearnActivity('/translation', 3);
    recordRecentLearnActivity('/grammar', 4);
    recordRecentLearnActivity('/lyrics', 5);

    expect(readRecentLearnActivities(6).map((activity) => activity.route)).toEqual([
      '/lyrics',
      '/grammar',
      '/translation',
    ]);
  });

  it('drops activity history after thirty days', () => {
    recordRecentLearnActivity('/grammar', 1);
    expect(
      readRecentLearnActivities(31 * 24 * 60 * 60 * 1000),
    ).toEqual([]);
  });

  it('rejects non-route values', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(recordRecentLearnActivity('https://example.com')).toBe(false);
    expect(error).toHaveBeenCalled();
  });
});
