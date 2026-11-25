import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/pt/index.json';
import { isReviewedGrammarLesson } from '../lib/grammar-review-scope';
import { reviewed } from '../lib/grammar-reviewed/pt';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks, type GrammarReviewItem } from '../lib/lesson-review';
import { lessonHeadings, validateReviewItemQuality } from './helpers/grammar-retention';
import identities from './fixtures/portuguese-grammar-identities.json';

const assets = import.meta.glob('../../public/content/grammar/pt/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const lesson = (id: string) => assets[`../../public/content/grammar/pt/${id}.md`] ?? '';
const indexedIds = index.toSorted((a, b) => a.order - b.order).map(({ id }) => id);

// Frozen pre-rollout identities: [rule, prompt, id] for every card's own pair and
// each of its legacyAliases. Never regenerate it from current content.
type Identity = readonly [rule: string, example: string, id: string];
const snapshot: Readonly<Record<string, readonly Identity[]>> = Object.fromEntries(Object.entries(identities.lessons)
  .map(([id, tuples]) => [id, tuples.map(([rule, example, cardId]): Identity => [rule, example, cardId])]));

// Approved retirements: lessonId → card id → reason. A retired card's former
// pairs must then have no owner, so its schedule is never handed to another card.
const retired: Readonly<Record<string, Readonly<Record<string, string>>>> = {};

// Justified overlaps where a cloze's one-word answer is also a token on its
// front: 'lessonId/cardId' → reason.
const clozeFrontExempt: ReadonlyMap<string, string> = new Map([
  ['articles/a-article-contraction', 'The cue (a + a) is needed to show which contraction is asked; the target is the grave accent of à, which the accent fold hides.'],
  ['prepositions/a-definite-contraction', 'The cue (a + a) is needed to show which contraction is asked; the target is the grave accent of à, which the accent fold hides.'],
  ['demonstratives/a-demonstrative', 'The cue (a + aquela) names the parts to contract; the target is the fused, grave-accented àquela, which the accent fold reduces to the cue\'s aquela.'],
]);

// Justified overlaps where a rule card's front shows another card's one-word
// answer: 'lessonId/rule-id/other-id' → reason.
const ruleFrontExempt: ReadonlyMap<string, string> = new Map();

function grammar(markdown: string): GrammarReviewItem[] {
  return parseLessonReviewItems(markdown).items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
}

const currentCatalog = () => Object.fromEntries(Object.keys(snapshot).map((id) => [id, grammar(lesson(id))]));

// Accents are folded for comparison only: printing esta must still count as
// leaking está. Lesson text itself is never normalized.
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const tokens = (text: string): string[] => fold(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const plain = (text: string) => fold(text).replace(/[\s.!?;:,]+$/u, '').trim();
const containsPhrase = (text: string, phrase: string) => new RegExp(
  `(?<![\\p{L}\\p{N}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u',
).test(text);

// Check both directions: each shipped pair stays with its own card in its own
// lesson, and no card adopts a shipped pair it never owned.
function identityErrors(current: Readonly<Record<string, readonly GrammarReviewItem[]>>, retirements = retired): string[] {
  const errors: string[] = [];
  for (const [lessonId, previous] of Object.entries(snapshot)) {
    const cards = current[lessonId] ?? [];
    const approved = retirements[lessonId] ?? {};
    for (const id of new Set(previous.map(([, , id]) => id))) {
      const present = cards.some((card) => card.id === id);
      if (Object.hasOwn(approved, id)) {
        if (present) errors.push(`${lessonId}/${id}: retired but still present`);
      } else if (!present) {
        const elsewhere = Object.keys(current).filter((other) => other !== lessonId && current[other].some((card) => card.id === id));
        errors.push(`${lessonId}/${id}: ${elsewhere.length ? `moved to ${elsewhere.join(', ')}` : 'removed without an approved retirement'}`);
      }
    }
    for (const [rule, example, id] of previous) {
      const owners = cards.filter((card) => [{ rule: card.rule, example: card.prompt }, ...card.legacyAliases]
        .some((pair) => pair.rule === rule && pair.example === example)).map((card) => card.id);
      const expected = Object.hasOwn(approved, id) ? [] : [id];
      if (owners.join('\n') !== expected.join('\n')) {
        errors.push(`${lessonId}: "${example}" must be owned by ${expected[0] ?? 'no card (retired)'}, found ${owners.join(', ') || 'none'}`);
      }
    }
  }
  for (const [lessonId, cards] of Object.entries(current)) {
    for (const card of cards) {
      for (const alias of card.legacyAliases) {
        if (!snapshot[lessonId]?.some(([rule, example, id]) => id === card.id && rule === alias.rule && example === alias.example)) {
          errors.push(`${lessonId}/${card.id}: unauthorized legacy alias for "${alias.example}"`);
        }
      }
    }
  }
  return errors;
}

// The target may share a stem with the cue, but not appear as a whole token.
function frontErrors(lessonId: string, card: GrammarReviewItem): string[] {
  if (card.format !== 'cloze' || clozeFrontExempt.has(`${lessonId}/${card.id}`)) return [];
  const answer = tokens(card.answer);
  return answer.length === 1 && tokens(`${card.prompt}\n${card.hint}`).includes(answer[0])
    ? [`${lessonId}/${card.id}: one-word answer "${card.answer}" is already on the front`] : [];
}

function ruleCardErrors(lessonId: string, markdown: string, cards = grammar(markdown)): string[] {
  const sections = lessonHeadings(markdown);
  const errors: string[] = [];
  for (const card of cards.filter((candidate) => candidate.id.startsWith('rule-'))) {
    const label = `${lessonId}/${card.id}`;
    const front = `${card.prompt}\n${card.hint}`;
    if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${label}: must be concept + qa`);
    if (!plain(card.answer)) errors.push(`${label}: empty answer`);
    else if (containsPhrase(plain(front), plain(card.answer))) errors.push(`${label}: answer appears verbatim on the front`);
    if (!sections.includes(card.sourceSection)) errors.push(`${label}: sourceSection is not a lesson heading`);
    const frontWords = new Set(tokens(front));
    for (const other of cards) {
      const answer = tokens(other.answer);
      if (other.id !== card.id && answer.length === 1 && frontWords.has(answer[0])
        && !ruleFrontExempt.has(`${label}/${other.id}`)) {
        errors.push(`${label}: front shows "${answer[0]}", the answer of ${other.id}`);
      }
    }
  }
  return errors;
}

describe('Portuguese reviewed grammar lessons', () => {
  it('lists only indexed lessons, once each, all recognized as reviewed', () => {
    expect(reviewed.filter((id) => !indexedIds.includes(id))).toEqual([]);
    expect(reviewed.filter((id, i) => reviewed.indexOf(id) !== i)).toEqual([]);
    expect(reviewed.filter((id) => !isReviewedGrammarLesson('pt', id))).toEqual([]);
  });

  if (!reviewed.length) {
    it('has no reviewed lessons yet, so no per-lesson contract applies', () => {
      expect(reviewed).toEqual([]);
    });
  } else {
    it.each(reviewed)('%s: offers only authored, well-formed material whose fronts hide the answer', (id) => {
      const markdown = lesson(id);
      const { items, diagnostics } = parseLessonReviewItems(markdown);
      expect(diagnostics).toEqual([]);
      expect(readLessonReviewBlocks(markdown, 'vocab-inventory').items).toHaveLength(1);
      const sections = lessonHeadings(markdown);
      const errors: string[] = [];
      for (const item of items) {
        if (item.provenance !== 'authored') errors.push(`${item.id}: provenance ${item.provenance}`);
        if (!sections.includes(item.sourceSection)) errors.push(`${item.id}: sourceSection "${item.sourceSection}" is not a heading`);
        errors.push(...validateReviewItemQuality(item));
        if (item.kind !== 'vocabulary') errors.push(...frontErrors(id, item));
      }
      expect(errors).toEqual([]);
    });

    const ruleCounts = reviewed.map((id): [string, number] => [id, grammar(lesson(id)).filter((card) => card.id.startsWith('rule-')).length]);
    it.each(ruleCounts)('%s: its %d rule-recall card(s) are self-graded concepts that hide their answer', (id) => {
      expect(ruleCardErrors(id, lesson(id))).toEqual([]);
    });
  }

  it('keeps every pre-rollout grammar identity on its own card in its own lesson', () => {
    expect(Object.values(identities.lessons).flat().filter((tuple) => tuple.length !== 3 || tuple.some((part) => !part))).toEqual([]);
    expect(Object.keys(snapshot).filter((id) => !indexedIds.includes(id))).toEqual([]);
    expect(identityErrors(currentCatalog())).toEqual([]);
  });

  it('keeps a gente on third-person singular agreement, never the nós ending', () => {
    const card = grammar(lesson('present-ar')).find((candidate) => candidate.id === 'ar-singular');
    expect(card?.prompt).toContain('A gente');
    expect(card?.answer).toBe('fala');
  });

  it('rejects a one-word answer copied onto a cloze front, even without its accent', () => {
    const eu = grammar(lesson('present-ar')).find((card) => card.id === 'ar-eu')!;
    expect(frontErrors('present-ar', eu)).toEqual([]);
    expect(frontErrors('present-ar', { ...eu, prompt: 'Eu ___ português. (Falo)' })).toEqual([
      'present-ar/ar-eu: one-word answer "falo" is already on the front',
    ]);
    const estar = grammar(lesson('ser-estar')).find((card) => card.id === 'current-state-estar')!;
    expect(frontErrors('ser-estar', estar)).toEqual([]);
    expect(frontErrors('ser-estar', { ...estar, hint: 'esta' })).toEqual([
      'ser-estar/current-state-estar: one-word answer "está" is already on the front',
    ]);
  });

  it('allows a reworded card to keep its own pair, but rejects transferring that pair to another card', () => {
    const [rule, example] = snapshot['present-ar'].find(([, , id]) => id === 'ar-eu')!;
    const reworded = (cards: GrammarReviewItem[]) => cards.map((card) => card.id === 'ar-eu'
      ? { ...card, rule: 'Regular -ar verbs take -o in the first-person singular' } : card);
    const kept = currentCatalog();
    kept['present-ar'] = reworded(kept['present-ar']).map((card) => card.id === 'ar-eu'
      ? { ...card, legacyAliases: [...card.legacyAliases, { rule, example }] } : card);
    expect(identityErrors(kept)).toEqual([]);
    const transferred = currentCatalog();
    transferred['present-ar'] = reworded(transferred['present-ar']).map((card) => card.id === 'ar-singular'
      ? { ...card, legacyAliases: [...card.legacyAliases, { rule, example }] } : card);
    expect(identityErrors(transferred)).toEqual([
      `present-ar: "${example}" must be owned by ar-eu, found ar-singular`,
      `present-ar/ar-singular: unauthorized legacy alias for "${example}"`,
    ]);
  });

  it('rejects removing or moving a card unless its retirement is approved', () => {
    const removed = currentCatalog();
    const plural = removed['present-ar'].find((card) => card.id === 'ar-plural')!;
    removed['present-ar'] = removed['present-ar'].filter((card) => card !== plural);
    expect(identityErrors(removed)).toEqual([
      'present-ar/ar-plural: removed without an approved retirement',
      'present-ar: "Eles ___ muito. (trabalhar)" must be owned by ar-plural, found none',
    ]);
    expect(identityErrors(removed, { 'present-ar': { 'ar-plural': 'example retirement' } })).toEqual([]);
    const moved = { ...removed, 'present-er-ir': [...removed['present-er-ir'], plural] };
    expect(identityErrors(moved)).toContain('present-ar/ar-plural: moved to present-er-ir');
  });

  it('rejects a rule-recall card whose answer is printed in its hint', () => {
    const markdown = lesson('present-ar');
    const cards = grammar(markdown);
    const stem = cards.find((card) => card.id === 'ar-stem-formation')!;
    const recall = { ...stem, id: 'rule-stem-formation' };
    expect(ruleCardErrors('present-ar', markdown, [...cards, recall])).toEqual([]);
    expect(ruleCardErrors('present-ar', markdown, [...cards, { ...recall, hint: 'Remove -ar, leaving fal-' }])).toEqual([
      'present-ar/rule-stem-formation: answer appears verbatim on the front',
    ]);
  });
});
