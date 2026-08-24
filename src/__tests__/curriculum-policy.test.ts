import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_CAPABILITIES,
  GUIDED_ACTIVITY_KINDS,
} from '../lib/activity-capabilities';
import {
  AR_DIALECT_GRAMMAR,
  classifyCatalogEntry,
  CURRICULUM_LANGUAGES,
  type CatalogPolicyEntry,
  type CurriculumLanguage,
} from '../lib/curriculum-policy';
import { isKnownRoute } from '../lib/routes';

const GRAMMAR_INDEXES = import.meta.glob(
  '../../public/content/grammar/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, CatalogPolicyEntry[]>;
const VOCAB_INDEXES = import.meta.glob(
  '../../public/content/vocab/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, CatalogPolicyEntry[]>;

function indexFor(
  indexes: Record<string, CatalogPolicyEntry[]>,
  language: CurriculumLanguage,
): CatalogPolicyEntry[] {
  const match = Object.entries(indexes).find(([path]) =>
    path.endsWith(`/${language}/index.json`),
  );
  if (!match) throw new Error(`Missing ${language} catalog`);
  return match[1];
}

describe('curriculum classification policy', () => {
  it.each(CURRICULUM_LANGUAGES)(
    'classifies every %s grammar and vocabulary catalog entry',
    (language) => {
      for (const entry of indexFor(GRAMMAR_INDEXES, language)) {
        expect(() =>
          classifyCatalogEntry(language, 'grammar', entry),
        ).not.toThrow();
      }
      for (const entry of indexFor(VOCAB_INDEXES, language)) {
        expect(() =>
          classifyCatalogEntry(language, 'vocab', entry),
        ).not.toThrow();
      }
    },
  );

  it('keeps canonical Japanese grammar required and reference catalogs enrichment', () => {
    const entries = indexFor(GRAMMAR_INDEXES, 'ja');
    const particles = entries.find((entry) => entry.id === 'particles');
    const tofuguCore = entries.find((entry) => entry.id === 'tofugu-particle-wa');
    const tofuguReference = entries.find(
      (entry) => entry.id === 'tofugu-particle-kara',
    );
    const taeKim = entries.find(
      (entry) => entry.id === 'taekim-state-of-being',
    );

    expect(classifyCatalogEntry('ja', 'grammar', particles!)).toEqual({
      requirement: 'required',
    });
    expect(classifyCatalogEntry('ja', 'grammar', tofuguCore!)).toEqual({
      requirement: 'required',
    });
    expect(classifyCatalogEntry('ja', 'grammar', tofuguReference!)).toEqual({
      requirement: 'enrichment',
    });
    expect(classifyCatalogEntry('ja', 'grammar', taeKim!)).toEqual({
      requirement: 'enrichment',
    });
    expect(() =>
      classifyCatalogEntry('ja', 'grammar', { id: 'new-unknown-reference' }),
    ).toThrow(/Unclassified/);
    expect(
      entries.filter(
        (entry) =>
          classifyCatalogEntry('ja', 'grammar', entry).requirement ===
          'required',
      ),
    ).toHaveLength(50);
    expect(
      entries.filter(
        (entry) =>
          classifyCatalogEntry('ja', 'grammar', entry).requirement ===
          'enrichment',
      ),
    ).toHaveLength(129);
    expect(
      entries
        .filter(
          (entry) =>
            classifyCatalogEntry('ja', 'grammar', entry).requirement ===
            'enrichment',
        )
        .every(
          (entry) =>
            entry.source === 'tofugu' || entry.id.startsWith('taekim-'),
        ),
    ).toBe(true);
  });

  it('identifies Arabic shared, MSA, and dialect-specific material without display text', () => {
    expect(
      classifyCatalogEntry('ar', 'vocab', {
        id: 'greetings',
        dialect: 'msa',
      }),
    ).toEqual({ requirement: 'required', dialects: undefined });
    expect(
      classifyCatalogEntry('ar', 'vocab', {
        id: 'colloquial-verbs',
        dialect: 'all',
      }),
    ).toEqual({ requirement: 'required', dialects: 'shared' });
    expect(
      classifyCatalogEntry('ar', 'vocab', {
        id: 'egyptian-phrases',
        dialect: 'egyptian',
      }),
    ).toEqual({
      requirement: 'enrichment',
      dialects: ['egyptian'],
    });
    expect(AR_DIALECT_GRAMMAR['egyptian-basics']).toEqual(['egyptian']);
    expect(AR_DIALECT_GRAMMAR['dialect-comparison']).toBe('shared');

    const colloquialGrammarIds = indexFor(GRAMMAR_INDEXES, 'ar')
      .filter((entry) => entry.group === '🗣️ Colloquial & Dialects')
      .map((entry) => entry.id)
      .sort();
    expect(Object.keys(AR_DIALECT_GRAMMAR).sort()).toEqual(
      colloquialGrammarIds,
    );
  });
});

describe('guided activity capabilities', () => {
  it.each(CURRICULUM_LANGUAGES)(
    'defines every guided activity for %s with valid routes and bounded sessions',
    (language) => {
      const capabilities = ACTIVITY_CAPABILITIES[language];
      expect(Object.keys(capabilities).sort()).toEqual(
        [...GUIDED_ACTIVITY_KINDS].sort(),
      );
      for (const capability of Object.values(capabilities)) {
        expect(capability.label).not.toBe('');
        expect(isKnownRoute(capability.route)).toBe(true);
        expect(capability.session.minItems).toBeGreaterThan(0);
        expect(capability.session.targetItems).toBeGreaterThanOrEqual(
          capability.session.minItems,
        );
        expect(capability.session.maxItems).toBeGreaterThanOrEqual(
          capability.session.targetItems,
        );
      }
    },
  );

  it('matches the currently shipped activity data coverage', () => {
    for (const language of CURRICULUM_LANGUAGES) {
      for (const kind of GUIDED_ACTIVITY_KINDS) {
        const expected =
          kind === 'letters'
            ? language === 'ja' || language === 'ru' || language === 'ar'
            : kind !== 'numbers' || language === 'ar';
        expect(
          ACTIVITY_CAPABILITIES[language][kind].available,
          `${language}/${kind}`,
        ).toBe(expected);
      }
    }
  });
});
