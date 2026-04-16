import { describe, it, expect } from 'vitest';
import { assignCardType, selectDistractors, shuffle } from '../lib/card-types';

describe('assignCardType', () => {
  it('returns classic for repetitions 0', () => {
    expect(assignCardType(0)).toBe('classic');
  });

  it('returns classic for repetitions 1', () => {
    expect(assignCardType(1)).toBe('classic');
  });

  it('returns classic or reverse for repetitions 2-3', () => {
    const allowed = new Set(['classic', 'reverse']);
    for (let i = 0; i < 50; i++) {
      expect(allowed.has(assignCardType(2))).toBe(true);
      expect(allowed.has(assignCardType(3))).toBe(true);
    }
  });

  it('returns any type for repetitions 4+', () => {
    const allowed = new Set(['classic', 'reverse', 'listening', 'multiple-choice']);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(assignCardType(10));
    }
    // Should eventually produce all types
    for (const t of allowed) {
      expect(seen.has(t)).toBe(true);
    }
  });
});

describe('selectDistractors', () => {
  const pool = [
    { meaning: 'cat' },
    { meaning: 'dog' },
    { meaning: 'bird' },
    { meaning: 'fish' },
    { meaning: 'horse' },
  ];

  it('returns exactly 3 items', () => {
    expect(selectDistractors('cat', pool)).toHaveLength(3);
  });

  it('excludes the correct answer', () => {
    for (let i = 0; i < 20; i++) {
      const result = selectDistractors('cat', pool);
      expect(result).not.toContain('cat');
    }
  });

  it('returns fewer if pool is too small', () => {
    const small = [{ meaning: 'a' }, { meaning: 'b' }];
    expect(selectDistractors('a', small).length).toBeLessThanOrEqual(3);
  });
});

describe('shuffle', () => {
  it('returns same-length array', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result.sort()).toEqual(arr.sort());
  });

  it('does not mutate the original', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
});
