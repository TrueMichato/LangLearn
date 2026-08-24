import { describe, expect, it } from 'vitest';
import { activePathUnitId } from '../lib/path-scroll-context';

const ITEMS = [
  { id: 'one', top: 200, bottom: 500 },
  { id: 'two', top: 520, bottom: 800 },
  { id: 'three', top: 820, bottom: 1100 },
];

describe('activePathUnitId', () => {
  it('uses the unit crossing the activation line', () => {
    expect(activePathUnitId(ITEMS, 640)).toBe('two');
  });

  it('uses the next unit while a phase landmark or gap crosses the line', () => {
    expect(activePathUnitId(ITEMS, 510)).toBe('two');
    expect(activePathUnitId(ITEMS, 100)).toBe('one');
  });

  it('keeps the final unit active at the end of the path', () => {
    expect(activePathUnitId(ITEMS, 1200)).toBe('three');
    expect(activePathUnitId([], 200)).toBeNull();
  });
});
