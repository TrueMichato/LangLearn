import { describe, it, expect } from 'vitest';
import { sm2, type SM2State } from '../lib/sm2';

const fresh: SM2State = { ease: 2.5, interval: 0, repetitions: 0 };

describe('SM-2 algorithm', () => {
  it('first correct answer gives interval=1, repetitions=1', () => {
    const result = sm2(fresh, 4);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('second correct answer gives interval=6', () => {
    const after1 = sm2(fresh, 4);
    const after2 = sm2(after1, 4);
    expect(after2.interval).toBe(6);
    expect(after2.repetitions).toBe(2);
  });

  it('third correct answer multiplies interval by ease', () => {
    const after1 = sm2(fresh, 4);
    const after2 = sm2(after1, 4);
    const after3 = sm2(after2, 4);
    expect(after3.interval).toBeGreaterThan(6);
    expect(after3.repetitions).toBe(3);
  });

  it('failing resets repetitions and interval', () => {
    const after1 = sm2(fresh, 4);
    const after2 = sm2(after1, 4);
    const failed = sm2(after2, 1);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(0);
  });

  it('grade 5 (easy) increases ease factor', () => {
    const result = sm2(fresh, 5);
    expect(result.ease).toBeGreaterThan(2.5);
  });

  it('grade 3 (hard but correct) decreases ease factor', () => {
    const result = sm2(fresh, 3);
    expect(result.ease).toBeLessThan(2.5);
  });

  it('ease never drops below 1.3', () => {
    let state = fresh;
    for (let i = 0; i < 20; i++) {
      state = sm2(state, 0);
    }
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });
});
