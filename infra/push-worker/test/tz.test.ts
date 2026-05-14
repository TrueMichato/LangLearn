import { describe, it, expect } from 'vitest';
import {
  partsInTz,
  wallClockToUtcMs,
  localDateKey,
  daysBetweenIso,
  tzOffsetMinutes,
} from '../src/tz';

describe('tz helpers', () => {
  it('partsInTz returns local wall-clock for the given TZ', () => {
    const utc = Date.UTC(2025, 0, 10, 5, 0, 0); // 2025-01-10 05:00 UTC
    const p = partsInTz(utc, 'Asia/Jerusalem');
    expect(p).toMatchObject({ year: 2025, month: 1, day: 10, hour: 7, minute: 0, weekday: 5 });
  });

  it('wallClockToUtcMs round-trips through partsInTz', () => {
    const ms = wallClockToUtcMs(2025, 1, 10, 9, 0, 'Asia/Jerusalem');
    expect(new Date(ms).toISOString()).toBe('2025-01-10T07:00:00.000Z');
    const p = partsInTz(ms, 'Asia/Jerusalem');
    expect(p.hour).toBe(9);
    expect(p.minute).toBe(0);
  });

  it('wallClockToUtcMs handles DST spring-forward in America/New_York', () => {
    // 2025-03-09 02:00 → 03:00 EST→EDT (-5 → -4). 03:30 EDT = 07:30 UTC.
    const ms = wallClockToUtcMs(2025, 3, 9, 3, 30, 'America/New_York');
    expect(new Date(ms).toISOString()).toBe('2025-03-09T07:30:00.000Z');
  });

  it('localDateKey rolls over at local midnight, not UTC midnight', () => {
    // 22:30 UTC on 2025-01-10 = 00:30 next day in Jerusalem (UTC+2).
    const utc = Date.UTC(2025, 0, 10, 22, 30, 0);
    expect(localDateKey(utc, 'Asia/Jerusalem')).toBe('2025-01-11');
    expect(localDateKey(utc, 'UTC')).toBe('2025-01-10');
  });

  it('daysBetweenIso counts whole calendar days', () => {
    expect(daysBetweenIso('2025-01-10', '2025-01-11')).toBe(1);
    expect(daysBetweenIso('2025-01-10', '2025-01-10')).toBe(0);
    expect(daysBetweenIso('2025-01-10', '2025-01-17')).toBe(7);
    expect(daysBetweenIso('2025-02-28', '2025-03-01')).toBe(1);
  });

  it('tzOffsetMinutes returns expected sign and magnitude', () => {
    const winter = Date.UTC(2025, 0, 10, 12, 0, 0);
    expect(tzOffsetMinutes(winter, 'Asia/Jerusalem')).toBe(120); // UTC+2
    expect(tzOffsetMinutes(winter, 'UTC')).toBe(0);
    expect(tzOffsetMinutes(winter, 'America/New_York')).toBe(-300); // UTC-5
  });
});
