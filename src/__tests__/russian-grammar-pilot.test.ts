import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/ru/index.json';
import { isReviewedGrammarLesson } from '../lib/grammar-review-scope';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks, type GrammarReviewItem } from '../lib/lesson-review';
import { fingerprintQuizzes, lessonHeadings, lessonQuizPayloads, restoreApprovedQuizCorrections, validateRetentionLesson, validateReviewItemQuality } from './helpers/grammar-retention';
import { inventories } from './fixtures/russian-grammar-pilot';
import { baseline, stressQuizCorrection } from './fixtures/russian-grammar-pilot-baseline';

const assets = import.meta.glob('../../public/content/grammar/ru/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const lesson = (id: string) => assets[`../../public/content/grammar/ru/${id}.md`];
type LessonId = keyof typeof baseline;
const cohort = Object.keys(baseline) as LessonId[];

function grammar(markdown: string) {
  return parseLessonReviewItems(markdown).items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
}

// Check both directions: only the approved successor may claim a shipped pair,
// and adding an unshipped alias is not a way to adopt more of someone's deck.
function identityErrors(id: LessonId, cards: GrammarReviewItem[]) {
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

const stressRecall = new Set(['lock-stress', 'head-accusative-stress', 'feminine-past-stress']);

function frontErrors(card: GrammarReviewItem): string[] {
  const front = `${card.prompt}\n${card.hint}`.normalize('NFD');
  if (stressRecall.has(card.id)) {
    return /\u0301|\b(?:first|second|third|last|initial|final) syllable\b/iu.test(front)
      ? [`${card.id}: stress placement is visible before reveal`] : [];
  }
  if (card.format !== 'cloze') return [];
  // Accent marks aren't what's being graded on a case/aspect/spelling item.
  // Check even one-letter endings and trailing parentheticals; the target
  // is allowed to share a stem, but not to appear as a whole supplied answer.
  const tokens = (text: string): string[] => text.normalize('NFD').replaceAll('\u0301', '')
    .toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? [];
  const answer = tokens(card.answer);
  if (answer.length === 1 && tokens(front).includes(answer[0])) {
    return [`${card.id}: production answer is already a word or ending on the front`];
  }
  return [];
}

describe('Russian grammar pilot — the items the picker actually offers', () => {
  it('reviews exactly the first ten by published order, including the existing spelling reference', () => {
    const firstTen = index.toSorted((a, b) => a.order - b.order).slice(0, 10).map(({ id }) => id);
    expect(cohort).toEqual(firstTen);
    expect(cohort.filter((id) => !isReviewedGrammarLesson('ru', id))).toEqual([]);
    expect([...inventories.map((entry) => entry.lessonId), 'spelling-rules'].sort()).toEqual(firstTen.toSorted());
  });

  it.each(cohort)('%s: offers only reviewed material, with intact quizzes and safe adoption', (id) => {
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
        expect(item.word, item.id).toMatch(/\p{Script=Cyrillic}/u);
      } else {
        expect(frontErrors(item)).toEqual([]);
      }
    }
    const [quizCount, quizSha256] = baseline[id].quizzes;
    const restored = restoreApprovedQuizCorrections(lessonQuizPayloads(markdown), `ru/${id}`, [stressQuizCorrection]);
    expect(restored.errors).toEqual([]);
    expect(fingerprintQuizzes(restored.quizzes)).toEqual({ quizCount, quizSha256 });
    expect(identityErrors(id, grammar(markdown))).toEqual([]);
  });

  it.each(inventories)('$lessonId: preserves the reviewed objectives, required front cues and target forms', (inventory) => {
    expect(validateRetentionLesson(lesson(inventory.lessonId), inventory)).toEqual([]);
  });

  it('keeps rule-recall cards as self-graded concepts that hide their answer and sit in a real lesson section', () => {
    const plain = (text: string) => text.normalize('NFD').replaceAll('\u0301', '').toLowerCase()
      .replace(/[\s.!?;:,]+$/u, '').trim();
    const words = (text: string): string[] => plain(text).match(/[\p{L}\p{M}]+/gu) ?? [];
    // Mild, accepted overlaps: the rule can't be stated without naming ъ, and
    // final devoicing is taught on хлеб, whose spelling card asks for б.
    const exempt = new Set(['rule-hard-sign-position', 'rule-final-devoicing']);
    const errors: string[] = [];
    let ruleCards = 0;
    for (const id of cohort) {
      const markdown = lesson(id);
      const cards = grammar(markdown);
      const sections = lessonHeadings(markdown);
      for (const card of cards.filter((candidate) => candidate.id.startsWith('rule-'))) {
        ruleCards++;
        const front = `${card.prompt}\n${card.hint}`;
        if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${id}/${card.id}: must be concept + qa`);
        if (!plain(card.answer)) errors.push(`${id}/${card.id}: empty answer`);
        else if (plain(front).includes(plain(card.answer))) {
          errors.push(`${id}/${card.id}: answer appears verbatim on the front`);
        }
        // Pairing with an application card is advisory; the section must be real.
        if (!sections.includes(card.sourceSection)) errors.push(`${id}/${card.id}: sourceSection is not a lesson heading`);
        if (exempt.has(card.id)) continue;
        const frontWords = new Set(words(front));
        for (const other of cards) {
          const answer = words(other.answer);
          if (other.id !== card.id && answer.length === 1 && /\p{Script=Cyrillic}/u.test(answer[0])
            && frontWords.has(answer[0])) {
            errors.push(`${id}/${card.id}: front shows ${answer[0]}, the answer of ${other.id}`);
          }
        }
      }
    }
    expect(errors).toEqual([]);
    expect(ruleCards).toBe(35);
  });

  it('teaches мука́ (flour) and му́ка (torment) in the same order in the explanation and scored option', () => {
    const markdown = lesson('stress');
    expect(markdown).toContain('| **мука́** *(muká)* | flour |');
    expect(markdown).toContain('| **му́ка** *(múka)* | torment, suffering |');
    expect(markdown).toContain('В магазине есть мука́, а на экзамене — му́ка.');
    expect(lessonQuizPayloads(markdown)[3]).toEqual(stressQuizCorrection.corrected);
    const withOldError = markdown.replace('мука́ / му́ка (flour / torment)', 'мука́ / му́ка (torment / flour)');
    const restored = restoreApprovedQuizCorrections(lessonQuizPayloads(withOldError), 'ru/stress', [stressQuizCorrection]);
    expect(restored.errors).toEqual(['ru/stress: quiz 4 must match the exact approved corrected payload']);
  });

  it('rejects a copied short answer or a stress placement slipped into optional help', () => {
    const pronoun = grammar(lesson('dative')).find((card) => card.id === 'give-them-time')!;
    expect(frontErrors({ ...pronoun, prompt: 'Дайте ___ время. (им)' })).toEqual([
      'give-them-time: production answer is already a word or ending on the front',
    ]);
    const stress = grammar(lesson('stress')).find((card) => card.id === 'feminine-past-stress')!;
    expect(frontErrors({ ...stress, hint: 'был / была́' })).toEqual([
      'feminine-past-stress: stress placement is visible before reveal',
    ]);
  });

  it('rejects transferring the former negator task to noun inflection, even in the same sentence', () => {
    const [rule, example] = baseline.genitive.identities[0];
    const bad = grammar(lesson('genitive')).map((card) => card.id === 'absent-car'
      ? { ...card, legacyAliases: [...card.legacyAliases, { rule, example }] } : card);
    expect(identityErrors('genitive', bad)).toContain(`${example}: expected no successor, found absent-car`);
  });

  it('rejects an ambiguous aspect prompt even though its metadata and cloze are valid', () => {
    const inventory = inventories.find((entry) => entry.lessonId === 'verb-aspects')!;
    const changed = lesson('verb-aspects').replace(
      'Anna finished reading the whole book. Use читать or прочитать: Анна ___ всю книгу.', 'Я ___ книгу.',
    );
    expect(parseLessonReviewItems(changed).diagnostics).toEqual([]);
    expect(validateRetentionLesson(changed, inventory)).toEqual(expect.arrayContaining([
      expect.stringContaining('finished-book: prompt changed'),
    ]));
  });
});
