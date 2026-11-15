import { describe, expect, it } from 'vitest';
import baselineJson from './fixtures/grammar-retention-legacy.json';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import {
  indexedLessonIds,
  RETENTION_LANGUAGES,
  scopeRetentionCatalog,
  validateLegacyLesson,
  validateRetentionCatalog,
  validateReviewItemQuality,
  type LegacyBaseline,
} from './helpers/grammar-retention';

const BASELINE: LegacyBaseline = baselineJson;
const INDEXES = import.meta.glob('../../public/content/grammar/{ja,ar,es,pt,ro}/index.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const LESSONS = import.meta.glob('../../public/content/grammar/{ja,ar,es,pt,ro}/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
// Deliberately excludes grammar-retention-legacy.json. These are reviewed
// teaching contracts, not snapshots generated from whatever the parser finds.
const INVENTORIES = import.meta.glob('./fixtures/grammar-retention/**/*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const PILOT_KEYS = [
  'ja/taekim-verb-classification', 'ar/masdar', 'es/cheatsheet-accent-rules',
  'pt/gerund-progressive', 'ro/cognates-false-friends',
];

const indexes = Object.fromEntries(Object.entries(INDEXES)
  .map(([path, raw]) => [path.split('/').at(-2)!, raw]));
const lessons = Object.fromEntries(Object.entries(LESSONS)
  .map(([path, raw]) => [path.split('/').slice(-2).join('/').replace(/\.md$/, ''), raw]));
const inventories = Object.fromEntries(Object.entries(INVENTORIES)
  .map(([path, raw]) => [path.replace('./fixtures/grammar-retention/', ''), raw]));
const catalog = { indexes, lessons, inventories, baseline: BASELINE };

function expectNoFailures(errors: string[]) {
  const missing = errors.filter((error) => error.includes('missing reviewed lesson inventory'));
  const actionable = errors.filter((error) => !error.includes('missing reviewed lesson inventory'));
  expect([...actionable, ...missing].slice(0, 40),
    `${errors.length} failure(s), including ${missing.length} missing inventories; showing the first 40`).toEqual([]);
}

describe('grammar retention legacy and assessment protection', () => {
  for (const language of RETENTION_LANGUAGES) {
    it(`preserves every indexed ${language} asset, baseline identity, and authored quiz sequence`, () => {
      const ids = indexedLessonIds(indexes[language]);
      const keys = ids.map((id) => `${language}/${id}`);
      const baselineKeys = Object.keys(BASELINE.lessons).filter((key) => key.startsWith(`${language}/`));
      expect(keys.toSorted()).toEqual(baselineKeys.toSorted());
      const errors = keys.flatMap((key) => {
        const markdown = lessons[key];
        if (!markdown?.trim()) return [`${key}: missing/empty indexed lesson asset`];
        return validateLegacyLesson(markdown, BASELINE.lessons[key], key).map((error) => `${key}: ${error}`);
      });
      expectNoFailures(errors);
    });
  }
});

describe('complete reviewed grammar retention catalog', () => {
  it('covers every indexed lesson exactly once with valid, semantically stable authored material', () => {
    expectNoFailures(validateRetentionCatalog(catalog));
  }, 60_000);
});

describe('language-scoped grammar retention catalogs', () => {
  for (const language of RETENTION_LANGUAGES) {
    it(`complete ${language} catalog`, () => {
      expectNoFailures(validateRetentionCatalog(scopeRetentionCatalog(catalog, language), [language]));
    }, 60_000);
  }
});

describe('grammar retention pilot review fronts', () => {
  it('keeps answers hidden and cloze reconstruction usable independently of inventory rollout', () => {
    const errors = PILOT_KEYS.flatMap((key) =>
      parseLessonReviewItems(lessons[key]).items
        .filter((item) => item.provenance === 'authored')
        .flatMap((item) => validateReviewItemQuality(item).map((error) => `${key}: ${error}`)));
    expectNoFailures(errors);
  });
});
