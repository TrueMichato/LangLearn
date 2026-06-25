import { describe, it, expect } from 'vitest';
import { selectMistakeWordIds, countLapsesByWord } from '../lib/mistakes';
import type { ReviewLogEntry } from '../db/schema';

function log(
  wordId: number,
  isLapse: boolean,
  date: string,
  language = 'ja'
): ReviewLogEntry {
  return {
    reviewId: wordId,
    wordId,
    language,
    grade: isLapse ? 1 : 4,
    isLapse,
    date,
  };
}

describe('selectMistakeWordIds', () => {
  it('includes words whose latest entry is a lapse', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(2, false, '2026-01-01T10:00:00.000Z'),
    ];
    expect(selectMistakeWordIds(logs)).toEqual([1]);
  });

  it('drops recovered words (later success after a lapse)', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(1, false, '2026-01-02T10:00:00.000Z'),
    ];
    expect(selectMistakeWordIds(logs)).toEqual([]);
  });

  it('keeps a word that lapsed again after recovering', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(1, false, '2026-01-02T10:00:00.000Z'),
      log(1, true, '2026-01-03T10:00:00.000Z'),
    ];
    expect(selectMistakeWordIds(logs)).toEqual([1]);
  });

  it('orders by most recent lapse first', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(2, true, '2026-01-03T10:00:00.000Z'),
      log(3, true, '2026-01-02T10:00:00.000Z'),
    ];
    expect(selectMistakeWordIds(logs)).toEqual([2, 3, 1]);
  });

  it('deduplicates by word', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(1, true, '2026-01-02T10:00:00.000Z'),
    ];
    expect(selectMistakeWordIds(logs)).toEqual([1]);
  });
});

describe('countLapsesByWord', () => {
  it('counts only lapse entries per word', () => {
    const logs = [
      log(1, true, '2026-01-01T10:00:00.000Z'),
      log(1, false, '2026-01-02T10:00:00.000Z'),
      log(1, true, '2026-01-03T10:00:00.000Z'),
      log(2, true, '2026-01-01T10:00:00.000Z'),
    ];
    const counts = countLapsesByWord(logs);
    expect(counts.get(1)).toBe(2);
    expect(counts.get(2)).toBe(1);
  });

  it('omits words with no lapses', () => {
    const logs = [log(5, false, '2026-01-01T10:00:00.000Z')];
    expect(countLapsesByWord(logs).has(5)).toBe(false);
  });
});
