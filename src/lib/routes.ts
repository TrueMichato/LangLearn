/**
 * Single source of truth for every in-app route.
 *
 * `App.tsx` builds its `<Route>` tree from these constants, and
 * `routes.test.ts` asserts that every route referenced elsewhere in the app
 * (study suggestions, starting points, dashboard links) actually resolves.
 * A path that only exists as a string literal is a blank screen waiting to
 * happen — the router renders nothing for an unmatched child of a layout route.
 */
export const ROUTES = {
  dashboard: '/',
  review: '/review',
  words: '/words',
  reader: '/reader',
  grammar: '/grammar',
  settings: '/settings',
  learn: '/learn',
  vocabLessons: '/vocab-lessons',
  letters: '/letters/:lang',
  listening: '/listening',
  conjugations: '/conjugations',
  sentenceBuilder: '/sentence-builder',
  analytics: '/analytics',
  tests: '/tests',
  dailyChallenge: '/daily-challenge',
  clozePractice: '/cloze-practice',
  minimalPairs: '/minimal-pairs',
  numberPractice: '/number-practice',
  dialects: '/dialects',
  lyrics: '/lyrics',
  translation: '/translation',
} as const;

export const ROUTE_PATTERNS: readonly string[] = Object.values(ROUTES);

/** Build the concrete path for a language's letter practice. */
export function lettersRoute(lang: string): string {
  return `/letters/${lang}`;
}

/**
 * Letter practice opens on the Chart reference wall by default, which is the
 * wrong first impression for someone who has never seen the script. The
 * on-ramp links here instead, so "Learn the letters" opens the guided flow.
 */
export function guidedLettersRoute(lang: string): string {
  return `${lettersRoute(lang)}?mode=learn`;
}

function patternToRegExp(pattern: string): RegExp {
  const source = pattern
    .split('/')
    .map((segment) => (segment.startsWith(':') ? '[^/]+' : escapeRegExp(segment)))
    .join('/');
  return new RegExp(`^${source}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const COMPILED_PATTERNS = ROUTE_PATTERNS.map(patternToRegExp);

/** True when `path` matches a registered route (params included). */
export function isKnownRoute(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0];
  return COMPILED_PATTERNS.some((re) => re.test(clean));
}
