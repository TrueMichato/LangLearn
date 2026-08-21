import { describe, it, expect } from 'vitest';
import {
  ROUTES,
  ROUTE_PATTERNS,
  grammarLessonRoute,
  grammarTestOutRoute,
  guidedLettersRoute,
  isKnownRoute,
  lettersRoute,
  vocabLessonRoute,
  vocabTestOutRoute,
  LESSON_QUERY_PARAM,
  TEST_OUT_QUERY_PARAM,
} from '../lib/routes';
import { pickNextFocus } from '../lib/next-focus';

const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>;

describe('isKnownRoute', () => {
  it('accepts every registered pattern', () => {
    expect(isKnownRoute('/')).toBe(true);
    expect(isKnownRoute('/grammar')).toBe(true);
    expect(isKnownRoute('/vocab-lessons')).toBe(true);
  });

  it('resolves parameterised routes', () => {
    expect(isKnownRoute(lettersRoute('ja'))).toBe(true);
    expect(isKnownRoute(lettersRoute('ar'))).toBe(true);
    expect(isKnownRoute('/letters')).toBe(false);
  });

  it('ignores query strings and fragments', () => {
    expect(isKnownRoute('/review?deck=mistakes')).toBe(true);
    expect(isKnownRoute('/review#top')).toBe(true);
    expect(isKnownRoute(grammarLessonRoute('particles'))).toBe(true);
    expect(isKnownRoute(vocabLessonRoute('days-months'))).toBe(true);
    expect(isKnownRoute(guidedLettersRoute('ar', 'Vowels & Marks (Ḥarakāt)'))).toBe(true);
  });

  it('resolves test-out deep links on the existing lesson-browser routes', () => {
    expect(isKnownRoute(grammarTestOutRoute('verb-forms'))).toBe(true);
    expect(isKnownRoute(vocabTestOutRoute('days-months'))).toBe(true);
  });

  it('rejects the nested path that used to render a blank page', () => {
    // Regression guard: `/learn/grammar` was referenced by a study suggestion
    // but never registered, and an unmatched child of the Shell layout route
    // renders nothing at all — no header, no nav, no way back.
    expect(isKnownRoute('/learn/grammar')).toBe(false);
    expect(isKnownRoute('/learn/vocab')).toBe(false);
  });
});

describe('route registry', () => {
  const appSource = SOURCES['../App.tsx'];

  it.each(Object.entries(ROUTES))('registers %s (%s) in App.tsx', (key) => {
    expect(appSource).toContain(`path={ROUTES.${key}}`);
  });

  it('registers a catch-all so no path can strand the user', () => {
    expect(appSource).toMatch(/path="\*"/);
    expect(appSource).toMatch(/<Navigate to=\{ROUTES\.dashboard\} replace \/>/);
  });

  it('has no duplicate patterns', () => {
    expect(new Set(ROUTE_PATTERNS).size).toBe(ROUTE_PATTERNS.length);
  });
});

describe('every route referenced in source resolves', () => {
  const literals: Array<{ file: string; route: string }> = [];
  for (const [file, source] of Object.entries(SOURCES)) {
    if (file.includes('__tests__')) continue;
    for (const match of source.matchAll(/route:\s*['"]([^'"]+)['"]/g)) {
      literals.push({ file, route: match[1] });
    }
  }

  it('finds route literals to check', () => {
    expect(literals.length).toBeGreaterThan(0);
  });

  it('resolves all of them', () => {
    const broken = literals.filter((l) => !isKnownRoute(l.route));
    expect(broken).toEqual([]);
  });
});

describe('next-focus routes resolve', () => {
  it('returns registered routes for every branch', () => {
    const cases = [
      { mistakeCount: 3, weakestWordCount: 0 },
      {
        mistakeCount: 0,
        weakestTopic: { topicId: 'particles', retentionPercent: 40, cardCount: 6 },
        weakestWordCount: 5,
      },
      { mistakeCount: 0, weakestWordCount: 9 },
    ];
    for (const input of cases) {
      const cta = pickNextFocus(input);
      if (cta) expect(isKnownRoute(cta.route)).toBe(true);
    }
  });
});

describe('test-out deep links', () => {
  // These are query-param deep links on the *existing* Grammar/Vocabulary
  // routes, not new path routes — any caller (learning path, a study
  // suggestion) can point straight at a test-out attempt without either
  // page gaining a route to keep in sync.
  it('build a testOut query param on the existing grammar/vocab-lessons paths', () => {
    expect(grammarTestOutRoute('verb-forms')).toBe(`${ROUTES.grammar}?${TEST_OUT_QUERY_PARAM}=verb-forms`);
    expect(vocabTestOutRoute('days-months')).toBe(`${ROUTES.vocabLessons}?${TEST_OUT_QUERY_PARAM}=days-months`);
  });

  it('encodes lesson ids that need it', () => {
    expect(grammarTestOutRoute('a/b')).toBe(`${ROUTES.grammar}?${TEST_OUT_QUERY_PARAM}=a%2Fb`);
  });

  it('uses a distinct query param from the plain lesson deep link', () => {
    expect(TEST_OUT_QUERY_PARAM).not.toBe(LESSON_QUERY_PARAM);
    expect(grammarLessonRoute('verb-forms')).not.toBe(grammarTestOutRoute('verb-forms'));
  });
});
