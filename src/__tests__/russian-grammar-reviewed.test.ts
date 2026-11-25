import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/ru/index.json';
import { isReviewedGrammarLesson } from '../lib/grammar-review-scope';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks, type GrammarReviewItem } from '../lib/lesson-review';
import {
  fingerprintQuizzes, lessonHeadings, lessonQuizPayloads, restoreApprovedQuizCorrections,
  validateRetentionLesson, validateReviewItemQuality,
} from './helpers/grammar-retention';
import { baseline as pilot } from './fixtures/russian-grammar-pilot-baseline';
import { baseline as baseline1 } from './fixtures/russian-grammar-reviewed/baseline-1';
import { baseline as baseline2 } from './fixtures/russian-grammar-reviewed/baseline-2';
import { baseline as baseline3 } from './fixtures/russian-grammar-reviewed/baseline-3';
import { baseline as baseline4 } from './fixtures/russian-grammar-reviewed/baseline-4';
import { batch as batch1 } from './fixtures/russian-grammar-reviewed/inventory-1';
import { batch as batch2 } from './fixtures/russian-grammar-reviewed/inventory-2';
import { batch as batch3 } from './fixtures/russian-grammar-reviewed/inventory-3';
import { batch as batch4 } from './fixtures/russian-grammar-reviewed/inventory-4';
import type { LessonBaseline, ReviewedBatch } from './fixtures/russian-grammar-reviewed/types';

const assets = import.meta.glob('../../public/content/grammar/ru/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const lesson = (id: string) => assets[`../../public/content/grammar/ru/${id}.md`];

const batches: [Record<string, LessonBaseline>, ReviewedBatch][] = [
  [baseline1, batch1], [baseline2, batch2], [baseline3, batch3], [baseline4, batch4],
];
const baseline: Record<string, LessonBaseline> = Object.assign({}, ...batches.map(([lessons]) => lessons));
const cohort = Object.keys(baseline);
const cases = batches.flatMap(([lessons, batch], n) => Object.keys(lessons).map((id) => ({
  batch: n + 1, id, inventory: batch.inventories.find((entry) => entry.lessonId === id),
})));
const ruleFrontExemptions: Record<string, string> = Object.assign({}, ...batches.map(([, batch]) => batch.ruleFrontExemptions));
const pairingExemptions: Record<string, string> = Object.assign({}, ...batches.map(([, batch]) => batch.pairingExemptions));
const quizCorrections = batches.flatMap(([, batch]) => batch.quizCorrections);
// A curated list of study links teaches no grammar point; its inventory is intentionally empty.
const NO_GRAMMAR = new Set(['resources']);

function grammar(markdown: string) {
  return parseLessonReviewItems(markdown).items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
}

const plain = (text: string) => text.normalize('NFD').replaceAll('\u0301', '').toLowerCase()
  .replace(/[\s.!?;:,]+$/u, '').trim();
const words = (text: string): string[] => plain(text).match(/[\p{L}\p{M}]+/gu) ?? [];

// Only the approved successor may claim a shipped pair, and adding an unshipped
// alias is not a way to adopt more of someone's deck.
function identityErrors(id: string, cards: GrammarReviewItem[]) {
  const previous = baseline[id].identities;
  const errors: string[] = [];
  for (const [rule, example, successor] of previous) {
    const owners = cards.filter((card) =>
      [{ rule: card.rule, example: card.prompt }, ...card.legacyAliases]
        .some((pair) => pair.rule === rule && pair.example === example)).map((card) => card.id);
    if (successor === null ? owners.length : owners.length !== 1 || owners[0] !== successor) {
      errors.push(`${example}: expected ${successor ?? 'no successor'}, found ${owners.join(', ')}`);
    }
  }
  for (const card of cards) {
    for (const alias of card.legacyAliases) {
      if (!previous.some(([r, e, successor]) => successor === card.id && r === alias.rule && e === alias.example)) {
        errors.push(`${card.id}: unauthorized legacy alias for ${alias.example}`);
      }
    }
  }
  return errors;
}

// Accent marks aren't what's graded on a case/aspect item. The target may share
// a stem with the front, but may not appear there as a whole supplied answer.
function frontErrors(card: GrammarReviewItem): string[] {
  if (card.format !== 'cloze') return [];
  const answer = words(card.answer);
  return answer.length === 1 && words(`${card.prompt}\n${card.hint}`).includes(answer[0])
    ? [`${card.id}: production answer is already a word or ending on the front`] : [];
}

function ruleCardErrors(id: string, cards: GrammarReviewItem[], sections: string[], exemptions: Record<string, string>) {
  const errors: string[] = [];
  const ruleCards = cards.filter((card) => card.id.startsWith('rule-'));
  if (ruleCards.length < 2 || ruleCards.length > 4) errors.push(`${id}: expected 2–4 rule cards, found ${ruleCards.length}`);
  const essential = ruleCards.filter((card) => card.priority === 'essential').length;
  if (essential < 1 || essential > 2) errors.push(`${id}: expected 1–2 essential rule cards, found ${essential}`);
  for (const card of cards) {
    // Every reviewed concept card is spaced as rule recall, so it must be declarative Q&A.
    if (card.kind === 'concept' && card.format !== 'qa') errors.push(`${id}/${card.id}: concept must be qa`);
  }
  for (const card of ruleCards) {
    const front = `${card.prompt}\n${card.hint}`;
    if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${id}/${card.id}: must be concept + qa`);
    if (!plain(card.answer)) errors.push(`${id}/${card.id}: empty answer`);
    else if (plain(front).includes(plain(card.answer))) errors.push(`${id}/${card.id}: answer appears verbatim on the front`);
    if (!sections.includes(card.sourceSection)) errors.push(`${id}/${card.id}: sourceSection is not a lesson heading`);
    const frontWords = new Set(words(front));
    const shown = cards.filter((other) => {
      const answer = words(other.answer);
      return other.id !== card.id && answer.length === 1 && /\p{Script=Cyrillic}/u.test(answer[0]) && frontWords.has(answer[0]);
    });
    const key = `${id}/${card.id}`;
    if (shown.length && !exemptions[key]) {
      errors.push(...shown.map((other) => `${key}: front shows ${words(other.answer)[0]}, the answer of ${other.id}`));
    } else if (!shown.length && exemptions[key]) {
      errors.push(`${key}: stale front exemption`);
    }
  }
  return errors;
}

describe('Russian grammar rollout — lessons 11–47 meet the reviewed contract', () => {
  it('covers every remaining lesson once, in published order, and lists the whole catalog as reviewed', () => {
    const ordered = index.toSorted((a, b) => a.order - b.order).map(({ id }) => id);
    expect([...Object.keys(pilot), ...cohort]).toEqual(ordered);
    expect(ordered.filter((id) => !isReviewedGrammarLesson('ru', id))).toEqual([]);
    for (const [lessons, batch] of batches) {
      expect(batch.inventories.map((entry) => entry.lessonId)).toEqual(Object.keys(lessons));
    }
    for (const key of [...Object.keys(ruleFrontExemptions), ...Object.keys(pairingExemptions)]) {
      expect(cohort, key).toContain(key.split('/')[0]);
    }
    for (const correction of quizCorrections) {
      expect(cohort.map((id) => `ru/${id}`), correction.lessonKey).toContain(correction.lessonKey);
    }
  });

  it.each(cases)('batch $batch · $id: offers only reviewed material, with intact quizzes and safe adoption', ({ id }) => {
    const markdown = lesson(id);
    const { items, diagnostics } = parseLessonReviewItems(markdown);
    expect(diagnostics).toEqual([]);
    expect(readLessonReviewBlocks(markdown, 'vocab-inventory').items).toHaveLength(1);
    const sections = lessonHeadings(markdown);
    for (const item of items) {
      expect(item.provenance, item.id).toBe('authored');
      expect(sections, item.id).toContain(item.sourceSection);
      expect(validateReviewItemQuality(item)).toEqual([]);
      if (item.kind === 'vocabulary') {
        // Lexical cards are Russian words with an English gloss, never English advice.
        expect(item.word, item.id).toMatch(/\p{Script=Cyrillic}/u);
        expect(item.word, item.id).not.toMatch(/[A-Za-z]/);
        expect(item.meaning, item.id).toMatch(/[A-Za-z]/);
      } else {
        expect(frontErrors(item)).toEqual([]);
      }
    }
    const [quizCount, quizSha256] = baseline[id].quizzes;
    const restored = restoreApprovedQuizCorrections(lessonQuizPayloads(markdown), `ru/${id}`, quizCorrections);
    expect(restored.errors).toEqual([]);
    expect(fingerprintQuizzes(restored.quizzes)).toEqual({ quizCount, quizSha256 });
    expect(identityErrors(id, grammar(markdown))).toEqual([]);
  });

  it.each(cases)('batch $batch · $id: preserves the reviewed objectives, front cues and target forms', ({ id, inventory }) => {
    expect(inventory, `${id}: missing reviewed inventory`).toBeDefined();
    expect(validateRetentionLesson(lesson(id), inventory!)).toEqual([]);
  });

  it.each(cases)('batch $batch · $id: keeps rule recall to a few self-graded concepts that hide their answer', ({ id }) => {
    const markdown = lesson(id);
    if (NO_GRAMMAR.has(id)) {
      expect(parseLessonReviewItems(markdown).items).toEqual([]);
      return;
    }
    expect(ruleCardErrors(id, grammar(markdown), lessonHeadings(markdown), ruleFrontExemptions)).toEqual([]);
  });

  it.each(cases)('batch $batch · $id: pairs producing a form with interpreting one', ({ id }) => {
    if (NO_GRAMMAR.has(id)) return;
    const cards = grammar(lesson(id)).filter((card) => card.kind === 'rule');
    const pairs = cards.some((card) => card.format === 'cloze') && cards.some((card) => card.format === 'qa');
    if (pairingExemptions[id]) expect(pairs, `${id}: stale pairing exemption`).toBe(false);
    else expect(pairs, `${id}: needs a production cloze and an interpretation Q&A`).toBe(true);
  });
});
