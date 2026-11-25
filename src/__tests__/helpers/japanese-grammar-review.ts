/// <reference types="node" />
import { createHash } from 'node:crypto';
import { BLANK_REGEX } from '../../lib/grammar-cards';
import { parseLessonReviewItems } from '../../lib/lesson-capture';
import type { GrammarReviewItem, LegacyGrammarAlias } from '../../lib/lesson-review';
import legacyJson from '../fixtures/grammar-retention-legacy.json';
import {
  indexedLessonIds,
  lessonHeadings,
  parseRetentionInventory,
  validateLegacyLesson,
  validateRetentionLesson,
  type LegacyBaseline,
  type LessonInventory,
} from './grammar-retention';

/**
 * Gate for listing a Japanese lesson in src/lib/grammar-reviewed/ja.ts. Every
 * error reads `<lessonId>[/<cardId>]: [check] message` so authors can act on it.
 * The rubric is docs/knowledge-practice.md ("Authoring contract", "Rule-recall
 * cards", "Gates before extending the pilot").
 */

export const JA_REVIEW_BASELINE_COMMIT = 'ab35670';

// Keys are `lessonId/cardId`; values say why the card is acceptable anyway.
export const CONCEPT_PHRASING_EXEMPTIONS: Readonly<Record<string, string>> = {};
export const LEAK_EXEMPTIONS: Readonly<Record<string, string>> = {};
// Keys are `lessonId/cardId/answerText` (the other card's normalized answer).
export const RULE_FRONT_EXEMPTIONS: Readonly<Record<string, string>> = {};

export interface JapaneseBaselineCard {
  kind: 'rule' | 'concept';
  format: 'qa' | 'cloze';
  /** Shipped (rule, example) first, then each shipped legacy alias, as pairHash values. */
  pairs: string[];
}

export interface JapaneseReviewBaseline {
  baselineCommit: string;
  lessons: Record<string, Record<string, JapaneseBaselineCard>>;
}

const LESSON_ASSETS = import.meta.glob('../../../public/content/grammar/ja/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const INDEX_ASSET = import.meta.glob('../../../public/content/grammar/ja/index.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const INVENTORY_ASSETS = import.meta.glob('../fixtures/grammar-retention/ja-*.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const BASELINE_ASSET = import.meta.glob('../fixtures/japanese-grammar-reviewed-baseline.json', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const LEGACY: LegacyBaseline = legacyJson;

export const japaneseBaseline: JapaneseReviewBaseline = JSON.parse(
  Object.values(BASELINE_ASSET)[0] ?? '{"baselineCommit":"","lessons":{}}',
) as JapaneseReviewBaseline;

let lessonIds: string[] | undefined;

export function japaneseLessonIds(): string[] {
  lessonIds ??= indexedLessonIds(Object.values(INDEX_ASSET)[0]);
  return [...lessonIds];
}

export function japaneseLessonMarkdown(lessonId: string): string | undefined {
  return LESSON_ASSETS[`../../../public/content/grammar/ja/${lessonId}.md`];
}

export function pairHash(rule: string, example: string): string {
  return createHash('sha256').update(`${rule}\u0000${example}`).digest('hex').slice(0, 16);
}

function ownPairs(card: GrammarReviewItem): LegacyGrammarAlias[] {
  return [{ rule: card.rule, example: card.prompt }, ...card.legacyAliases];
}

/** How the committed baseline fixture was captured (from `git show <commit>:<path>`). */
export function captureJapaneseCardIdentities(markdown: string): Record<string, JapaneseBaselineCard> {
  const parsed = parseLessonReviewItems(markdown);
  if (parsed.diagnostics.length) throw new Error(JSON.stringify(parsed.diagnostics));
  const cards = parsed.items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
  return Object.fromEntries(cards.map((card) => [card.id, {
    kind: card.kind,
    format: card.format,
    pairs: [...new Set(ownPairs(card).map((pair) => pairHash(pair.rule, pair.example)))],
  }]));
}

// ---------------------------------------------------------------------------
// Japanese text helpers shared by the leak and rule-front checks.

const J_CLASS = '[\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Han}]';
const JAPANESE = new RegExp(J_CLASS, 'u');
const JAPANESE_RUN_2 = new RegExp(`${J_CLASS}{2,}`, 'u');
const IN_RUN = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー]/u;
const HIRAGANA_ONLY = /^\p{Script=Hiragana}+$/u;
// Endings that turn a stem into a citation form: verb/i-adjective endings, だ/です/な, する.
const CITATION_ENDING = /^(?:[うくぐすつぬぶむるい]|だ|です|な|する)$/u;
const EDGE = String.raw`\s。、，,.!?！？「」『』"'“”‘’:：;；…〜~～・\-—–[\]【】()（）`;
const EDGE_NOISE = new RegExp(`^[${EDGE}]+|[${EDGE}]+$`, 'gu');

function stripParentheticals(text: string): string {
  let previous: string;
  let current = text;
  do {
    previous = current;
    current = current.replace(/（[^（）]*）|\([^()]*\)/g, ' ');
  } while (current !== previous);
  return current;
}

/**
 * Japanese spans (≥ 2 characters) of an answer that a learner could copy:
 * parentheticals dropped, split on / ／ 、 , ， ・ and " or ", edge punctuation
 * and 〜 trimmed. Single kana are left to the particle-specific checks.
 */
export function japaneseAnswerAlternatives(answer: string): string[] {
  const alternatives = stripParentheticals(answer)
    .split(/\s*(?:\/|／|、|,|，|・|\s+or\s+)\s*/u)
    .map((part) => part.replace(/^(?:and|or)\s+/iu, '').replace(EDGE_NOISE, ''))
    .filter((part) => JAPANESE.test(part) && [...part].length >= 2);
  return [...new Set(alternatives)];
}

function isJapanese(char: string | undefined): boolean {
  return !!char && IN_RUN.test(char);
}

/**
 * A citation-form cue the learner must transform, e.g. 食べ in "(食べる)",
 * "食べる →" or "the ます-stem of 食べる": the answer begins a standalone
 * Japanese word that only adds a dictionary ending (る, い, だ, する…).
 * "(食べに)" or "(食べます)" still count as giving the answer away.
 */
function isLemmaCue(text: string, at: number, alternative: string): boolean {
  if (isJapanese(text[at - 1])) return false;
  let end = at + alternative.length;
  while (isJapanese(text[end])) end += 1;
  return CITATION_ENDING.test(text.slice(at + alternative.length, end));
}

/** Two-kana function morphemes (ない, ます, だけ…) also end many unrelated words (かもしれない). */
function isEmbeddedMorpheme(text: string, at: number, alternative: string): boolean {
  return [...alternative].length === 2 && HIRAGANA_ONLY.test(alternative) &&
    /\p{Script=Hiragana}/u.test(text[at - 1] ?? '');
}

/** Offsets where `alternative` appears in `text` as something a learner could copy. */
function copyableOffsets(text: string, alternative: string): number[] {
  const offsets: number[] = [];
  for (let at = text.indexOf(alternative); at !== -1; at = text.indexOf(alternative, at + 1)) {
    if (!isLemmaCue(text, at, alternative) && !isEmbeddedMorpheme(text, at, alternative)) offsets.push(at);
  }
  return offsets;
}

const OPEN_QUOTE = '[「『"“\'‘]?';
const CLOSE_QUOTE = '[」』"”\'’]?';
const CHOICE_SEPARATOR = String.raw`\s*(?:\bor\b|\bvs\.?|\bversus\b|/|／)\s*`;
const CHOICE_AFTER = new RegExp(`^${CLOSE_QUOTE}${CHOICE_SEPARATOR}${OPEN_QUOTE}${J_CLASS}`, 'u');
const CHOICE_BEFORE = new RegExp(`${J_CLASS}${CLOSE_QUOTE}${CHOICE_SEPARATOR}${OPEN_QUOTE}$`, 'u');

/** The answer is one listed option ("食べれる or 食べられる", hint "いる / ある"). */
function isListedOption(text: string, at: number, alternative: string): boolean {
  return CHOICE_AFTER.test(text.slice(at + alternative.length)) || CHOICE_BEFORE.test(text.slice(0, at));
}

function insideParentheses(text: string, at: number): boolean {
  let depth = 0;
  for (const char of text.slice(0, at)) {
    if (char === '(' || char === '（') depth += 1;
    else if ((char === ')' || char === '）') && depth > 0) depth -= 1;
  }
  return depth > 0;
}

// Comprehension that asks the learner to locate a constituent of the printed sentence.
const IDENTIFICATION = /\b(?:what|which) (?:noun|word|phrase|part|constituent|element|verb|clause|subject|object|agent|topic)s?\b|\bmodif(?:y|ies|ied)\b|\bidentify\b|\bwhom?\b/iu;

function normalizeOption(text: string): string {
  return stripParentheticals(text).replace(EDGE_NOISE, '').replace(/^(?:the|a|an|it|it's|it is)\s+/iu, '')
    .toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Individual checks.

const REFERENCE_HEADING = [
  /^sources?\b/iu,
  /^related grammar\b/iu,
  /\bsummary\b/iu,
  /^(?:key )?vocabulary\b/iu,
  /^(?:practice|quiz|exercises?|test yourself|self[- ]check)\b/iu,
  /\bquick[- ]reference\b/iu,
  /^key takeaways\b/iu,
  /^(?:further reading|resources|references)\b/iu,
  /\bcheat ?sheet\b/iu,
];

const IMPERATIVES = ['translate', 'say', 'write', 'read', 'rewrite', 'make', 'change', 'convert', 'conjugate', 'fill', 'repair', 'fix'];
const IMPERATIVE_AT_START = new RegExp(`^\\s*["“'‘(（]?(?:${IMPERATIVES.join('|')})\\b`, 'iu');
// Capitalized after a sentence break, so "Does 明日テストだった！ say that…" is not an imperative.
const IMPERATIVE_AFTER_BREAK = new RegExp(
  `(?:[.!?:;。！？]\\s*|\\n)\\s*["“'‘(（]?(?:${IMPERATIVES.map((word) => word[0].toUpperCase() + word.slice(1)).join('|')})\\b`, 'u',
);
const CONCEPT_BANS: { label: string; test: (prompt: string) => boolean }[] = [
  {
    label: `an instruction to produce or transform (${IMPERATIVES.join('/')})`,
    test: (prompt) => IMPERATIVE_AT_START.test(prompt) || IMPERATIVE_AFTER_BREAK.test(prompt),
  },
  {
    label: '"How do/would you say/translate/write …"',
    test: (prompt) => /\bhow (?:do|would|could|should|might|can) (?:you|i|we|one) (?:say|translate|write)\b/iu.test(prompt),
  },
  {
    label: 'a who-does-what question about one sentence',
    test: (prompt) => /\bwho (?:does|did|is doing|was doing|receives|received|gives|gave)\b/iu.test(prompt) ||
      new RegExp(`\\bwhom?\\b[^?]*\\bin\\s*["“「『]?${J_CLASS}`, 'iu').test(prompt),
  },
  {
    label: '"What is the meaning of …"',
    test: (prompt) => /\bwhat(?:'s| is) the meaning of\b/iu.test(prompt),
  },
  {
    // Reading a word, numeral or sentence aloud is application; the reading rule of one particle (は = wa) is recall.
    label: 'a request to read a specific word/numeral/sentence aloud',
    test: (prompt) => [
      /\bwhat(?:'s| is) the (?:reading|pronunciation)\b([^?]*)/iu,
      /\bhow (?:do|would|should|can) you (?:read|pronounce)\b([^?]*)/iu,
      /\bhow is\b([^?]*?)\b(?:read|pronounced)\b/iu,
    ].some((pattern) => JAPANESE_RUN_2.test(pattern.exec(prompt)?.[1] ?? '')),
  },
  {
    label: '"What does <Japanese> mean?" (interpretation of a specific form or sentence)',
    test: (prompt) => {
      const span = /\bwhat (?:does|do|did|would|might|can)\b([^?]*?)\bmean\b/iu.exec(prompt)?.[1];
      // A quoted English memory cue that merely mentions kana is still a recall prompt.
      return !!span && JAPANESE.test(span) && (span.match(/\b[a-z]{2,}\b/giu) ?? []).length <= 3;
    },
  },
];

function adjacentToBlank(prompt: string, kana: string): boolean {
  for (const match of prompt.matchAll(new RegExp(BLANK_REGEX.source, 'gu'))) {
    const before = [...prompt.slice(0, match.index)].at(-1);
    const after = [...prompt.slice(match.index + match[0].length)][0];
    if (before === kana || after === kana) return true;
  }
  return false;
}

// は/へ/を are written one way and read another; keep "pick the written
// particle" separate from "give its reading" (docs: Gates before extending).
const PARTICLE_READINGS: Record<string, RegExp> = {
  は: /(?<![\p{L}'’])wa(?![\p{L}'’])/iu,
  へ: /(?<![\p{L}'’.])e(?![\p{L}'’]|\.\p{L})/iu,
  を: /(?<![\p{L}'’])w?o(?![\p{L}'’])/iu,
};
const ASKS_FOR_READING = /\b(?:read|reading|readings|pronounc\w*|sounds?|say|said)\b/iu;
const CUES_PRONUNCIATION = /\bpronounc\w*|\bread (?:as|like)\b|\breadings?\b|\bsounds?\b/iu;
const ROMAJI = /^(?:(?:[kgsztdnhbpmyrwfj]|sh|ch|ts|[kgnhbpmr]y)?[aeiou]|n)+$/iu;

function isRomajiReading(answer: string): boolean {
  const plain = answer.replace(EDGE_NOISE, '');
  return /^[a-z]{1,3}$/iu.test(plain) && ROMAJI.test(plain) && !/^(?:no|yes|ok)$/iu.test(plain);
}

function particleReadingErrors(lessonId: string, cards: GrammarReviewItem[]): string[] {
  const errors: string[] = [];
  if (lessonId === 'particles') {
    const topic = cards.find((card) => card.id === 'topic-marker');
    if (!topic) {
      errors.push('particles/topic-marker: [particle-reading] the は regression card "topic-marker" must exist');
    } else {
      if (topic.kind !== 'rule' || topic.format !== 'cloze' || topic.answer !== 'は') {
        errors.push('particles/topic-marker: [particle-reading] must stay kind "rule", format "cloze" with answer exactly "は" (selecting the WRITTEN particle; its reading わ/wa is a separate task)');
      }
      if (adjacentToBlank(topic.prompt, 'は') || PARTICLE_READINGS.は.test(`${topic.prompt}\n${topic.hint}`)) {
        errors.push('particles/topic-marker: [particle-reading] the front must not show は next to the blank or the romaji "wa"');
      }
    }
  }
  for (const card of cards) {
    const answer = card.answer.trim();
    if (isRomajiReading(answer) && !ASKS_FOR_READING.test(card.prompt)) {
      errors.push(`${lessonId}/${card.id}: [particle-reading] answer "${answer}" is a romaji reading, but the prompt doesn't ask for a reading/pronunciation; ask "How is … pronounced?" or make the answer the written kana`);
    }
    const reading = PARTICLE_READINGS[answer];
    if (card.format === 'cloze' && reading) {
      if (CUES_PRONUNCIATION.test(`${card.prompt}\n${card.hint}`)) {
        errors.push(`${lessonId}/${card.id}: [particle-reading] a cloze whose answer is the written particle ${answer} must not ask about (or cue) pronunciation; use a grammatical cue, or author a separate reading card`);
      } else if (reading.test(`${card.prompt}\n${card.hint}`)) {
        errors.push(`${lessonId}/${card.id}: [particle-reading] the front/hint shows the romaji reading of the answer ${answer}`);
      }
    }
  }
  return errors;
}

function leakErrors(lessonId: string, card: GrammarReviewItem): string[] {
  if (Object.hasOwn(LEAK_EXEMPTIONS, `${lessonId}/${card.id}`)) return [];
  // Ordinary cards may stay two-way choices / locate-in-sentence tasks; rule-* cards may not.
  const lenient = !card.id.startsWith('rule-');
  const errors: string[] = [];
  for (const alternative of japaneseAnswerAlternatives(card.answer)) {
    for (const [field, text] of [['example', card.prompt], ['hint', card.hint]] as const) {
      const leaks = copyableOffsets(text, alternative).filter((at) => !lenient || !(
        isListedOption(text, at, alternative) ||
        (field === 'example' && card.format === 'qa' && IDENTIFICATION.test(text) && !insideParentheses(text, at))
      ));
      if (leaks.length) {
        errors.push(`${lessonId}/${card.id}: [leak] the answer "${alternative}" appears verbatim in the ${field}; remove it from the front and cue the target another way`);
      }
    }
  }
  return errors;
}

function twoWayChoice(card: GrammarReviewItem): string | undefined {
  const match = /(.+)\s+or\s+(.+?)\s*[?？]\s*$/su.exec(card.prompt);
  if (!match) return;
  const right = normalizeOption(match[2]);
  const width = Math.max(1, right.split(/\s+/u).length);
  const left = normalizeOption(match[1].split(/[\s,:;、：；]+/u).slice(-width).join(' '));
  const answer = normalizeOption(card.answer.split(/[.;:—–,(（。、]/u)[0] ?? card.answer);
  return [left, right].find((option) => option && option === answer);
}

function ruleCardErrors(lessonId: string, cards: GrammarReviewItem[]): string[] {
  const errors: string[] = [];
  const ruleCards = cards.filter((card) => card.id.startsWith('rule-'));
  if (ruleCards.length > 4) errors.push(`${lessonId}: [rule-card] ${ruleCards.length} rule-* cards; at most 4 per lesson`);
  const essential = ruleCards.filter((card) => card.priority === 'essential').length;
  if (essential > 2) errors.push(`${lessonId}: [rule-card] ${essential} essential rule-* cards; at most 2 (make the rest optional)`);
  for (const card of ruleCards) {
    const label = `${lessonId}/${card.id}: [rule-card]`;
    if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${label} must be kind "concept", format "qa"`);
    if (REFERENCE_HEADING.some((pattern) => pattern.test(card.sourceSection))) {
      errors.push(`${label} sourceSection "${card.sourceSection}" is a summary/reference heading; use the heading of the section that teaches the rule`);
    }
    const option = twoWayChoice(card);
    if (option) errors.push(`${label} ends in an "X or Y?" choice whose answer is one of the options ("${option}"); ask an open question`);
    const front = `${card.prompt}\n${card.hint}`;
    for (const other of cards) {
      if (other.id === card.id) continue;
      for (const alternative of japaneseAnswerAlternatives(other.answer)) {
        if (copyableOffsets(front, alternative).length &&
          !Object.hasOwn(RULE_FRONT_EXEMPTIONS, `${lessonId}/${card.id}/${alternative}`)) {
          errors.push(`${label} front shows "${alternative}", which card "${other.id}" asks the learner to produce; ask trigger → rule instead`);
        }
      }
    }
  }
  return errors;
}

function identityErrors(
  lessonId: string,
  cards: GrammarReviewItem[],
  // A lesson absent from the baseline is brand-new: it has no shipped cards to keep.
  shipped: Record<string, JapaneseBaselineCard> = {},
): string[] {
  const errors: string[] = [];
  const source = `git show ${JA_REVIEW_BASELINE_COMMIT}:public/content/grammar/ja/${lessonId}.md`;
  const byId = new Map(cards.map((card) => [card.id, card]));
  const owners = new Map<string, Set<string>>();
  for (const card of cards) {
    for (const pair of ownPairs(card)) {
      const hash = pairHash(pair.rule, pair.example);
      owners.set(hash, (owners.get(hash) ?? new Set()).add(card.id));
    }
  }
  for (const [id, baseline] of Object.entries(shipped)) {
    const card = byId.get(id);
    if (!card) {
      errors.push(`${lessonId}/${id}: [identity] shipped card id "${id}" was deleted or renamed; saved cards are keyed by this id, so restore it (${source}). To repair an outdated card, correct it in place under the same id and append its shipped pair to legacyAliases; author a genuinely new target under a new id`);
      continue;
    }
    const aliasHashes = card.legacyAliases.map((alias) => pairHash(alias.rule, alias.example));
    const [shippedPair, ...shippedAliases] = baseline.pairs;
    if (pairHash(card.rule, card.prompt) !== shippedPair && !aliasHashes.includes(shippedPair)) {
      errors.push(`${lessonId}/${id}: [identity] shipped rule/example pair changed but was not added to legacyAliases (append {"rule": <old rule>, "example": <old example>} verbatim; find card "${id}" in: ${source}). Current pair: ${JSON.stringify({ rule: card.rule, example: card.prompt })}`);
    }
    if (shippedAliases.some((hash) => !aliasHashes.includes(hash))) {
      errors.push(`${lessonId}/${id}: [identity] an existing legacyAliases entry was removed or edited; keep every shipped alias exactly, in order (${source})`);
    }
    for (const hash of baseline.pairs) {
      for (const owner of owners.get(hash) ?? []) {
        if (owner !== id) {
          errors.push(`${lessonId}/${owner}: [identity] claims a shipped rule/example pair of "${id}" (as its current pair or a legacy alias); each shipped pair belongs only to its own card`);
        }
      }
    }
  }
  for (const card of cards) {
    const allowed = new Set(shipped[card.id]?.pairs ?? []);
    for (const alias of card.legacyAliases) {
      if (!allowed.has(pairHash(alias.rule, alias.example))) {
        errors.push(`${lessonId}/${card.id}: [identity] unauthorized legacyAliases entry ${JSON.stringify(alias)}; an alias may only hold this card's own pair as shipped at ${JA_REVIEW_BASELINE_COMMIT}${Object.hasOwn(shipped, card.id) ? '' : ' (new ids, including every card of a new lesson, must have no legacyAliases)'}`);
      }
    }
  }
  return [...new Set(errors)];
}

const parsedInventories = new Map<string, ReturnType<typeof parseRetentionInventory>>();

function parsedInventory(raw: string): ReturnType<typeof parseRetentionInventory> {
  let parsed = parsedInventories.get(raw);
  if (!parsed) {
    parsed = parseRetentionInventory(raw);
    parsedInventories.set(raw, parsed);
  }
  return parsed;
}

function inventoryFor(
  lessonId: string,
  inventories: Record<string, string>,
): { inventory?: LessonInventory; errors: string[] } {
  const errors: string[] = [];
  const found: { file: string; lesson: LessonInventory }[] = [];
  const indexed = new Set(japaneseLessonIds());
  const mentions = new RegExp(`"lessonId"\\s*:\\s*"${lessonId.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`, 'u');
  for (const [path, raw] of Object.entries(inventories)) {
    const file = path.split('/').at(-1)!;
    const parsed = parsedInventory(raw);
    if (!parsed.inventory) {
      if (mentions.test(raw)) errors.push(...parsed.errors.map((error) => `${lessonId}: [inventory] ${file}: ${error}`));
      continue;
    }
    const ownFile = parsed.inventory.lessons.some((lesson) => lesson.lessonId === lessonId);
    if (ownFile && !/^ja-[a-z0-9][a-z0-9._-]*\.json$/u.test(file)) errors.push(`${lessonId}: [inventory] ${file}: unexpected inventory filename`);
    if (ownFile && parsed.inventory.language !== 'ja') errors.push(`${lessonId}: [inventory] ${file}: language must be "ja"`);
    for (const lesson of parsed.inventory.lessons) {
      if (lesson.lessonId === lessonId) found.push({ file, lesson });
      else if (ownFile && !indexed.has(lesson.lessonId)) errors.push(`${lessonId}: [inventory] ${file}: stale entry for non-indexed lesson "${lesson.lessonId}"`);
    }
  }
  if (found.length > 1) {
    errors.push(`${lessonId}: [inventory] inventoried more than once (${found.map(({ file }) => file).join(', ')})`);
  }
  if (!found.length && !errors.length) {
    errors.push(`${lessonId}: [inventory] missing from src/__tests__/fixtures/grammar-retention/ja-*.json`);
  }
  return { inventory: found.length === 1 ? found[0].lesson : undefined, errors };
}

export interface JapaneseReviewSources {
  /** Raw ja-*.json inventory files keyed by path; defaults to the real fixtures. */
  inventories?: Record<string, string>;
  /** Defaults to grammar-retention-legacy.json. */
  legacy?: LegacyBaseline;
  baseline?: JapaneseReviewBaseline;
}

/** Pure form: validate `markdown` as if it were the lesson's asset. */
export function japaneseReviewErrorsFor(
  lessonId: string,
  markdown: string,
  sources: JapaneseReviewSources = {},
): string[] {
  const parsed = parseLessonReviewItems(markdown);
  const errors = parsed.diagnostics.map((diagnostic) =>
    `${lessonId}${diagnostic.itemId ? `/${diagnostic.itemId}` : ''}: [parser] ${diagnostic.code} at line ${diagnostic.line}: ${diagnostic.message}`);
  const cards = parsed.items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
  for (const card of cards) {
    if (card.provenance !== 'authored') {
      errors.push(`${lessonId}: [parser] grammar card ${JSON.stringify(card.prompt)} has no id/kind/format metadata`);
    }
  }

  // The same per-lesson validation grammar-retention-catalog.test.ts runs.
  const legacy = (sources.legacy ?? LEGACY).lessons[`ja/${lessonId}`];
  if (!legacy) errors.push(`${lessonId}: [legacy] missing from grammar-retention-legacy.json`);
  else errors.push(...validateLegacyLesson(markdown, legacy, `ja/${lessonId}`).map((error) => `${lessonId}: [legacy] ${error}`));
  const { inventory, errors: inventoryErrors } = inventoryFor(lessonId, sources.inventories ?? INVENTORY_ASSETS);
  errors.push(...inventoryErrors);
  if (inventory) {
    errors.push(...validateRetentionLesson(markdown, inventory, legacy).map((error) => `${lessonId}: [inventory] ${error}`));
  }

  const headings = lessonHeadings(markdown);
  for (const card of cards) {
    if (!headings.includes(card.sourceSection)) {
      errors.push(`${lessonId}/${card.id}: [source-section] "${card.sourceSection}" is not a heading in this lesson`);
    }
    if (card.kind === 'concept' && card.format !== 'qa') {
      errors.push(`${lessonId}/${card.id}: [concept-format] kind "concept" must use format "qa"; a cloze is application (kind "rule")`);
    }
    if (card.kind === 'concept' && !Object.hasOwn(CONCEPT_PHRASING_EXEMPTIONS, `${lessonId}/${card.id}`)) {
      const banned = CONCEPT_BANS.find(({ test }) => test(card.prompt));
      if (banned) {
        errors.push(`${lessonId}/${card.id}: [concept-phrasing] concept prompt is ${banned.label}, not declarative rule recall; reclassify to kind "rule" (format "qa") or reword as trigger → rule / example → reason`);
      }
    }
    errors.push(...leakErrors(lessonId, card));
  }
  errors.push(...ruleCardErrors(lessonId, cards));
  errors.push(...identityErrors(lessonId, cards, (sources.baseline ?? japaneseBaseline).lessons[lessonId]));
  errors.push(...particleReadingErrors(lessonId, cards));
  return errors;
}

export function japaneseReviewErrors(lessonId: string): string[] {
  const markdown = japaneseLessonMarkdown(lessonId);
  if (!markdown?.trim()) return [`${lessonId}: [parser] missing/empty public/content/grammar/ja/${lessonId}.md`];
  return japaneseReviewErrorsFor(lessonId, markdown);
}

/** Identity check alone (cheap): applies to every lesson, reviewed or not. */
export function japaneseIdentityErrors(lessonId: string, markdown = japaneseLessonMarkdown(lessonId) ?? ''): string[] {
  const cards = parseLessonReviewItems(markdown).items
    .filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
  return identityErrors(lessonId, cards, japaneseBaseline.lessons[lessonId]);
}
