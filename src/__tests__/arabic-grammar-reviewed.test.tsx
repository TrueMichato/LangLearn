/// <reference types="node" />
// Gate for Arabic lessons listed in src/lib/grammar-reviewed/ar.ts (see the
// review contract in docs/knowledge-practice.md). Identity checks compare with
// fixtures/arabic-grammar-reviewed-baseline.json, generated with
// parseLessonReviewItems from every indexed lesson at commit
// ab35670cc1b6a4bdf9425a22d457b14f326562b7 (`git show ab35670:public/content/grammar/ar/<id>.md`).
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/ar/index.json';
import GrammarFace from '../components/grammar/GrammarFace';
import { hasBlank } from '../lib/grammar-cards';
import { reviewed } from '../lib/grammar-reviewed/ar';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks, type GrammarReviewItem, type LessonReviewItem } from '../lib/lesson-review';
import legacyJson from './fixtures/grammar-retention-legacy.json';
import baselineJson from './fixtures/arabic-grammar-reviewed-baseline.json';
import {
  lessonRetirements,
  validateGrammarRetirements,
  validateRetirementRecords,
} from './helpers/grammar-retirements';
import {
  lessonHeadings,
  parseRetentionInventory,
  validateLegacyLesson,
  validateRetentionLesson,
  type LegacyBaseline,
  type LessonInventory,
} from './helpers/grammar-retention';

interface BaselineItem { kind: string; identities: [rule: string, example: string][] }
const BASELINE = baselineJson as unknown as { sourceCommit: string; lessons: Record<string, { items: Record<string, BaselineItem> }> };
const LEGACY: LegacyBaseline = legacyJson;
const MARKDOWN = import.meta.glob('../../public/content/grammar/ar/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const INVENTORY_FILES = import.meta.glob('./fixtures/grammar-retention/ar-*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

// Each map needs a reason; keys are 'lessonId/itemId' (NO_CONCEPT_EXEMPT: 'lessonId').
const ANSWER_ON_FRONT_EXEMPT: Record<string, string> = {};
const RULE_FRONT_LEAK_EXEMPT: Record<string, string> = {};
const CONCEPT_RECALL_EXEMPT: Record<string, string> = {};
const NO_CONCEPT_EXEMPT: Record<string, string> = {};

const unique = (ids: string[]) => [...new Set(ids)];
const indexIds = index.toSorted((a, b) => a.order - b.order).map(({ id }) => id);
const lesson = (id: string): string | undefined => MARKDOWN[`../../public/content/grammar/ar/${id}.md`];
// AR_REVIEW_CANDIDATES=id1,id2 gates lessons before they are listed in ar.ts.
const candidates = (process.env.AR_REVIEW_CANDIDATES ?? '').split(',').map((id) => id.trim()).filter(Boolean);
const lessons = unique([...reviewed, ...candidates]).filter((id) => indexIds.includes(id));

const inventories = new Map<string, LessonInventory>();
for (const [file, raw] of Object.entries(INVENTORY_FILES)) {
  const { inventory, errors } = parseRetentionInventory(raw);
  if (!inventory) throw new Error(`${file}: ${errors.join('; ')}`);
  for (const entry of inventory.lessons) inventories.set(entry.lessonId, entry);
}

const headingCache = new Map<string, string[]>();
const headings = (id: string) => {
  if (!headingCache.has(id)) headingCache.set(id, lessonHeadings(lesson(id)!));
  return headingCache.get(id)!;
};
const grammar = (markdown: string) =>
  parseLessonReviewItems(markdown).items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');

// Harakat stay: many Arabic cards cue the base form and test only its vowels, shadda,
// tanwin or a dropped weak letter, so a mark-stripped substring match flags them falsely.
const norm = (text: string) => text.normalize('NFC').replace(/\u0640/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim();
const bare = (word: string) => word.replace(/[\u064B-\u065F\u0670]/gu, '');
const letterCount = (text: string) => text.match(/\p{Letter}/gu)?.length ?? 0;
const tokens = (text: string) => norm(text).split(/[\s\p{P}\p{S}]+/u).filter(Boolean);
/** Identical, or the same skeleton when either side is unvocalized (so vowels cannot be the contrast). */
const sameWord = (a: string, b: string) => a === b || (bare(a) === bare(b) && (a === bare(a) || b === bare(b)));
const showsWords = (front: string[], answer: string[]) => front.some((_, start) =>
  answer.every((word, offset) => start + offset < front.length && sameWord(word, front[start + offset])));
const pairKey = (rule: string, example: string) => JSON.stringify([rule, example]);
const ownPairs = (card: GrammarReviewItem) =>
  [[card.rule, card.prompt], ...card.legacyAliases.map((alias) => [alias.rule, alias.example])] as [string, string][];
const isRuleCard = (card: GrammarReviewItem) => card.id.startsWith('rule-');
const NON_TEACHING_SECTION = /sources|summary|reference|recap|further reading|cheat ?sheet/i;
// "choose" only as an instruction; "the order used to choose a hamza seat" is still recall.
const INTERPRETATION_PROMPT = /\b(why might|unclear|translate|rewrite|in (this|the|that) sentence|which (of these|sentence|option))\b|(^|[.!?:;]\s*)choose\b/i;
// Reviewed example-analysis targets that generic English heuristics cannot
// distinguish from declarative recall. Their prompts must stay applications.
const APPLICATION_TARGETS: Record<string, readonly string[]> = {
  adjectives: ['predicate-not-modifier'],
  'conditional-answers': ['bare-result-no-fa'],
  'conditional-particles-deep': ['linking-kasra-jussive'],
  'energetic-nun': ['feminine-nun-contrast'],
  'root-system': ['root-pattern-division'],
  nisba: ['nisba-stem-change'],
  diptotes: ['diptote-case-not-ending'],
  'form-ix-verbs': ['quality-not-only-colors'],
};

function identityErrors(id: string, items: LessonReviewItem[]): string[] {
  const cards = items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
  const previous = BASELINE.lessons[id]?.items ?? {};
  const errors = validateGrammarRetirements(`ar/${id}`, items);
  const retired = new Map(lessonRetirements(`ar/${id}`));
  const owners = new Map<string, Set<string>>();
  for (const card of cards) {
    for (const [rule, example] of ownPairs(card)) {
      const key = pairKey(rule, example);
      owners.set(key, (owners.get(key) ?? new Set()).add(card.id));
    }
  }
  for (const [itemId, item] of Object.entries(previous)) {
    if (retired.has(itemId)) continue;
    if (!cards.some((card) => card.id === itemId)) errors.push(`${itemId}: baseline item is missing`);
    for (const [rule, example] of item.identities) {
      const found = [...owners.get(pairKey(rule, example)) ?? []];
      if (found.length !== 1 || found[0] !== itemId) {
        errors.push(`${itemId}: baseline identity ${pairKey(rule, example)} is owned by ${found.join(', ') || 'no item'}`);
      }
    }
  }
  for (const card of cards) {
    const allowed = new Set((previous[card.id]?.identities ?? []).map(([rule, example]) => pairKey(rule, example)));
    for (const alias of card.legacyAliases) {
      if (!previous[card.id]) errors.push(`${card.id}: new item must not declare legacyAliases (${pairKey(alias.rule, alias.example)})`);
      else if (!allowed.has(pairKey(alias.rule, alias.example))) {
        errors.push(`${card.id}: legacy alias ${pairKey(alias.rule, alias.example)} is not one of its baseline identities`);
      }
    }
  }
  for (const [key, ids] of owners) {
    if (ids.size > 1) errors.push(`${[...ids].join(', ')}: share identity ${key}`);
  }
  return errors;
}

function ruleCardErrors(id: string, cards: GrammarReviewItem[]): string[] {
  const previous = BASELINE.lessons[id]?.items ?? {};
  const rules = cards.filter(isRuleCard);
  const errors: string[] = [];
  for (const card of rules) {
    if (previous[card.id]) errors.push(`${card.id}: rule cards must be new items, not baseline ids`);
    if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${card.id}: must be kind "concept" + format "qa"`);
    if (!card.answer.trim()) errors.push(`${card.id}: empty answer`);
    if (!headings(id).includes(card.sourceSection)) errors.push(`${card.id}: sourceSection "${card.sourceSection}" is not a lesson heading`);
    else if (NON_TEACHING_SECTION.test(card.sourceSection)) {
      errors.push(`${card.id}: sourceSection "${card.sourceSection}" is not a teaching section`);
    }
  }
  if (rules.length > 4) errors.push(`${rules.length} rule cards (max 4): ${rules.map((card) => card.id).join(', ')}`);
  const essential = rules.filter((card) => card.priority === 'essential');
  if (essential.length > 2) errors.push(`${essential.length} essential rule cards (max 2): ${essential.map((card) => card.id).join(', ')}`);
  return errors;
}

function answerOnFrontErrors(id: string, cards: GrammarReviewItem[]): string[] {
  return cards.filter((card) => !ANSWER_ON_FRONT_EXEMPT[`${id}/${card.id}`]).flatMap((card) => {
    const answer = tokens(card.answer);
    if (letterCount(card.answer) < 3) return [];
    return [card.prompt, card.hint].some((front) => showsWords(tokens(front), answer))
      ? [`${card.id}: answer "${card.answer}" is visible in "${card.prompt}"${card.hint ? ` / hint "${card.hint}"` : ''}`] : [];
  });
}

function ruleFrontLeakErrors(id: string, cards: GrammarReviewItem[]): string[] {
  const answers = cards.flatMap((card) => {
    const answer = tokens(card.answer);
    return answer.length === 1 && /^\p{Script=Arabic}+$/u.test(bare(answer[0])) && letterCount(answer[0]) >= 2
      ? [{ id: card.id, token: answer[0] }] : [];
  });
  return cards.filter((card) => isRuleCard(card) && !RULE_FRONT_LEAK_EXEMPT[`${id}/${card.id}`]).flatMap((card) => {
    const front = tokens(`${card.prompt} ${card.hint}`);
    return answers.filter((other) => other.id !== card.id && showsWords(front, [other.token]))
      .map((other) => `${card.id}: front shows ${other.token}, the answer of ${other.id}`);
  });
}

function conceptRecallErrors(id: string, cards: GrammarReviewItem[]): string[] {
  const applications = cards.filter((card) => APPLICATION_TARGETS[id]?.includes(card.id) &&
    (card.kind !== 'rule' || card.format !== 'qa'))
    .map((card) => `${card.id}: reviewed example analysis must be kind "rule" + format "qa"`);
  return [...applications, ...cards.filter((card) => card.kind === 'concept' && !CONCEPT_RECALL_EXEMPT[`${id}/${card.id}`]).flatMap((card) => [
    ...(card.format !== 'qa' ? [`${card.id}: concept card must be format "qa", not "${card.format}"`] : []),
    ...(hasBlank(card.prompt) ? [`${card.id}: concept prompt has a blank: "${card.prompt}"`] : []),
    ...(INTERPRETATION_PROMPT.test(card.prompt) ? [`${card.id}: interpretation/application wording in concept prompt: "${card.prompt}"`] : []),
  ])];
}

const REGRESSIONS: Record<string, [title: string, check: (cards: GrammarReviewItem[]) => void]> = {
  'arabic-script': ['keeps the six-non-connectors recall card exactly', (cards) => {
    const card = cards.find((candidate) => candidate.id === 'six-non-connectors');
    expect(card && {
      kind: card.kind, format: card.format, sourceSection: card.sourceSection, prompt: card.prompt, answer: card.answer,
    }).toEqual({
      kind: 'concept', format: 'qa', sourceSection: 'Core idea',
      prompt: 'Which six Arabic letters interrupt joining to the next letter on the left?', answer: 'ا، د، ذ، ر، ز، و',
    });
  }],
  'omitted-mubtada-khabar': ['treats recoverability-condition as an application question', (cards) => {
    const card = cards.find((candidate) => candidate.id === 'recoverability-condition');
    expect(card && { kind: card.kind, format: card.format }).toEqual({ kind: 'rule', format: 'qa' });
  }],
};

describe('Arabic reviewed grammar registry', () => {
  it('covers the complete published Arabic catalog, never an empty or partial registry', () => {
    expect(indexIds).not.toHaveLength(0);
    expect(reviewed).toEqual(indexIds);
  });

  it('lists indexed lessons once, in published order', () => {
    expect(reviewed.filter((id) => !indexIds.includes(id)), 'ar.ts lists ids missing from the Arabic index').toEqual([]);
    expect(reviewed.filter((id, i) => reviewed.indexOf(id) !== i), 'ar.ts lists duplicate ids').toEqual([]);
    expect(reviewed, 'ar.ts must follow index.json order').toEqual(indexIds.filter((id) => reviewed.includes(id)));
  });

  it('only gates AR_REVIEW_CANDIDATES that exist in the Arabic index', () => {
    expect(candidates.filter((id) => !indexIds.includes(id)),
      'AR_REVIEW_CANDIDATES lists ids that are not in public/content/grammar/ar/index.json').toEqual([]);
  });

  it('keeps every exemption tied to a real item and reason', () => {
    const stale = Object.entries({ ...ANSWER_ON_FRONT_EXEMPT, ...RULE_FRONT_LEAK_EXEMPT, ...CONCEPT_RECALL_EXEMPT })
      .filter(([key, reason]) => {
        const [id, itemId] = key.split('/');
        const markdown = lesson(id);
        return !reason.trim() || !markdown || !grammar(markdown).some((card) => card.id === itemId);
      }).map(([key]) => key);
    stale.push(...Object.entries(NO_CONCEPT_EXEMPT).filter(([id, reason]) => !reason.trim() || !lesson(id)).map(([id]) => id));
    expect(stale, 'exemptions without a reason or a matching lesson item').toEqual([]);
  });

  it('pins the identity baseline to its source commit', () => {
    expect(BASELINE.sourceCommit).toBe('ab35670cc1b6a4bdf9425a22d457b14f326562b7');
  });

  it('allows only reasoned retirements of exact frozen shipped identities', () => {
    expect(validateRetirementRecords()).toEqual([]);
  });
});

if (!lessons.length) {
  describe('Arabic reviewed lessons', () => {
    it.skip('no lessons are listed in ar.ts or AR_REVIEW_CANDIDATES yet', () => {});
  });
} else {
  describe.each(lessons)('Arabic reviewed lesson %s', (id) => {
    const markdown = lesson(id)!;
    const cards = () => grammar(markdown);

    it('1. parses cleanly with one explicit vocab-inventory control and only authored items', () => {
      const { items, diagnostics } = parseLessonReviewItems(markdown);
      expect(diagnostics, 'parse diagnostics').toEqual([]);
      const control = readLessonReviewBlocks(markdown, 'vocab-inventory');
      expect(control.diagnostics, 'vocab-inventory diagnostics').toEqual([]);
      expect(control.items, 'exactly one <!-- vocab-inventory: {"mode":"explicit"} -->').toHaveLength(1);
      expect(items.filter((item) => item.provenance !== 'authored').map((item) => item.id), 'non-authored items').toEqual([]);
    });

    it('2. keeps the legacy baseline and the reviewed inventory', () => {
      const legacy = LEGACY.lessons[`ar/${id}`];
      if (legacy) expect(validateLegacyLesson(markdown, legacy, `ar/${id}`), 'validateLegacyLesson').toEqual([]);
      const inventory = inventories.get(id);
      expect(inventory, `no ar-*.json inventory lists ${id}`).toBeDefined();
      expect(validateRetentionLesson(markdown, inventory!, legacy, `ar/${id}`), 'validateRetentionLesson').toEqual([]);
    });

    it('3. preserves baseline identities without inventing or sharing aliases', () => {
      expect(identityErrors(id, parseLessonReviewItems(markdown).items)).toEqual([]);
    });

    it('4. adds at most four new rule-recall cards in real teaching sections', () => {
      expect(ruleCardErrors(id, cards())).toEqual([]);
    });

    it('5. hides every answer from its prompt and hint', () => {
      expect(answerOnFrontErrors(id, cards())).toEqual([]);
    });

    it("6. keeps other cards' one-word Arabic answers off rule-card fronts", () => {
      expect(ruleFrontLeakErrors(id, cards())).toEqual([]);
    });

    it('7. asks concept cards as declarative recall', () => {
      expect(conceptRecallErrors(id, cards())).toEqual([]);
    });

    it('8. has at least one concept card', () => {
      if (NO_CONCEPT_EXEMPT[id]) return;
      expect(cards().filter((card) => card.kind === 'concept'), 'no kind:"concept" card').not.toHaveLength(0);
    });

    const regression = REGRESSIONS[id];
    if (regression) it(`9. ${regression[0]}`, () => regression[1](cards()));
  });
}

describe('answer visibility matching', () => {
  it.each([
    ['vowel-only inflection of the cue word', 'Complete: لَنْ ___. (أَذْهَبُ)', 'أَذْهَبَ', false],
    ['weak letter dropped from the cue word', 'Negate يَدْعُو with لَمْ: لَمْ ___.', 'يَدْعُ', false],
    ['English answer inside a longer word', 'What did you study yesterday?', 'yes', false],
    ['vocalized answer quoted on the front', 'Which mood is لَنْ أَذْهَبَ?', 'أَذْهَبَ', true],
    ['unvocalized answer skeleton on the front', 'What does كتاب mean?', 'كِتَابٌ', true],
    ['multi-word English answer', 'Name the mood (the subjunctive mood) after لَنْ.', 'subjunctive mood', true],
  ])('%s', (_title, front, answer, shown) => {
    expect(showsWords(tokens(front), tokens(answer))).toBe(shown);
  });
});

describe('Arabic guard wiring through parsed lesson mutations', () => {
  const mutate = (id: string, itemId: string, patch: Record<string, unknown> | null) => {
    const markdown = lesson(id)!;
    let changed = false;
    const modified = markdown.replace(/<!-- grammar-card: (.*?) -->/g, (block, raw: string) => {
      const value = JSON.parse(raw) as Record<string, unknown>;
      if (value.id !== itemId) return block;
      changed = true;
      return patch === null ? '' : `<!-- grammar-card: ${JSON.stringify({ ...value, ...patch })} -->`;
    });
    expect(changed).toBe(true);
    const parsed = parseLessonReviewItems(modified);
    expect(parsed.diagnostics).toEqual([]);
    return grammar(modified);
  };

  it('rejects missing baseline aliases, invented aliases, and alias transfers', () => {
    expect(identityErrors('definite-article', mutate('definite-article', 'article-spelling-sound', {
      legacyAliases: [],
    })).join('\n')).toContain('baseline identity');
    expect(identityErrors('definite-article', mutate('definite-article', 'article-spelling-sound', {
      legacyAliases: [{ rule: 'Unshipped intermediate rule', example: 'Unshipped intermediate prompt' }],
    })).join('\n')).toContain('is not one of its baseline identities');
    const [rule, example] = BASELINE.lessons['definite-article'].items['article-spelling-sound'].identities[0];
    expect(identityErrors('definite-article', mutate('definite-article', 'sun-letter-application', {
      legacyAliases: [{ rule, example }],
    })).join('\n')).toContain('share identity');
  });

  it('rejects an unexpected deletion but accepts only the approved source retirements', () => {
    expect(identityErrors('predicate-types', grammar(lesson('predicate-types')!))).toEqual([]);
    expect(identityErrors('predicate-types', mutate('predicate-types', 'phrase-predicate', null)).join('\n'))
      .toContain('baseline item is missing');
  });

  it('rejects retired identity transfer and reappearance in the Arabic identity gate', () => {
    const id = 'predicate-types';
    const [rule, example] = BASELINE.lessons[id].items['predicate-inventory'].identities[0];
    expect(identityErrors(id, mutate(id, 'phrase-predicate', {
      legacyAliases: [{ rule, example }],
    })).join('\n')).toContain('retired identity transferred');
    expect(identityErrors(id, mutate(id, 'rule-semi-sentence', {
      id: 'predicate-inventory', rule, example,
    })).join('\n')).toContain('retired source reappeared');
    expect(identityErrors(id, mutate(id, 'rule-semi-sentence', null)).join('\n'))
      .toContain('missing retirement replacement');
  });

  it.each(Object.entries(APPLICATION_TARGETS).flatMap(([id, ids]) => ids.map((itemId) => [id, itemId])))(
    'does not relabel %s/%s analysis as declarative recall', (id, itemId) => {
      expect(conceptRecallErrors(id, grammar(lesson(id)!))).toEqual([]);
      expect(conceptRecallErrors(id, mutate(id, itemId, { kind: 'concept' })).join('\n'))
        .toContain('reviewed example analysis must be kind "rule" + format "qa"');
    },
  );

  it('rejects application wording in a generic concept front', () => {
    const id = 'definite-article';
    expect(conceptRecallErrors(id, mutate(id, 'article-spelling-sound', {
      example: 'Translate this phrase into Arabic.',
    })).join('\n')).toContain('interpretation/application wording');
  });

  it.each(['example', 'hint'])('catches own-answer leakage in the actual %s field', (field) => {
    const id = 'definite-article';
    const card = grammar(lesson(id)!).find((item) => item.id === 'sun-letter-application')!;
    expect(answerOnFrontErrors(id, grammar(lesson(id)!))).toEqual([]);
    expect(answerOnFrontErrors(id, mutate(id, card.id, {
      [field]: field === 'example' ? `${card.prompt} ${card.answer}` : card.answer,
    })).join('\n')).toContain(`${card.id}: answer`);
  });

  it('checks new rule fronts for another card’s answer without banning application cues', () => {
    const id = 'definite-article';
    const cards = grammar(lesson(id)!);
    const rule = cards.find(isRuleCard)!;
    const answer = cards.find((card) => card.id === 'sun-letter-application')!.answer;
    expect(ruleFrontLeakErrors(id, cards)).toEqual([]);
    expect(ruleFrontLeakErrors(id, mutate(id, rule.id, { hint: `For example: ${answer}` })).join('\n'))
      .toContain(`${rule.id}: front shows`);
    expect(ruleFrontLeakErrors(id, mutate(id, 'moon-letter-application', { hint: `Compare ${answer}` }))).toEqual([]);
  });
});

describe('GrammarFace Arabic direction', () => {
  const decode = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const dirOf = (html: string, text: string) => [...html.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)]
    .find((match) => decode(match[2]) === text)?.[1].match(/\bdir="(\w+)"/)?.[1];
  const face = (prompt: string, language = 'ar', side: 'front' | 'back' = 'front', answer = 'answer') => renderToStaticMarkup(
    <GrammarFace card={{ prompt, answer, hint: '', explanation: '', rule: '', format: 'qa' }} side={side} language={language} />,
  );

  it.each([
    ['English sentence opening with an Arabic word', 'كَبِيرٌ is indefinite and functions as the predicate in this sentence.', 'ltr'],
    ['English cue opening with a glossed Arabic verb', 'عَلِمَ (he knew) → Form II, he taught: ___.', 'ltr'],
    ['Arabic sentence with a trailing transliteration', 'ذَهَبَ الْوَلَدُ إِلَى الْمَدْرَسَةِ (dhahaba al-waladu ilā al-madrasati)', 'rtl'],
    ['equal Latin and Arabic letters, Arabic first', 'كتاب book', 'rtl'],
    ['Latin-first lead-in', 'Complete: ___ الْكِتَابُ', 'ltr'],
  ])('%s', (_, prompt, dir) => {
    expect(dirOf(face(prompt), prompt)).toBe(dir);
  });

  it('keeps the first-letter rule outside Arabic lessons', () => {
    const prompt = 'كَبِيرٌ is indefinite and functions as the predicate in this sentence.';
    expect(dirOf(face(prompt, 'ru'), prompt)).toBe('rtl');
  });

  it('renders the real six-non-connectors prompt LTR and its Arabic answer RTL', () => {
    const card = grammar(lesson('arabic-script')!).find((candidate) => candidate.id === 'six-non-connectors')!;
    const render = (side: 'front' | 'back') => renderToStaticMarkup(
      <GrammarFace card={card} side={side} language="ar" lessonId="arabic-script" />,
    );
    expect(dirOf(render('front'), card.prompt)).toBe('ltr');
    expect(dirOf(render('back'), card.answer)).toBe('rtl');
  });
});
