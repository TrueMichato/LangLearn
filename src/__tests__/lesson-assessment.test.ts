import { describe, expect, it } from 'vitest';
import {
  PASS_THRESHOLD_PERCENT,
  computeTestOutRange,
  passesAssessment,
  scorePercent,
} from '../lib/lesson-assessment';

const lessons = [
  { id: 'l1' },
  { id: 'l2' },
  { id: 'l3' },
  { id: 'l4' },
  { id: 'l5' },
];

describe('computeTestOutRange', () => {
  it('returns a contiguous range from the next incomplete lesson through the target', () => {
    const completed = new Set(['l1', 'l2']);
    expect(computeTestOutRange(lessons, completed, 'l4')).toEqual(['l3', 'l4']);
  });

  it('returns a single-lesson range when the target is the next incomplete lesson', () => {
    const completed = new Set(['l1', 'l2']);
    expect(computeTestOutRange(lessons, completed, 'l3')).toEqual(['l3']);
  });

  it('includes lessons the learner has never unlocked, since passing grants prerequisites', () => {
    // Nothing completed yet, l3 is locked (l1/l2 aren't done) but testing out
    // through it should still cover l1-l3.
    const completed = new Set<string>();
    expect(computeTestOutRange(lessons, completed, 'l3')).toEqual(['l1', 'l2', 'l3']);
  });

  it('returns null when the target lesson id is not in the track', () => {
    const completed = new Set<string>();
    expect(computeTestOutRange(lessons, completed, 'not-a-lesson')).toBeNull();
  });

  it('returns null when every lesson is already completed', () => {
    const completed = new Set(lessons.map((l) => l.id));
    expect(computeTestOutRange(lessons, completed, 'l3')).toBeNull();
  });

  it('returns null when the target precedes the first incomplete lesson', () => {
    // l1 is done, l2 is not — testing out "through l1" would mean nothing
    // left to skip.
    const completed = new Set(['l1']);
    expect(computeTestOutRange(lessons, completed, 'l1')).toBeNull();
  });

  it('returns null for an empty lesson track', () => {
    expect(computeTestOutRange([], new Set(), 'l1')).toBeNull();
  });

  it('uses an explicit path-ordered lesson set without filling index gaps', () => {
    expect(
      computeTestOutRange(lessons, new Set(), 'l4', ['l2', 'l1', 'l4']),
    ).toEqual(['l2', 'l1', 'l4']);
  });

  it('starts an explicit set at its first incomplete lesson', () => {
    expect(
      computeTestOutRange(
        lessons,
        new Set(['l1']),
        'l4',
        ['l1', 'l2', 'l4'],
      ),
    ).toEqual(['l2', 'l4']);
  });

  it.each([
    ['unknown lesson', ['l1', 'missing', 'l4']],
    ['duplicate lesson', ['l1', 'l1', 'l4']],
    ['wrong endpoint', ['l1', 'l2']],
  ])('rejects an explicit set with an %s', (_label, requested) => {
    expect(computeTestOutRange(lessons, new Set(), 'l4', requested)).toBeNull();
  });
});

describe('scorePercent', () => {
  it('rounds to the nearest whole percent', () => {
    expect(scorePercent(4, 5)).toBe(80);
    expect(scorePercent(1, 3)).toBe(33);
    expect(scorePercent(2, 3)).toBe(67);
  });

  it('returns 0 for a zero-question attempt instead of dividing by zero', () => {
    expect(scorePercent(0, 0)).toBe(0);
  });
});

describe('passesAssessment', () => {
  it('fails just under the threshold', () => {
    expect(passesAssessment(PASS_THRESHOLD_PERCENT - 1)).toBe(false);
  });

  it('passes exactly at the threshold', () => {
    expect(passesAssessment(PASS_THRESHOLD_PERCENT)).toBe(true);
  });

  it('passes above the threshold', () => {
    expect(passesAssessment(PASS_THRESHOLD_PERCENT + 1)).toBe(true);
  });
});
