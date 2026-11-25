/**
 * Per-lesson gate for the Spanish reviewed-grammar rollout.
 *
 *   npx vitest run src/__tests__/spanish-grammar-reviewed.test.ts -t "<lessonId>"
 *
 * Each batch owns one review record, fixtures/spanish-grammar-reviewed/batch-N.json:
 *
 *   {"lessons": {
 *     "<lessonId>": {
 *       "reclassified": {"<cardId>": "why (e.g. interpretation task, not rule recall)"},
 *       "split": {"<oldCardId>": ["<newId>", "..."]},
 *       "answerChanged": {"<cardId>": "why the target is unchanged (e.g. added accepted alternative)"},
 *       "frontExempt": {"<cardId>": "why a token overlap on the front is acceptable"},
 *       "listExempt": {"<cardId>": "why a multi-item answer is still one atomic target"},
 *       "noRuleRecall": "why the lesson has no concept card (optional; only if it has zero)"
 *     }
 *   }}
 *
 * All sub-keys are optional; `{}` means "reviewed, nothing special". A recorded
 * lesson is checked against the contract in docs/knowledge-practice.md and
 * against the identity snapshot of what main shipped
 * (fixtures/spanish-grammar-reviewed-baseline.json, never regenerated).
 * The registry tests fail until an integrator lists every recorded lesson in
 * src/lib/grammar-reviewed/es.ts.
 */
import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/es/index.json';
import { hasBlank } from '../lib/grammar-cards';
import { reviewed } from '../lib/grammar-reviewed/es';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import {
  isMetadataObject,
  readLessonReviewBlocks,
  type GrammarReviewItem,
  type LegacyGrammarAlias,
} from '../lib/lesson-review';
import legacyJson from './fixtures/grammar-retention-legacy.json';
import snapshotJson from './fixtures/spanish-grammar-reviewed-baseline.json';
import {
  lessonHeadings,
  parseRetentionInventory,
  validateLegacyLesson,
  validateRetentionLesson,
  validateReviewItemQuality,
  type LegacyBaseline,
  type LessonInventory,
} from './helpers/grammar-retention';

interface SnapshotCard {
  kind: string;
  format: string;
  rule: string;
  example: string;
  answer: string;
  legacyAliases: LegacyGrammarAlias[];
}

interface ReviewRecord {
  reclassified?: Record<string, string>;
  split?: Record<string, string[]>;
  answerChanged?: Record<string, string>;
  frontExempt?: Record<string, string>;
  listExempt?: Record<string, string>;
  noRuleRecall?: string;
}

const RECORD_MAPS = ['reclassified', 'answerChanged', 'frontExempt', 'listExempt'] as const;
const RECORD_KEYS = [...RECORD_MAPS, 'split', 'noRuleRecall'];

const LESSONS = import.meta.glob('../../public/content/grammar/es/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const INVENTORY_FILES = import.meta.glob('./fixtures/grammar-retention/es-*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const BATCH_FILES = import.meta.glob('./fixtures/spanish-grammar-reviewed/*.json', {
  import: 'default', eager: true,
}) as Record<string, unknown>;
const LEGACY: LegacyBaseline = legacyJson;
const SNAPSHOT: { commit: string; lessons: Record<string, Record<string, SnapshotCard>> } = snapshotJson;

const INDEXED = index.toSorted((a, b) => a.order - b.order).map(({ id }) => id);
const lesson = (id: string) => LESSONS[`../../public/content/grammar/es/${id}.md`];

const INVENTORIES = new Map<string, LessonInventory>();
const INVENTORY_ERRORS: string[] = [];
for (const [file, raw] of Object.entries(INVENTORY_FILES)) {
  const parsed = parseRetentionInventory(raw);
  INVENTORY_ERRORS.push(...parsed.errors.map((error) => `${file}: ${error}`));
  for (const entry of parsed.inventory?.lessons ?? []) INVENTORIES.set(entry.lessonId, entry);
}

const batchLessons = (file: string): Record<string, unknown> => {
  const value = BATCH_FILES[file];
  return isMetadataObject(value) && isMetadataObject(value.lessons) ? value.lessons : {};
};
const RECORDS = new Map<string, ReviewRecord>();
for (const file of Object.keys(BATCH_FILES)) {
  for (const [id, record] of Object.entries(batchLessons(file))) {
    if (!RECORDS.has(id)) RECORDS.set(id, (isMetadataObject(record) ? record : {}) as ReviewRecord);
  }
}
const RECORDED = [...RECORDS.keys()].toSorted((a, b) => {
  const [ia, ib] = [INDEXED.indexOf(a), INDEXED.indexOf(b)];
  return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib) || a.localeCompare(b);
});

// Accents and inverted punctuation aren't what a front leak is about.
function plain(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
    .replace(/^[¿¡]+/u, '').replace(/[.!?;:,]+$/u, '').trim();
}
const tokens = (text: string): string[] => plain(text).match(/[\p{L}\p{N}]+/gu) ?? [];
// Whole-token containment, so "las" doesn't match inside "palabras".
function containsPlain(haystack: string, needle: string): boolean {
  const escaped = plain(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u').test(plain(haystack));
}

function recordShapeErrors(record: unknown): string[] {
  if (!isMetadataObject(record)) return ['review record must be an object'];
  const errors = Object.keys(record).filter((key) => !RECORD_KEYS.includes(key))
    .map((key) => `review record: unknown field "${key}"`);
  for (const key of RECORD_MAPS) {
    const map = record[key];
    if (map === undefined) continue;
    if (!isMetadataObject(map)) errors.push(`review record: ${key} must be an object`);
    else {
      for (const [id, why] of Object.entries(map)) {
        if (typeof why !== 'string' || !why.trim()) errors.push(`review record: ${key}.${id} needs a nonempty reason`);
      }
    }
  }
  if (record.split !== undefined) {
    if (!isMetadataObject(record.split)) errors.push('review record: split must be an object');
    else {
      for (const [id, ids] of Object.entries(record.split)) {
        if (!Array.isArray(ids) || !ids.length || !ids.every((value) => typeof value === 'string')) {
          errors.push(`review record: split.${id} must be a nonempty array of card ids`);
        }
      }
    }
  }
  if (record.noRuleRecall !== undefined && (typeof record.noRuleRecall !== 'string' || !record.noRuleRecall.trim())) {
    errors.push('review record: noRuleRecall must be a nonempty reason');
  }
  return errors;
}

function aliasesOf(value: Record<string, unknown>): LegacyGrammarAlias[] {
  return Array.isArray(value.legacyAliases)
    ? value.legacyAliases.filter((alias): alias is LegacyGrammarAlias =>
      isMetadataObject(alias) && typeof alias.rule === 'string' && typeof alias.example === 'string')
    : [];
}
const samePair = (a: LegacyGrammarAlias) => (b: LegacyGrammarAlias) => a.rule === b.rule && a.example === b.example;

function identityErrors(id: string, markdown: string, record: ReviewRecord): string[] {
  const errors: string[] = [];
  const snapshot = SNAPSHOT.lessons[id];
  if (!snapshot) return [`${id}: lesson is missing from the identity snapshot`];
  const raw = new Map<string, Record<string, unknown>>();
  for (const { value } of readLessonReviewBlocks(markdown, 'grammar-card').items) {
    if (typeof value.id === 'string' && !raw.has(value.id)) raw.set(value.id, value);
  }
  const reclassified = record.reclassified ?? {};
  const answerChanged = record.answerChanged ?? {};
  for (const [cardId, old] of Object.entries(snapshot)) {
    const card = raw.get(cardId);
    if (!card) {
      errors.push(`${cardId}: shipped card was removed (keep the id; split by adding new cards)`);
      continue;
    }
    const aliases = aliasesOf(card);
    const shipped = { rule: old.rule, example: old.example };
    if ((card.rule !== old.rule || card.example !== old.example) && !aliases.some(samePair(shipped))) {
      errors.push(`${cardId}: rule/example changed; add the exact shipped pair to legacyAliases: ${JSON.stringify(shipped)}`);
    }
    for (const alias of old.legacyAliases) {
      if (!aliases.some(samePair(alias))) errors.push(`${cardId}: dropped shipped legacy alias ${JSON.stringify(alias)}`);
    }
    if (card.answer !== old.answer && !(cardId in answerChanged)) {
      errors.push(`${cardId}: answer changed from ${JSON.stringify(old.answer)}; list it in answerChanged with why the target is unchanged`);
    }
    if (card.answer === old.answer && cardId in answerChanged) {
      errors.push(`${cardId}: listed in answerChanged but its answer is unchanged`);
    }
    const changedKind = card.kind !== old.kind || card.format !== old.format;
    if (changedKind && !(cardId in reclassified)) {
      errors.push(`${cardId}: kind/format changed (${old.kind}+${old.format} → ${String(card.kind)}+${String(card.format)}); list it in reclassified`);
    }
    if (changedKind && card.format !== 'qa') {
      errors.push(`${cardId}: a reclassified card must become rule+qa or concept+qa`);
    }
    if (!changedKind && cardId in reclassified) {
      errors.push(`${cardId}: listed in reclassified but kind/format are unchanged`);
    }
  }
  for (const [cardId, card] of raw) {
    const old = snapshot[cardId];
    const allowed = old ? [{ rule: old.rule, example: old.example }, ...old.legacyAliases] : [];
    for (const alias of aliasesOf(card)) {
      if (!allowed.some(samePair(alias))) {
        errors.push(`${cardId}: unauthorized legacy alias ${JSON.stringify(alias)}${old ? '' : ' (new cards must not inherit mastery)'}`);
      }
    }
  }
  for (const key of RECORD_MAPS) {
    for (const cardId of Object.keys(record[key] ?? {})) {
      if (!raw.has(cardId)) errors.push(`review record: ${key}.${cardId} is not a grammar card in this lesson`);
    }
  }
  for (const [oldId, newIds] of Object.entries(record.split ?? {})) {
    if (!snapshot[oldId]) errors.push(`review record: split.${oldId} is not a shipped card`);
    else if (!raw.has(oldId)) errors.push(`review record: split.${oldId} must still exist`);
    for (const newId of Array.isArray(newIds) ? newIds : []) {
      const card = raw.get(newId);
      if (!card) errors.push(`review record: split.${oldId} lists ${newId}, which is not a grammar card in this lesson`);
      else if (snapshot[newId]) errors.push(`review record: split.${oldId} lists ${newId}, which already shipped`);
      else if (!(card.kind === 'rule' || (card.kind === 'concept' && card.format === 'qa'))) {
        errors.push(`${newId}: split card must be concept+qa or rule`);
      }
    }
  }
  return errors;
}

/** Leak heuristics for one card, before exemptions. */
function frontErrors(card: GrammarReviewItem, cards: GrammarReviewItem[]): string[] {
  const errors: string[] = [];
  const answer = plain(card.answer);
  const answerTokens = tokens(card.answer);
  if (card.format === 'cloze' && answerTokens.length === 1
    && tokens(`${card.prompt}\n${card.hint}`).includes(answerTokens[0])) {
    errors.push(`${card.id}: cloze answer is already on the front`);
  }
  if (answer.length >= 3 && containsPlain(card.hint, card.answer)) errors.push(`${card.id}: hint gives away the answer`);
  if (card.format === 'qa' && answer.length >= 3 && containsPlain(card.prompt, card.answer)) {
    errors.push(`${card.id}: answer appears verbatim on the front`);
  }
  if (card.id.startsWith('rule-')) {
    const front = new Set(tokens(`${card.prompt}\n${card.hint}`));
    for (const other of cards) {
      const [token, extra] = tokens(other.answer);
      if (other.id !== card.id && other.kind === 'rule' && other.format === 'cloze'
        && token && extra === undefined && token.length >= 3 && front.has(token)) {
        errors.push(`${card.id}: front shows ${token}, the answer of ${other.id}`);
      }
    }
  }
  return errors;
}

const APPLICATION = /^(translate|rewrite|complete|fill in|conjugate|change|turn|make|say|correct|choose|put)\b/i;

function enumerates(answer: string): boolean {
  return (answer.replace(/^(yes|no)\.\s*/i, '').match(/[,;]/g) ?? []).length >= 3;
}

function lessonErrors(id: string, markdown: string, record: ReviewRecord): string[] {
  const errors = recordShapeErrors(record);
  const key = `es/${id}`;
  const parsed = parseLessonReviewItems(markdown);
  errors.push(...parsed.diagnostics.map((diagnostic) =>
    `${diagnostic.code} at line ${diagnostic.line}: ${diagnostic.message}`));
  const control = readLessonReviewBlocks(markdown, 'vocab-inventory');
  if (control.items.length !== 1 || control.diagnostics.length) {
    errors.push('lesson must declare exactly one valid <!-- vocab-inventory: {"mode":"explicit"} -->');
  }
  const headings = lessonHeadings(markdown);
  for (const item of parsed.items) {
    if (item.provenance !== 'authored') errors.push(`${item.id}: provenance is ${item.provenance}, not authored`);
    if (!headings.includes(item.sourceSection)) {
      errors.push(`${item.id}: sourceSection "${item.sourceSection}" is not a lesson heading`);
    }
    errors.push(...validateReviewItemQuality(item));
  }

  const inventory = INVENTORIES.get(id);
  const legacy = LEGACY.lessons[key];
  if (!inventory) errors.push(`${id}: missing reviewed inventory`);
  if (!legacy) errors.push(`${key}: missing legacy/quiz baseline`);
  if (inventory) errors.push(...validateRetentionLesson(markdown, inventory, legacy));
  if (legacy) errors.push(...validateLegacyLesson(markdown, legacy, key));

  errors.push(...identityErrors(id, markdown, record));

  const cards = parsed.items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
  const frontExempt = record.frontExempt ?? {};
  const listExempt = record.listExempt ?? {};
  for (const card of cards) {
    const front = frontErrors(card, cards);
    if (!(card.id in frontExempt)) errors.push(...front);
    else if (!front.length) errors.push(`review record: frontExempt.${card.id} exempts nothing`);
    if (card.kind === 'concept') {
      if (card.format !== 'qa') errors.push(`${card.id}: concept card must use format qa`);
      if (hasBlank(card.prompt)) errors.push(`${card.id}: concept card prompt contains a blank; use kind rule`);
      if (APPLICATION.test(card.prompt.trim())) errors.push(`${card.id}: concept card is an application task; use kind rule`);
      if (enumerates(card.answer) && !(card.id in listExempt)) {
        errors.push(`${card.id}: answer enumerates a set; split it or justify in listExempt`);
      }
    }
    if (card.id in listExempt && !(card.kind === 'concept' && enumerates(card.answer))) {
      errors.push(`review record: listExempt.${card.id} exempts nothing`);
    }
  }

  const ruleCards = cards.filter((card) => card.id.startsWith('rule-'));
  for (const card of ruleCards) {
    if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${card.id}: rule card must be concept+qa`);
    if (!card.answer.trim()) errors.push(`${card.id}: rule card has an empty answer`);
    if (/^(sources|references?|further reading)$/i.test(card.sourceSection.trim())) {
      errors.push(`${card.id}: rule card must sit in a teaching section, not "${card.sourceSection}"`);
    }
  }
  if (ruleCards.length > 4) errors.push(`${id}: ${ruleCards.length} rule-* cards; at most 4 per lesson`);

  const concepts = cards.filter((card) => card.kind === 'concept').length;
  const noRuleRecall = typeof record.noRuleRecall === 'string' && record.noRuleRecall.trim();
  if (!concepts && !noRuleRecall) errors.push(`${id}: no concept card; add rule recall or justify noRuleRecall`);
  if (concepts && record.noRuleRecall !== undefined) {
    errors.push(`review record: noRuleRecall is set but the lesson has ${concepts} concept card(s)`);
  }
  return [...new Set(errors)];
}

describe('Spanish reviewed grammar — records and registry', () => {
  it('review records are {"lessons": {...}} files using only the documented fields', () => {
    const errors: string[] = [];
    for (const [file, value] of Object.entries(BATCH_FILES)) {
      if (!/\/batch-[1-5]\.json$/.test(file)) errors.push(`${file}: unexpected review record file`);
      if (!isMetadataObject(value) || Object.keys(value).join() !== 'lessons' || !isMetadataObject(value.lessons)) {
        errors.push(`${file}: must be exactly {"lessons": {...}}`);
        continue;
      }
      for (const [id, record] of Object.entries(value.lessons)) {
        errors.push(...recordShapeErrors(record).map((error) => `${file} ${id}: ${error}`));
      }
    }
    expect(errors).toEqual([]);
  });

  it('every recorded lesson is indexed and recorded in exactly one batch file', () => {
    const errors: string[] = [];
    for (const id of RECORDED) {
      if (!INDEXED.includes(id)) errors.push(`${id}: recorded but not indexed`);
      const files = Object.keys(BATCH_FILES).filter((file) => id in batchLessons(file));
      if (files.length !== 1) errors.push(`${id}: recorded in ${files.join(', ')}`);
    }
    expect(errors).toEqual([]);
  });

  it('the identity snapshot and inventories cover every indexed lesson', () => {
    expect(SNAPSHOT.commit).toBe('ab35670cc1b6a4bdf9425a22d457b14f326562b7');
    expect(Object.keys(SNAPSHOT.lessons)).toEqual(INDEXED);
    expect(INVENTORY_ERRORS).toEqual([]);
    expect([...INVENTORIES.keys()].toSorted()).toEqual(INDEXED.toSorted());
  });

  it('registry has no duplicates and follows index order', () => {
    expect(new Set(reviewed).size).toBe(reviewed.length);
    expect(reviewed.filter((id) => !INDEXED.includes(id))).toEqual([]);
    expect(reviewed).toEqual(INDEXED.filter((id) => reviewed.includes(id)));
  });

  // Integration gate: fails while batches are recorded but not yet listed.
  it('registry lists exactly the recorded lessons', () => {
    expect([...reviewed].toSorted()).toEqual(RECORDED.toSorted());
  });

  // Integration gate: fails until the whole catalog has been reviewed.
  it('the whole indexed Spanish catalog is reviewed', () => {
    expect(reviewed).toEqual(INDEXED);
  });
});

describe('Spanish reviewed grammar — per-lesson contract', () => {
  if (RECORDED.length) {
    it.each(RECORDED)('%s: meets the reviewed-lesson contract', (id) => {
      const markdown = lesson(id);
      expect(markdown, `${id}: missing lesson asset`).toBeTruthy();
      expect(lessonErrors(id, markdown, RECORDS.get(id)!)).toEqual([]);
    }, 20_000);
  } else {
    it.skip('no Spanish lessons are recorded yet', () => {});
  }
});

describe('Spanish reviewed grammar — regressions', () => {
  it('present-ar regression: vosotros practice asks for -áis (habláis) and notes ustedes', () => {
    const cards = parseLessonReviewItems(lesson('present-ar')).items
      .filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
    const vosotros = cards.find((card) => card.id === 'ar-vosotros');
    expect(vosotros?.prompt).toMatch(/vosotros/i);
    expect(vosotros?.answer).toBe('habláis');
    expect(vosotros?.explanation).toContain('ustedes');
    expect(cards.filter((card) => /vosotros/i.test(card.prompt) && !card.answer.includes('áis'))
      .map((card) => card.id)).toEqual([]);
  });
});

describe('Spanish reviewed grammar — the checks fire', () => {
  const base = lesson('present-ar');
  // Edit one card through its parsed JSON, so later rewording doesn't break the mutation.
  function mutateCard(markdown: string, id: string, edit: (card: Record<string, unknown>) => void): string {
    let found = false;
    const result = markdown.replace(/<!--\s*grammar-card:\s*(\{.*?\})\s*-->/g, (comment, json: string) => {
      const card = JSON.parse(json) as Record<string, unknown>;
      if (card.id !== id) return comment;
      found = true;
      edit(card);
      return `<!-- grammar-card: ${JSON.stringify(card)} -->`;
    });
    expect(found, `${id} not found`).toBe(true);
    return result;
  }
  const firstConcept = () => parseLessonReviewItems(base).items.find((item) => item.kind === 'concept')!.id;

  it('flags a cloze answer copied onto the front', () => {
    const changed = mutateCard(base, 'ar-tu', (card) => { card.example = `${card.example} (${card.answer})`; });
    expect(lessonErrors('present-ar', changed, {})).toEqual(expect.arrayContaining([
      expect.stringContaining('ar-tu: cloze answer is already on the front'),
    ]));
  });

  it('flags a legacy alias the card never shipped with', () => {
    const changed = mutateCard(base, 'ar-tu', (card) => {
      card.legacyAliases = [...(Array.isArray(card.legacyAliases) ? card.legacyAliases : []),
        { rule: 'Invented rule', example: 'Invented ___ prompt.' }];
    });
    expect(lessonErrors('present-ar', changed, {})).toEqual(expect.arrayContaining([
      expect.stringContaining('ar-tu: unauthorized legacy alias'),
    ]));
  });

  it('flags a changed answer unless answerChanged explains it', () => {
    const changed = mutateCard(base, 'ar-tu', (card) => { card.answer = 'hablás'; });
    const message = expect.stringMatching(/^ar-tu: answer changed from .*answerChanged/);
    expect(lessonErrors('present-ar', changed, {})).toEqual(expect.arrayContaining([message]));
    expect(lessonErrors('present-ar', changed, { answerChanged: { 'ar-tu': 'voseo alternative' } }))
      .not.toEqual(expect.arrayContaining([message]));
    expect(lessonErrors('present-ar', base, { answerChanged: { 'ar-tu': 'stale' } })).toEqual(expect.arrayContaining([
      'ar-tu: listed in answerChanged but its answer is unchanged',
    ]));
  });

  it('flags an application task authored as a concept card', () => {
    const id = firstConcept();
    const changed = mutateCard(base, id, (card) => { card.example = 'Translate: I speak.'; });
    expect(lessonErrors('present-ar', changed, {})).toEqual(expect.arrayContaining([
      `${id}: concept card is an application task; use kind rule`,
    ]));
  });
});
