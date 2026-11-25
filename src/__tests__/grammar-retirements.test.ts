import { describe, expect, it } from 'vitest';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks } from '../lib/lesson-review';
import baselineJson from './fixtures/grammar-retention-legacy.json';
import shippedJson from './fixtures/arabic-grammar-reviewed-baseline.json';
import romanianLesson from '../../public/content/grammar/ro/cognates-false-friends.md?raw';
import {
  parseRetentionInventory,
  validateLegacyLesson,
  validateRetentionCatalog,
  validateRetentionLesson,
  type LegacyLesson,
  type LessonInventory,
} from './helpers/grammar-retention';
import {
  GRAMMAR_RETIREMENTS,
  type GrammarRetirements,
} from './helpers/grammar-retirements';

const MARKDOWN = import.meta.glob('../../public/content/grammar/ar/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const INVENTORIES = import.meta.glob('./fixtures/grammar-retention/ar-*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const shipped = shippedJson as unknown as {
  lessons: Record<string, { items: Record<string, { identities: [string, string][] }> }>;
};
const legacy: Record<string, LegacyLesson> = baselineJson.lessons;
const inventories = Object.values(INVENTORIES).flatMap((raw) => parseRetentionInventory(raw).inventory!.lessons);

function mutate(markdown: string, id: string, patch: Record<string, unknown> | null) {
  let found = false;
  const result = markdown.replace(/<!-- grammar-card: (.*?) -->/g, (block, raw: string) => {
    const item = JSON.parse(raw) as Record<string, unknown>;
    if (item.id !== id) return block;
    found = true;
    return patch === null ? '' : `<!-- grammar-card: ${JSON.stringify({ ...item, ...patch })} -->`;
  });
  expect(found, `missing mutation target ${id}`).toBe(true);
  expect(parseLessonReviewItems(result).diagnostics).toEqual([]);
  return result;
}

it('can validate another language against exact shared frozen pairs without registering a retirement', () => {
  const lessonKey = 'ro/cognates-false-friends';
  const itemId = 'personality-false-friend-contrast';
  const baseline = legacy[lessonKey];
  const identities = baseline.grammarPairs.filter((pair) => pair.authoredId === itemId)
    .map(({ rule, example }) => ({ rule, example }));
  const key = `${lessonKey}/${itemId}`;
  const records = {
    [key]: {
      reason: 'Mutation test for cross-language exact-pair support, not a registered source retirement.',
      replacements: ['vocab-rezonabil'],
      identities,
    },
  };
  const modified = mutate(romanianLesson, itemId, null);
  expect(validateLegacyLesson(modified, baseline, lessonKey, records)).toEqual([]);
  expect(validateLegacyLesson(modified, baseline, lessonKey).join('\n')).toContain(`lost existing authored ID "${itemId}"`);
  expect(validateLegacyLesson(modified, baseline, lessonKey, {
    [key]: { ...records[key], identities: [{ rule: 'Invented rule', example: 'Invented example' }] },
  }).join('\n')).toContain('retirement identities must match the exact frozen shipped pairs');
});

describe.each(Object.entries(GRAMMAR_RETIREMENTS))('exact source retirement %s', (key, retirement) => {
  const [, lessonId, retiredId] = key.split('/');
  const lessonKey = `ar/${lessonId}`;
  const source = MARKDOWN[`../../public/content/grammar/ar/${lessonId}.md`];
  const inventory = inventories.find((entry) => entry.lessonId === lessonId)!;
  // Exercise both lost-ID and lost-pair branches using the frozen shipped
  // snapshot, not a freshly captured baseline from the already edited source.
  const snapshotBaseline: LegacyLesson = {
    ...legacy[lessonKey],
    authoredIds: Object.keys(shipped.lessons[lessonId].items),
    grammarPairs: Object.entries(shipped.lessons[lessonId].items).flatMap(([authoredId, item]) =>
      item.identities.map(([rule, example]) => ({ authoredId, rule, example }))),
  };
  const check = (markdown: string, records?: GrammarRetirements) =>
    validateLegacyLesson(markdown, snapshotBaseline, lessonKey, records);
  const catalogErrors = (markdown: string, contract: LessonInventory = inventory) => validateRetentionCatalog({
    indexes: { ar: JSON.stringify([{ id: lessonId }]) },
    lessons: { [lessonKey]: markdown },
    inventories: { 'ar-retirement-test.json': JSON.stringify({ language: 'ar', lessons: [contract] }) },
    baseline: { baselineCommit: baselineJson.baselineCommit, lessons: { [lessonKey]: snapshotBaseline } },
  }, ['ar']);

  it('accepts the retired source only with its explicit lesson-scoped approval', () => {
    expect(check(source)).toEqual([]);
    expect(validateLegacyLesson(source, legacy[lessonKey], lessonKey)).toEqual([]);
    expect(validateRetentionLesson(source, inventory, legacy[lessonKey], lessonKey)).toEqual([]);
    expect(catalogErrors(source)).toEqual([]);
    expect(check(source, {}).join('\n')).toContain(`lost existing authored ID "${retiredId}"`);
    expect(check(source, {}).join('\n')).toContain(`lost legacy identity for "${retiredId}"`);
    expect(validateLegacyLesson(source, snapshotBaseline).join('\n')).toContain(`lost existing authored ID "${retiredId}"`);
  });

  it('still rejects an unexpected shipped deletion through lesson and catalog validators', () => {
    const id = snapshotBaseline.authoredIds.find((candidate) =>
      candidate !== retiredId && readLessonReviewBlocks(source, 'grammar-card').items.some(({ value }) => value.id === candidate))!;
    const modified = mutate(source, id, null);
    expect(check(modified).join('\n')).toContain(`lost existing authored ID "${id}"`);
    expect(validateRetentionLesson(modified, inventory, legacy[lessonKey]).join('\n'))
      .toContain(`missing authored teaching point "${id}"`);
    expect(catalogErrors(modified).join('\n')).toContain(`lost existing authored ID "${id}"`);
  });

  it('rejects a retired source even if the inventory is changed to offer it again', () => {
    const { rule, example } = retirement.identities[0];
    const sourceSection = inventory.teachingPoints[0].sourceSection;
    const item = {
      id: retiredId, kind: 'concept' as const, format: 'qa' as const, priority: 'optional' as const,
      sourceSection, rule, example, answer: 'Retired procedural list.', explanation: 'Kept only as prose.',
    };
    const modified = `${source}\n<!-- grammar-card: ${JSON.stringify(item)} -->`;
    expect(parseLessonReviewItems(modified).diagnostics).toEqual([]);
    const contract = {
      ...inventory, teachingPoints: [...inventory.teachingPoints, {
        id: retiredId, kind: item.kind, format: item.format, priority: item.priority,
        sourceSection, prompt: example, answer: item.answer, objective: 'Unapproved reintroduction.',
      }],
    };
    expect(check(modified).join('\n')).toContain(`${retiredId}: retired source reappeared`);
    expect(validateRetentionLesson(modified, contract, legacy[lessonKey], lessonKey).join('\n'))
      .toContain(`${retiredId}: retired source reappeared`);
    expect(catalogErrors(modified, contract).join('\n')).toContain(`${retiredId}: retired source reappeared`);
  });

  it('requires every replacement even when the matching inventory point is also removed', () => {
    const replacement = retirement.replacements.find((id) =>
      readLessonReviewBlocks(source, 'grammar-card').items.some(({ value }) => value.id === id))!;
    const modified = mutate(source, replacement, null);
    const contract = { ...inventory, teachingPoints: inventory.teachingPoints.filter((point) => point.id !== replacement) };
    expect(check(modified).join('\n')).toContain(`missing retirement replacement "${replacement}"`);
    expect(validateRetentionLesson(modified, contract, legacy[lessonKey], lessonKey).join('\n'))
      .toContain(`missing retirement replacement "${replacement}"`);
    expect(catalogErrors(modified, contract).join('\n')).toContain(`missing retirement replacement "${replacement}"`);
  });

  it.each(['alias', 'current wording'])('forbids transferring retired %s to a replacement', (mode) => {
    const block = readLessonReviewBlocks(source, 'grammar-card').items.find(({ value }) =>
      retirement.replacements.includes(value.id as string))!;
    const patch = mode === 'alias'
      ? { legacyAliases: [...(block.value.legacyAliases as unknown[] ?? []), ...retirement.identities] }
      : { ...retirement.identities[0], format: 'qa' };
    const modified = mutate(source, block.value.id as string, patch);
    expect(check(modified).join('\n')).toContain(`${retiredId}: retired identity transferred to "${block.value.id}"`);
    expect(catalogErrors(modified).join('\n')).toContain('retired identity transferred');
  });

  it.each(['empty reason', 'invented key', 'intermediate wording'])('rejects invalid approval: %s', (fault) => {
    const records = {
      [fault === 'invented key' ? `${lessonKey}/invented-retirement` : key]: {
        ...retirement,
        ...(fault === 'empty reason' ? { reason: '' } : {}),
        ...(fault === 'intermediate wording' ? { identities: [{ rule: 'Unshipped', example: 'Intermediate front' }] } : {}),
      },
    };
    expect(check(source, records).join('\n')).toMatch(/retirement (reason|key|identities)/);
    expect(check(source, records).join('\n')).toContain(`lost existing authored ID "${retiredId}"`);
  });

  it('does not exempt another wording pair merely because its authored ID retired', () => {
    const changedBaseline = {
      ...snapshotBaseline,
      grammarPairs: [...snapshotBaseline.grammarPairs, {
        authoredId: retiredId, rule: 'An unrelated rule.', example: 'Another identity.',
      }],
    };
    expect(validateLegacyLesson(source, changedBaseline, lessonKey).join('\n'))
      .toContain(`lost legacy identity for "${retiredId}": ["An unrelated rule.","Another identity."]`);
  });
});
