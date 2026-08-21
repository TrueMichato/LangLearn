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
  achievements: '/achievements',
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
export function guidedLettersRoute(lang: string, alphabet?: string): string {
  const params = new URLSearchParams({ mode: 'learn' });
  if (alphabet) params.set('alphabet', alphabet);
  return `${lettersRoute(lang)}?${params.toString()}`;
}

/**
 * Query-param names the lesson browsers read on `ROUTES.grammar` and
 * `ROUTES.vocabLessons`. These are deep links on the *existing* routes
 * rather than new paths, so any caller — the learning path, a study
 * suggestion, a future feature — can jump straight into a specific lesson
 * or straight into a test-out attempt without either page gaining a new
 * route to keep in sync.
 */
export const LESSON_QUERY_PARAM = 'lesson';
export const TEST_OUT_QUERY_PARAM = 'testOut';

export function grammarLessonRoute(lessonId: string): string {
  return `${ROUTES.grammar}?${LESSON_QUERY_PARAM}=${encodeURIComponent(lessonId)}`;
}

export function vocabLessonRoute(lessonId: string): string {
  return `${ROUTES.vocabLessons}?${LESSON_QUERY_PARAM}=${encodeURIComponent(lessonId)}`;
}

/**
 * Deep link that opens Grammar with a test-out attempt already selected,
 * running from the learner's next incomplete lesson through `uptoLessonId`.
 */
export function grammarTestOutRoute(uptoLessonId: string): string {
  return `${ROUTES.grammar}?${TEST_OUT_QUERY_PARAM}=${encodeURIComponent(uptoLessonId)}`;
}

/** Same as {@link grammarTestOutRoute}, for the Vocabulary lesson browser. */
export function vocabTestOutRoute(uptoLessonId: string): string {
  return `${ROUTES.vocabLessons}?${TEST_OUT_QUERY_PARAM}=${encodeURIComponent(uptoLessonId)}`;
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
