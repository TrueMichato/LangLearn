/**
 * Tiny dependency-free TZ helpers used by the notification planner.
 *
 * In the browser, `Date#setHours` etc. operate in the browser's local TZ — which
 * happens to equal the user's TZ, so the in-app planner has always been correct.
 * In Cloudflare Workers, the runtime is UTC, so the same code schedules at the
 * wrong wall-clock time. These helpers let us interpret wall-clock times in a
 * specific IANA TZ regardless of the runtime, using only `Intl.DateTimeFormat`.
 *
 * The mirror copy at infra/push-worker/src/tz.ts MUST stay in sync.
 */

export interface WallClockParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: number; // 0-6 (Sun..Sat) for parity with Date#getDay
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string): Intl.DateTimeFormat {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    });
    partsCache.set(tz, f);
  }
  return f;
}

/** Returns wall-clock parts of a UTC instant in the given IANA timezone. */
export function partsInTz(utcMs: number, tz: string): WallClockParts {
  const parts = partsFormatter(tz).formatToParts(new Date(utcMs));
  const lookup: Record<string, string> = {};
  for (const p of parts) lookup[p.type] = p.value;
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    // Intl returns "24" instead of "00" for midnight in some Node versions.
    hour: Number(lookup.hour) % 24,
    minute: Number(lookup.minute),
    weekday: WEEKDAY_INDEX[lookup.weekday] ?? 0,
  };
}

/** Offset of `tz` at the given UTC instant, in minutes east of UTC. */
export function tzOffsetMinutes(utcMs: number, tz: string): number {
  const p = partsInTz(utcMs, tz);
  // Build a UTC instant that *represents* the same wall-clock as `p` would in UTC.
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
  // Use only minute precision to avoid second-level drift from Intl rounding.
  return Math.round((asIfUtc - utcMs) / 60_000);
}

/**
 * Converts a wall-clock {y,mo,d,h,mi} **in `tz`** into the corresponding UTC ms.
 *
 * Two-pass solve handles DST: the offset at the *target* instant may differ
 * from the offset at our first guess, so we recompute once with the corrected
 * UTC anchor. (Two passes are sufficient for any standard DST rule — at worst
 * a 1h jump.)
 */
export function wallClockToUtcMs(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  tz: string
): number {
  // First guess: pretend the wall-clock is UTC.
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset1 = tzOffsetMinutes(guess, tz);
  const corrected = guess - offset1 * 60_000;
  const offset2 = tzOffsetMinutes(corrected, tz);
  if (offset2 === offset1) return corrected;
  return guess - offset2 * 60_000;
}

/** YYYY-MM-DD in the user's TZ. */
export function localDateKey(utcMs: number, tz: string): string {
  const p = partsInTz(utcMs, tz);
  const mm = String(p.month).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.year}-${mm}-${dd}`;
}

/** Whole calendar days between two YYYY-MM-DD strings (b - a). */
export function daysBetweenIso(aIso: string, bIso: string): number {
  const a = Date.UTC(
    Number(aIso.slice(0, 4)),
    Number(aIso.slice(5, 7)) - 1,
    Number(aIso.slice(8, 10))
  );
  const b = Date.UTC(
    Number(bIso.slice(0, 4)),
    Number(bIso.slice(5, 7)) - 1,
    Number(bIso.slice(8, 10))
  );
  return Math.round((b - a) / 86_400_000);
}

/** Default TZ — runtime local. In Workers this resolves to "UTC". */
export function defaultTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
