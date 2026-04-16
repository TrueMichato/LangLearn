import { describe, it, expect } from 'vitest';
import { applyStress, stressMap } from '../lib/russian-stress';

describe('russian-stress', () => {
  it('returns stressed form for known words', () => {
    expect(applyStress('молоко')).toBe('молоко\u0301');
    expect(applyStress('собака')).toBe('соба\u0301ка');
    expect(applyStress('говорить')).toBe('говори\u0301ть');
    expect(applyStress('спасибо')).toBe('спаси\u0301бо');
    expect(applyStress('большой')).toBe('большо\u0301й');
  });

  it('returns unknown words unchanged', () => {
    expect(applyStress('фывапролд')).toBe('фывапролд');
    expect(applyStress('hello')).toBe('hello');
    expect(applyStress('')).toBe('');
  });

  it('is case insensitive', () => {
    expect(applyStress('Молоко')).toBe('молоко\u0301');
    expect(applyStress('СОБАКА')).toBe('соба\u0301ка');
    expect(applyStress('Говорить')).toBe('говори\u0301ть');
  });

  it('contains 200+ entries', () => {
    expect(stressMap.size).toBeGreaterThanOrEqual(200);
  });
});
