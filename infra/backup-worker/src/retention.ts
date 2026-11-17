export const RECENT_SNAPSHOTS = 8;
export const HOURLY_BUCKETS = 24;
export const DAILY_BUCKETS = 30;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface RetentionCandidate {
  id: string;
  sequence: number;
  storedMs: number;
}

/**
 * Server timestamps choose UTC anchors; sequence resolves ties and identifies
 * the newest captures. Call with the proposed checkpoint included.
 */
export function retainedCheckpointIds(
  candidates: readonly RetentionCandidate[],
  now: number,
  firstNonemptyId: string | null,
  headId: string,
): Set<string> {
  const newest = [...candidates].sort((a, b) => b.sequence - a.sequence);
  const selected = new Set(newest.slice(0, RECENT_SNAPSHOTS).map((item) => item.id));
  selected.add(headId);
  if (firstNonemptyId !== null) selected.add(firstNonemptyId);
  const currentHour = Math.floor(now / HOUR_MS);
  const currentDay = Math.floor(now / DAY_MS);
  const hours = new Set<number>();
  const days = new Set<number>();
  for (const item of newest) {
    const hour = Math.floor(item.storedMs / HOUR_MS);
    const day = Math.floor(item.storedMs / DAY_MS);
    if (hour <= currentHour && hour > currentHour - HOURLY_BUCKETS && !hours.has(hour)) {
      hours.add(hour);
      selected.add(item.id);
    }
    if (day <= currentDay && day > currentDay - DAILY_BUCKETS && !days.has(day)) {
      days.add(day);
      selected.add(item.id);
    }
  }
  return selected;
}
