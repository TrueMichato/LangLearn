const STORAGE_KEY = 'langlearn-recent-learn-activities';
const MAX_RECENT = 3;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface RecentActivity {
  route: string;
  openedAt: number;
}

function storage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function isRecentActivity(value: unknown): value is RecentActivity {
  if (!value || typeof value !== 'object') return false;
  const activity = value as Partial<RecentActivity>;
  return (
    typeof activity.route === 'string' &&
    activity.route.startsWith('/') &&
    typeof activity.openedAt === 'number'
  );
}

export function readRecentLearnActivities(
  now = Date.now(),
): RecentActivity[] {
  const target = storage();
  if (!target) return [];
  const raw = target.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn('Ignored malformed recent Learn activity data');
      target.removeItem(STORAGE_KEY);
      return [];
    }
    const valid = parsed
      .filter(isRecentActivity)
      .filter((activity) => now - activity.openedAt <= MAX_AGE_MS)
      .sort((a, b) => b.openedAt - a.openedAt)
      .slice(0, MAX_RECENT);
    if (valid.length !== parsed.length) {
      target.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch (error) {
    console.warn('Could not read recent Learn activity data', error);
    target.removeItem(STORAGE_KEY);
    return [];
  }
}

export function recordRecentLearnActivity(
  route: string,
  now = Date.now(),
): boolean {
  if (!route.startsWith('/')) {
    console.error('Refused to record an invalid Learn activity route');
    return false;
  }
  const target = storage();
  if (!target) return false;
  const next = [
    { route, openedAt: now },
    ...readRecentLearnActivities(now).filter(
      (activity) => activity.route !== route,
    ),
  ].slice(0, MAX_RECENT);
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch (error) {
    console.error('Could not save recent Learn activity', error);
    return false;
  }
}

