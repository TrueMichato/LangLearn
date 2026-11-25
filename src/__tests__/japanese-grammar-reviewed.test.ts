import { describe, expect, it } from 'vitest';
import { reviewed } from '../lib/grammar-reviewed/ja';
import { isReviewedGrammarLesson } from '../lib/grammar-review-scope';
import {
  JA_REVIEW_BASELINE_COMMIT,
  japaneseAnswerAlternatives,
  japaneseBaseline,
  japaneseIdentityErrors,
  japaneseLessonIds,
  japaneseLessonMarkdown,
  japaneseReviewErrors,
  japaneseReviewErrorsFor,
  pairHash,
} from './helpers/japanese-grammar-review';

type CardJson = Record<string, unknown> & { id: string };

const CARD_BLOCK = /<!--\s*grammar-card:\s*([\s\S]*?)\s*-->/g;
const lessonIds = japaneseLessonIds();

function lesson(id: string): string {
  const markdown = japaneseLessonMarkdown(id);
  if (!markdown) throw new Error(`missing ja/${id}.md`);
  return markdown;
}

function cardJson(markdown: string, id: string): CardJson {
  for (const [, json] of markdown.matchAll(CARD_BLOCK)) {
    const card = JSON.parse(json) as CardJson;
    if (card.id === id) return card;
  }
  throw new Error(`no grammar-card "${id}"`);
}

// Mutations go through the parsed card, so they survive later rewording of the real lesson.
function editCard(markdown: string, id: string, edit: (card: CardJson) => CardJson | null): string {
  let found = false;
  const result = markdown.replace(CARD_BLOCK, (block, json: string) => {
    const card = JSON.parse(json) as CardJson;
    if (card.id !== id) return block;
    found = true;
    const next = edit(card);
    return next ? `<!-- grammar-card: ${JSON.stringify(next)} -->` : '';
  });
  if (!found) throw new Error(`no grammar-card "${id}"`);
  return result;
}

function addCardAfter(markdown: string, id: string, ...cards: CardJson[]): string {
  let found = false;
  const result = markdown.replace(CARD_BLOCK, (block, json: string) => {
    if ((JSON.parse(json) as CardJson).id !== id) return block;
    found = true;
    return [block, ...cards.map((card) => `<!-- grammar-card: ${JSON.stringify(card)} -->`)].join('\n');
  });
  if (!found) throw new Error(`no grammar-card "${id}"`);
  return result;
}

/** Asserts the planted violation is reported and was not already reported for the real lesson. */
function expectPlanted(lessonId: string, mutated: string, fragment: string) {
  expect(japaneseReviewErrors(lessonId).filter((error) => error.includes(fragment))).toEqual([]);
  const errors = japaneseReviewErrorsFor(lessonId, mutated);
  expect(errors.some((error) => error.includes(fragment)), `expected "${fragment}" in:\n${errors.join('\n')}`).toBe(true);
  return errors;
}

function shippedPair(lessonId: string, id: string): { rule: string; example: string } {
  const card = cardJson(lesson(lessonId), id);
  const pairs = [{ rule: card.rule as string, example: card.example as string },
    ...((card.legacyAliases as { rule: string; example: string }[] | undefined) ?? [])];
  const pair = pairs.find(({ rule, example }) => pairHash(rule, example) === japaneseBaseline.lessons[lessonId][id].pairs[0]);
  if (!pair) throw new Error(`${lessonId}/${id} no longer owns its shipped pair`);
  return pair;
}

describe('Japanese reviewed-grammar registry', () => {
  it('lists unique, indexed lessons that the review scope recognizes', () => {
    expect(new Set(reviewed).size).toBe(reviewed.length);
    for (const id of reviewed) expect(lessonIds, id).toContain(id);
    for (const id of lessonIds) expect(isReviewedGrammarLesson('ja', id), id).toBe(reviewed.includes(id));
  });

  if (reviewed.length) {
    it.each([...reviewed])('%s passes the Japanese review gate', (id) => {
      expect(japaneseReviewErrors(id)).toEqual([]);
    });
  } else {
    it('has no listed lesson to gate yet', () => {
      expect(reviewed).toEqual([]);
    });
  }
});

describe('Japanese shipped card identities', () => {
  it(`snapshot every indexed lesson's cards as shipped at ${JA_REVIEW_BASELINE_COMMIT}`, () => {
    expect(japaneseBaseline.baselineCommit).toBe(JA_REVIEW_BASELINE_COMMIT);
    expect(lessonIds).toHaveLength(179);
    expect(Object.keys(japaneseBaseline.lessons).sort()).toEqual([...lessonIds].sort());
    for (const [id, cards] of Object.entries(japaneseBaseline.lessons)) {
      expect(Object.keys(cards).length, id).toBeGreaterThan(0);
      for (const card of Object.values(cards)) expect(card.pairs.every((hash) => /^[0-9a-f]{16}$/.test(hash))).toBe(true);
    }
  });

  it('are kept by every Japanese lesson, listed or not', () => {
    expect(lessonIds.flatMap((id) => japaneseIdentityErrors(id))).toEqual([]);
  }, 60_000);
});

describe('Japanese review gate rejects planted violations', () => {
  it('passes the real particles lesson (control)', () => {
    expect(japaneseReviewErrors('particles')).toEqual([]);
  });

  it('flags a Japanese answer printed on the front or hint', () => {
    const card = cardJson(lesson('purpose'), 'motion-purpose-stem');
    const [answer] = japaneseAnswerAlternatives(card.answer as string);
    expect(answer).toBeTruthy();
    expectPlanted('purpose', editCard(lesson('purpose'), card.id, (json) => ({ ...json, hint: `Use ${answer} + に` })),
      `purpose/motion-purpose-stem: [leak] the answer "${answer}" appears verbatim in the hint`);
    expectPlanted('purpose', editCard(lesson('purpose'), card.id, (json) => ({ ...json, example: `${json.example as string} (${answer}に)` })),
      `purpose/motion-purpose-stem: [leak] the answer "${answer}" appears verbatim in the example`);
  });

  it('flags a shipped rule/example pair changed without a legacy alias, and accepts the aliased rewording', () => {
    const reworded = (aliases: unknown[]) => editCard(lesson('particles'), 'topic-marker', (json) => {
      const next: CardJson = { ...json, example: 'As for me (the topic): 私＿＿学生です。', legacyAliases: aliases };
      if (!aliases.length) delete next.legacyAliases;
      return next;
    });
    expectPlanted('particles', reworded([]), 'particles/topic-marker: [identity] shipped rule/example pair changed');

    const existing = (cardJson(lesson('particles'), 'topic-marker').legacyAliases as unknown[] | undefined) ?? [];
    const shipped = shippedPair('particles', 'topic-marker');
    const aliases = existing.some((alias) => JSON.stringify(alias) === JSON.stringify(shipped)) ? existing : [...existing, shipped];
    expect(japaneseIdentityErrors('particles', reworded(aliases))).toEqual([]);
  });

  it('flags legacy aliases that were never shipped by that card', () => {
    expectPlanted('particles', editCard(lesson('particles'), 'topic-marker', (json) => ({
      ...json, legacyAliases: [...(json.legacyAliases as unknown[] | undefined) ?? [], { rule: 'は (topic)', example: '彼＿＿先生です。' }],
    })), 'particles/topic-marker: [identity] unauthorized legacyAliases entry');

    const stolen = editCard(lesson('particles'), 'subject-marker', (json) => ({
      ...json, legacyAliases: [...(json.legacyAliases as unknown[] | undefined) ?? [], shippedPair('particles', 'topic-marker')],
    }));
    expectPlanted('particles', stolen, 'particles/subject-marker: [identity] claims a shipped rule/example pair of "topic-marker"');
    expectPlanted('particles', stolen, 'particles/subject-marker: [identity] unauthorized legacyAliases entry');
  });

  it('flags a deleted or renamed shipped id', () => {
    expectPlanted('particles', editCard(lesson('particles'), 'de-means', () => null),
      'particles/de-means: [identity] shipped card id "de-means" was deleted or renamed');
    expectPlanted('particles', editCard(lesson('particles'), 'ni-time', (json) => ({ ...json, id: 'ni-clock-time' })),
      'particles/ni-time: [identity] shipped card id "ni-time" was deleted or renamed');
  });

  it('flags an interpretation prompt classified as concept', () => {
    expectPlanted('particles', editCard(lesson('particles'), 'topic-reading-cue', (json) => ({
      ...json, example: 'What does 私は学生です mean?',
    })), 'particles/topic-reading-cue: [concept-phrasing]');
  });

  it('flags rule-* cards that are not recall, are choices, or print another card\'s answer', () => {
    const section = cardJson(lesson('particles'), 'topic-marker').sourceSection as string;
    const ruleCard = (id: string, fields: Partial<CardJson> = {}): CardJson => ({
      id, kind: 'concept', format: 'qa', priority: 'optional', sourceSection: section,
      rule: 'は marks what the sentence is about', example: 'What does the topic particle set up for the rest of the sentence?',
      answer: 'What the sentence is about; the comment follows.', explanation: 'Any paraphrase of "the topic" counts.', ...fields,
    });
    const particles = lesson('particles');
    expectPlanted('particles', addCardAfter(particles, 'topic-marker', ruleCard('rule-topic-scope', {
      kind: 'rule', format: 'cloze', example: '私＿＿学生です。', answer: 'は',
    })), 'particles/rule-topic-scope: [rule-card] must be kind "concept", format "qa"');
    expectPlanted('particles', addCardAfter(particles, 'topic-marker', ruleCard('rule-new-subject', {
      example: 'Which particle introduces new information, は or が?', answer: 'が',
    })), 'particles/rule-new-subject: [rule-card] ends in an "X or Y?" choice');
    expectPlanted('particles', addCardAfter(particles, 'topic-marker', ruleCard('rule-summary', { sourceSection: 'Summary' })),
      'particles/rule-summary: [rule-card] sourceSection "Summary" is a summary/reference heading');
    expectPlanted('particles', addCardAfter(particles, 'topic-marker',
      ...['a', 'b', 'c', 'd', 'e'].map((suffix) => ruleCard(`rule-extra-${suffix}`, { priority: 'essential' }))),
    'particles: [rule-card] 5 rule-* cards; at most 4 per lesson');

    const purpose = lesson('purpose');
    const [stem] = japaneseAnswerAlternatives(cardJson(purpose, 'motion-purpose-stem').answer as string);
    expectPlanted('purpose', addCardAfter(purpose, 'motion-purpose-stem', ruleCard('rule-motion-stem', {
      sourceSection: cardJson(purpose, 'motion-purpose-stem').sourceSection as string,
      example: `Before に and a motion verb, which form does ${stem}に行く use?`,
      answer: 'The ます-stem.',
    })), `purpose/rule-motion-stem: [rule-card] front shows "${stem}", which card "motion-purpose-stem"`);
  });

  it('keeps は as the written particle and wa as its reading', () => {
    expectPlanted('particles', editCard(lesson('particles'), 'topic-marker', (json) => ({ ...json, answer: 'wa' })),
      'particles/topic-marker: [particle-reading] must stay kind "rule", format "cloze" with answer exactly "は"');
    expectPlanted('particles', editCard(lesson('particles'), 'topic-marker', (json) => ({ ...json, answer: 'wa' })),
      'particles/topic-marker: [particle-reading] answer "wa" is a romaji reading');
    expectPlanted('particles', editCard(lesson('particles'), 'topic-marker', (json) => ({ ...json, hint: 'Pronounced wa' })),
      'particles/topic-marker: [particle-reading] the front must not show は next to the blank or the romaji "wa"');
  });
});
