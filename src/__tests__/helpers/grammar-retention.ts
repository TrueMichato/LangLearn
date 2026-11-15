/// <reference types="node" />
import { createHash } from 'node:crypto';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import {
  BLANK_REGEX,
  buildGrammarCardFields,
  countBlanks,
  extractTokenFromFilledSentence,
  fillBlank,
  hasBlank,
  parseAnswer,
  splitAroundBlank,
} from '../../lib/grammar-cards';
import { nodeText, parseLessonReviewItems, stripLessonReviewSources } from '../../lib/lesson-capture';
import {
  isMetadataObject,
  isNonemptyString,
  LESSON_REVIEW_ID,
  readLessonReviewBlocks,
  type GrammarReviewItem,
  type LegacyGrammarAlias,
  type LessonReviewItem,
  type LessonReviewPriority,
} from '../../lib/lesson-review';
import { LESSON_REMARK_PLUGINS } from '../../lib/markdown-plugins';
import quizCorrections from '../fixtures/grammar-retention-quiz-corrections.json';

export const RETENTION_LANGUAGES = ['ja', 'ar', 'es', 'pt', 'ro'] as const;
export type RetentionLanguage = typeof RETENTION_LANGUAGES[number];

interface TeachingPointBase {
  id: string;
  priority: LessonReviewPriority;
  sourceSection: string;
  /** Reviewed instructional intent, deliberately not inferred from card counts. */
  objective: string;
}

export interface GrammarTeachingPoint extends TeachingPointBase {
  kind: 'rule' | 'concept';
  format: 'qa' | 'cloze';
  prompt: string;
  answer: string;
  explanation?: string;
}

export interface VocabularyTeachingPoint extends TeachingPointBase {
  kind: 'vocabulary';
  word: string;
  meaning: string;
  reading?: string;
  contextSentence?: string;
}

export interface LessonInventory {
  lessonId: string;
  teachingPoints: (GrammarTeachingPoint | VocabularyTeachingPoint)[];
  exclusions: { sourceSection: string; reason: string }[];
}

export interface RetentionInventory {
  language: RetentionLanguage;
  lessons: LessonInventory[];
}

export interface LegacyLesson {
  grammarPairs: (LegacyGrammarAlias & { authoredId?: string })[];
  authoredIds: string[];
  quizCount: number;
  quizSha256: string;
  /** Only pre-existing pilot shorthand, tied to its original item and heading. */
  sourceSectionAliases?: { id: string; sourceSection: string; heading: string }[];
}

export interface LegacyBaseline {
  baselineCommit: string;
  lessons: Record<string, LegacyLesson>;
}

export interface AuthoredQuizPayload extends Record<string, unknown> {
  type: string;
  question: string;
  options: string[];
  answer: number;
}

export interface QuizCorrection {
  lessonKey: string;
  /** One-based authored quiz position, never a search by matching answer text. */
  position: number;
  rationale: string;
  original: AuthoredQuizPayload;
  corrected: AuthoredQuizPayload;
}

export const APPROVED_QUIZ_CORRECTIONS: readonly QuizCorrection[] = quizCorrections.corrections;

export function lessonHeadings(markdown: string): string[] {
  const headings = new Set<string>();
  const display = stripLessonReviewSources(markdown);
  const lines = display.split('\n');
  const collect = ({ children, node }: {
    children?: ReactNode;
    node?: { position?: { start: { line: number } } };
  }) => {
    headings.add(nodeText(children));
    // Both the exact source spelling (including inline emphasis) and its
    // rendered label identify this same parser-confirmed heading.
    const line = lines[(node?.position?.start.line ?? 0) - 1] ?? '';
    const raw = /^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/.exec(line)?.[1];
    if (raw) headings.add(raw);
    return createElement('span', null, children);
  };
  renderToStaticMarkup(createElement(ReactMarkdown, {
    remarkPlugins: LESSON_REMARK_PLUGINS,
    components: { h1: collect, h2: collect, h3: collect, h4: collect, h5: collect, h6: collect },
    children: display,
  }));
  return [...headings];
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isMetadataObject(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Match LessonView's quiz segmentation; preserve sequence, options, and scoring payload. */
export function lessonQuizPayloads(markdown: string): unknown[] {
  return [...stripLessonReviewSources(markdown)
    .matchAll(/<!--\s*quiz:([\s\S]*?)\s*-->/g)]
    .map((match) => JSON.parse(match[1]) as unknown);
}

function fingerprintQuizzes(quizzes: readonly unknown[]): Pick<LegacyLesson, 'quizCount' | 'quizSha256'> {
  return {
    quizCount: quizzes.length,
    quizSha256: createHash('sha256').update(stableJson(quizzes)).digest('hex'),
  };
}

export function quizFingerprint(markdown: string): Pick<LegacyLesson, 'quizCount' | 'quizSha256'> {
  return fingerprintQuizzes(lessonQuizPayloads(markdown));
}

/** Require the exact corrected payload, then undo only that approved change for hashing. */
export function restoreApprovedQuizCorrections(
  quizzes: readonly unknown[],
  lessonKey: string,
): { quizzes: unknown[]; errors: string[] } {
  const restored = [...quizzes];
  const errors: string[] = [];
  const positions = new Set<number>();
  for (const correction of APPROVED_QUIZ_CORRECTIONS.filter((entry) => entry.lessonKey === lessonKey)) {
    if (!Number.isInteger(correction.position) || correction.position < 1 ||
      positions.has(correction.position) || !correction.rationale.trim()) {
      errors.push(`${lessonKey}: invalid or duplicate approved quiz correction at position ${correction.position}`);
      continue;
    }
    positions.add(correction.position);
    const index = correction.position - 1;
    if (stableJson(quizzes[index]) !== stableJson(correction.corrected)) {
      errors.push(`${lessonKey}: quiz ${correction.position} must match the exact approved corrected payload`);
      continue;
    }
    restored[index] = correction.original;
  }
  return { quizzes: restored, errors };
}

function pairKey(pair: LegacyGrammarAlias): string {
  return JSON.stringify([pair.rule, pair.example]);
}

/** Used once against git-show source; CI consumes the persisted fixture, never git. */
export function captureLegacyLesson(markdown: string): LegacyLesson {
  const parsed = parseLessonReviewItems(markdown);
  if (parsed.diagnostics.length) throw new Error(JSON.stringify(parsed.diagnostics));
  const blocks = readLessonReviewBlocks(markdown, 'grammar-card');
  const grammarPairs: LegacyLesson['grammarPairs'] = [];
  for (const { value } of blocks.items) {
    const authoredId = typeof value.id === 'string' ? value.id : undefined;
    for (const pair of [
      { rule: value.rule as string, example: (value.example as string | undefined) ?? '' },
      ...((value.legacyAliases as LegacyGrammarAlias[] | undefined) ?? []),
    ]) {
      if (!grammarPairs.some((old) =>
        pairKey(old) === pairKey(pair) && old.authoredId === authoredId)) {
        grammarPairs.push({ ...pair, ...(authoredId ? { authoredId } : {}) });
      }
    }
  }
  return {
    grammarPairs,
    authoredIds: parsed.items.filter((item) => item.provenance === 'authored').map((item) => item.id),
    ...quizFingerprint(markdown),
  };
}

export function validateLegacyLesson(
  markdown: string,
  baseline: LegacyLesson,
  lessonKey?: string,
): string[] {
  const parsed = parseLessonReviewItems(markdown);
  const errors = parsed.diagnostics.map((diagnostic) =>
    `${diagnostic.code} at line ${diagnostic.line}: ${diagnostic.message}`);
  const authoredIds = new Set(parsed.items
    .filter((item) => item.provenance === 'authored').map((item) => item.id));
  for (const id of baseline.authoredIds) {
    if (!authoredIds.has(id)) errors.push(`lost existing authored ID "${id}"`);
  }

  const owners = new Map<string, Set<string>>();
  // Read exact source pairs: normalized legacy prompts are not identity strings.
  for (const { value } of readLessonReviewBlocks(markdown, 'grammar-card').items) {
    if (typeof value.rule !== 'string') continue;
    const id = typeof value.id === 'string' ? value.id : `legacy:${pairKey({
      rule: value.rule, example: typeof value.example === 'string' ? value.example : '',
    })}`;
    const aliases = Array.isArray(value.legacyAliases) ? value.legacyAliases : [];
    for (const pair of [
      { rule: value.rule, example: typeof value.example === 'string' ? value.example : '' },
      ...aliases.filter((alias): alias is LegacyGrammarAlias =>
        isMetadataObject(alias) && typeof alias.rule === 'string' && typeof alias.example === 'string'),
    ]) {
      const key = pairKey(pair);
      const ids = owners.get(key) ?? new Set<string>();
      ids.add(id);
      owners.set(key, ids);
    }
  }
  for (const [pair, ids] of owners) {
    if (ids.size > 1) errors.push(`ambiguous legacy identity ${pair} belongs to ${[...ids].join(', ')}`);
  }
  for (const pair of baseline.grammarPairs) {
    const ids = owners.get(pairKey(pair));
    if (!ids?.size || (pair.authoredId && !ids.has(pair.authoredId))) {
      errors.push(`lost legacy identity${pair.authoredId ? ` for "${pair.authoredId}"` : ''}: ${pairKey(pair)}`);
    }
  }
  try {
    const quizzes = lessonQuizPayloads(markdown);
    const restored = lessonKey ? restoreApprovedQuizCorrections(quizzes, lessonKey) : { quizzes, errors: [] };
    errors.push(...restored.errors);
    const current = fingerprintQuizzes(restored.quizzes);
    if (current.quizCount !== baseline.quizCount || current.quizSha256 !== baseline.quizSha256) {
      errors.push('authored quiz sequence/scoring changed from the baseline');
    }
  } catch {
    errors.push('invalid JSON in quiz block');
  }
  return errors;
}

function unknownKeys(value: Record<string, unknown>, allowed: string[], label: string): string[] {
  return Object.keys(value).filter((key) => !allowed.includes(key))
    .map((key) => `${label}: unknown field "${key}"`);
}

function requiredText(value: Record<string, unknown>, keys: string[], label: string): string[] {
  return keys.filter((key) => !isNonemptyString(value[key]))
    .map((key) => `${label}: ${key} must be nonempty text`);
}

export function parseRetentionInventory(
  raw: string,
): { inventory?: RetentionInventory; errors: string[] } {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { errors: ['invalid inventory JSON'] };
  }
  if (!isMetadataObject(value)) return { errors: ['inventory must be an object'] };
  const errors = unknownKeys(value, ['language', 'lessons'], 'inventory');
  if (!RETENTION_LANGUAGES.includes(value.language as RetentionLanguage)) {
    errors.push('inventory language must be ja, ar, es, pt, or ro');
  }
  if (!Array.isArray(value.lessons) || !value.lessons.length) {
    return { errors: [...errors, 'inventory lessons must be a nonempty array'] };
  }
  const lessonIds = new Set<string>();
  for (const [index, lesson] of value.lessons.entries()) {
    const label = `lesson ${index + 1}`;
    if (!isMetadataObject(lesson)) {
      errors.push(`${label}: must be an object`);
      continue;
    }
    errors.push(...unknownKeys(lesson, ['lessonId', 'teachingPoints', 'exclusions'], label));
    if (typeof lesson.lessonId !== 'string' || !LESSON_REVIEW_ID.test(lesson.lessonId)) {
      errors.push(`${label}: invalid lessonId`);
    } else {
      if (lessonIds.has(lesson.lessonId)) errors.push(`duplicate inventoried lesson "${lesson.lessonId}"`);
      lessonIds.add(lesson.lessonId);
    }
    if (!Array.isArray(lesson.teachingPoints)) {
      errors.push(`${label}: teachingPoints must be an array`);
    } else {
      const pointIds = new Set<string>();
      for (const [pointIndex, point] of lesson.teachingPoints.entries()) {
        const pointLabel = `${lesson.lessonId ?? label}, point ${pointIndex + 1}`;
        if (!isMetadataObject(point)) {
          errors.push(`${pointLabel}: must be an object`);
          continue;
        }
        errors.push(...requiredText(point, ['id', 'sourceSection', 'objective'], pointLabel));
        if (typeof point.id !== 'string' || !LESSON_REVIEW_ID.test(point.id)) {
          errors.push(`${pointLabel}: invalid point id`);
        } else {
          if (pointIds.has(point.id)) errors.push(`${pointLabel}: duplicate point id "${point.id}"`);
          pointIds.add(point.id);
        }
        if (point.priority !== 'essential' && point.priority !== 'optional') {
          errors.push(`${pointLabel}: invalid priority`);
        }
        const common = ['id', 'kind', 'priority', 'sourceSection', 'objective'];
        if (point.kind === 'vocabulary') {
          errors.push(...unknownKeys(point, [...common, 'word', 'meaning', 'reading', 'contextSentence'], pointLabel));
          errors.push(...requiredText(point, ['word', 'meaning'], pointLabel));
          for (const key of ['reading', 'contextSentence']) {
            if (point[key] !== undefined && typeof point[key] !== 'string') errors.push(`${pointLabel}: ${key} must be text`);
          }
        } else if (point.kind === 'rule' || point.kind === 'concept') {
          errors.push(...unknownKeys(point, [...common, 'format', 'prompt', 'answer', 'explanation'], pointLabel));
          errors.push(...requiredText(point, ['prompt', 'answer'], pointLabel));
          if (point.format !== 'qa' && point.format !== 'cloze') errors.push(`${pointLabel}: invalid format`);
          if (point.explanation !== undefined && typeof point.explanation !== 'string') {
            errors.push(`${pointLabel}: explanation must be text`);
          }
        } else {
          errors.push(`${pointLabel}: kind must be vocabulary, rule, or concept`);
        }
      }
    }
    if (!Array.isArray(lesson.exclusions)) {
      errors.push(`${label}: exclusions must be an array (empty is allowed)`);
    } else {
      for (const exclusion of lesson.exclusions) {
        if (!isMetadataObject(exclusion)) {
          errors.push(`${label}: exclusion must be an object`);
          continue;
        }
        errors.push(...unknownKeys(exclusion, ['sourceSection', 'reason'], label));
        errors.push(...requiredText(exclusion, ['sourceSection', 'reason'], label));
      }
    }
  }
  return errors.length ? { errors } : { inventory: value as unknown as RetentionInventory, errors };
}

function containsWholeAnswer(front: string, answer: string, ignoreCase = false): boolean {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escaped}(?![\\p{L}\\p{M}\\p{N}])`,
    ignoreCase ? 'iu' : 'u').test(front);
}

function mixedArabicLatinTokens(text: string): string[] {
  return (text.match(/[\p{Letter}\p{Mark}]+/gu) ?? []).filter((token) =>
    /\p{Script=Latin}/u.test(token) && /\p{Script_Extensions=Arabic}/u.test(token));
}

/** Prove full-frame duplication by round-trip, not by counting shared letters. */
export function clozeAnswerRepeatsFrame(prompt: string, answer: string): boolean {
  const blanks = countBlanks(prompt);
  if (!blanks) return false;
  if (blanks > 1) {
    // A distributable payload can itself look like the template, for example
    // ___ (___) + Arabic (romanization). Its actual reveal is already correct.
    if (fillBlank(prompt, answer).trim() === answer.trim()) return false;
    const templates = [prompt.trim()];
    const trailingHint = /\s*\([^()]*\)\s*$/.exec(prompt);
    if (trailingHint && !hasBlank(trailingHint[0])) {
      templates.push(prompt.slice(0, trailingHint.index).trim());
    }
    return templates.some((template) => {
      const fragments = template.split(new RegExp(BLANK_REGEX.source, 'g'));
      if (!fragments.some((fragment) => fragment.trim())) return false;
      const pattern = fragments.map((fragment) => fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('([\\s\\S]+?)');
      const match = new RegExp(`^${pattern}$`, 'u').exec(answer.trim());
      return !!match && match.slice(1).every((span) => span.trim().length > 0);
    });
  }
  const missingSpan = extractTokenFromFilledSentence(prompt, answer);
  if (!missingSpan || missingSpan === answer) return false;
  const reconstructed = fillBlank(prompt, missingSpan).trim();
  const withoutTrailingHint = reconstructed.replace(/\s*\([^()]*\)\s*$/, '').trim();
  return answer.trim() === reconstructed || answer.trim() === withoutTrailingHint;
}

export function validateReviewItemQuality(item: LessonReviewItem): string[] {
  const errors: string[] = [];
  if (item.kind === 'vocabulary') {
    if (item.meaning.length >= 3 && containsWholeAnswer(item.contextSentence, item.meaning, true)) {
      errors.push(`${item.id}: vocabulary context leaks its meaning on the front`);
    }
    return errors;
  }
  const fields = buildGrammarCardFields({
    ...item, example: item.prompt,
  });
  if (!fields || fields.word !== item.answer || fields.contextSentence !== item.prompt) {
    errors.push(`${item.id}: prompt/answer is not preserved by the card builder`);
    return errors;
  }
  // Case can itself be the task (África → ÁFRICA); short particles can also
  // legitimately recur elsewhere in a prompt, but a bare-answer hint cannot.
  // An infinitive cue can legitimately equal the required conjugated form.
  const promptFront = item.format === 'cloze'
    ? item.prompt.replace(/\s*\([^()]*\)\s*[.!?]?\s*$/, '')
    : item.prompt;
  if ([promptFront, item.hint].some((front) => front.trim() === item.answer.trim()) ||
    (item.answer.length >= 4 && containsWholeAnswer(`${promptFront}\n${item.hint}`, item.answer))) {
    errors.push(`${item.id}: answer is already visible on the front`);
  }
  if (item.format === 'qa') return errors;
  if (!hasBlank(item.prompt)) errors.push(`${item.id}: cloze prompt has no blank`);
  const reading = /\(([^()]*)\)\s*$/.exec(item.answer)?.[1].trim();
  const escapedReading = reading?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const redundantReading = escapedReading &&
    new RegExp(`\\(\\s*${escapedReading}\\s*\\)`).test(splitAroundBlank(item.prompt)?.suffix ?? '');
  if (parseAnswer(item.answer).gloss || redundantReading) {
    errors.push(`${item.id}: cloze answer contains a gloss or redundant reading`);
  }
  const reveal = fillBlank(item.prompt, item.answer);
  if (reveal === item.prompt || hasBlank(reveal)) errors.push(`${item.id}: corrupt cloze reconstruction`);
  // Bilingual phrases are valid. A newly joined Arabic/Latin orthographic
  // token is not: mirrored suffixes must use the matching script on each side.
  const mixedBefore = mixedArabicLatinTokens(item.prompt);
  const mixedAfter = mixedArabicLatinTokens(reveal);
  for (const token of new Set(mixedAfter)) {
    if (mixedAfter.filter((value) => value === token).length >
      mixedBefore.filter((value) => value === token).length) {
      errors.push(`${item.id}: cloze reconstruction introduces a mixed Arabic/Latin token "${token}"`);
    }
  }
  if (clozeAnswerRepeatsFrame(item.prompt, item.answer)) {
    errors.push(`${item.id}: answer repeats the complete cloze frame instead of only the missing span`);
  }
  return errors;
}

export function validateRetentionLesson(
  markdown: string,
  inventory: LessonInventory,
  baseline?: LegacyLesson,
): string[] {
  const parsed = parseLessonReviewItems(markdown);
  const vocabularyInventory = readLessonReviewBlocks(markdown, 'vocab-inventory');
  const explicitInventory = vocabularyInventory.items.length === 1 &&
    vocabularyInventory.diagnostics.length === 0;
  const errors = parsed.diagnostics.map((diagnostic) =>
    `${diagnostic.code} at line ${diagnostic.line}: ${diagnostic.message}`);
  if (!explicitInventory) {
    errors.push('reviewed lesson must declare exactly one valid <!-- vocab-inventory: {"mode":"explicit"} -->');
  }
  const authored = parsed.items.filter((item) => item.provenance === 'authored');
  const actualIds = new Set(authored.map((item) => item.id));
  const expectedIds = new Set(inventory.teachingPoints.map((point) => point.id));
  for (const item of parsed.items) {
    if (item.provenance === 'legacy') errors.push(`${item.id}: legacy block still needs explicit metadata`);
    if (item.provenance === 'formatting' && item.priority !== 'optional') {
      errors.push(`${item.id}: formatting-only suggestions must stay optional`);
    }
    if (explicitInventory && item.kind === 'vocabulary' && item.provenance === 'formatting') {
      errors.push(`${item.id}: explicit vocabulary inventory includes a formatting-derived suggestion`);
    }
  }
  for (const id of actualIds) {
    if (!expectedIds.has(id)) errors.push(`authored point "${id}" is missing from the reviewed inventory`);
  }
  const headings = lessonHeadings(markdown);
  const hasSection = (section: string, id?: string) =>
    headings.includes(section) || !!baseline?.sourceSectionAliases?.some((alias) =>
      alias.id === id && alias.sourceSection === section && headings.includes(alias.heading));
  for (const point of inventory.teachingPoints) {
    if (!hasSection(point.sourceSection, point.id)) {
      errors.push(`${point.id}: sourceSection "${point.sourceSection}" does not match a real heading`);
    }
    const item = authored.find((candidate) => candidate.id === point.id);
    if (!item) {
      errors.push(`missing authored teaching point "${point.id}"`);
      continue;
    }
    for (const [key, value] of Object.entries(point)) {
      if (key === 'objective') continue;
      if ((item as unknown as Record<string, unknown>)[key] !== value) {
        errors.push(`${point.id}: ${key} changed; expected ${JSON.stringify(value)}, got ${JSON.stringify((item as unknown as Record<string, unknown>)[key])}`);
      }
    }
  }
  for (const exclusion of inventory.exclusions) {
    if (!hasSection(exclusion.sourceSection)) {
      errors.push(`excluded sourceSection "${exclusion.sourceSection}" does not match a real heading`);
    }
  }
  for (const item of authored) {
    if (!hasSection(item.sourceSection, item.id)) {
      errors.push(`${item.id}: authored sourceSection "${item.sourceSection}" does not match a real heading`);
    }
    errors.push(...validateReviewItemQuality(item));
  }
  return errors;
}

export function indexedLessonIds(raw: string): string[] {
  const value: unknown = JSON.parse(raw);
  const entries = Array.isArray(value) ? value : isMetadataObject(value) ? value.lessons : undefined;
  if (!Array.isArray(entries) || !entries.length) throw new Error('index must contain a nonempty lesson array');
  const ids = entries.map((entry) => {
    if (!isMetadataObject(entry) || typeof entry.id !== 'string' || !LESSON_REVIEW_ID.test(entry.id)) {
      throw new Error('index contains an invalid lesson ID/asset path');
    }
    return entry.id;
  });
  if (new Set(ids).size !== ids.length) throw new Error('index contains duplicate lesson IDs');
  return ids;
}

export interface RetentionCatalog {
  /** Keys: language; JSON is kept raw so malformed indexes get a diagnostic. */
  indexes: Record<string, string>;
  /** Keys: language/lessonId. */
  lessons: Record<string, string>;
  /** Keys: language-batch.json; never generate these from current lesson metadata. */
  inventories: Record<string, string>;
  baseline: LegacyBaseline;
}

/** Scope by declared file ownership; keep each owned inventory intact for validation. */
export function scopeRetentionCatalog(
  catalog: RetentionCatalog,
  language: RetentionLanguage,
): RetentionCatalog {
  const prefix = `${language}/`;
  const index = catalog.indexes[language];
  return {
    indexes: index === undefined ? {} : { [language]: index },
    lessons: Object.fromEntries(Object.entries(catalog.lessons).filter(([key]) => key.startsWith(prefix))),
    inventories: Object.fromEntries(Object.entries(catalog.inventories)
      .filter(([file]) => file.startsWith(`${language}-`))),
    baseline: {
      ...catalog.baseline,
      lessons: Object.fromEntries(Object.entries(catalog.baseline.lessons)
        .filter(([key]) => key.startsWith(prefix))),
    },
  };
}

export function validateRetentionCatalog(
  catalog: RetentionCatalog,
  languages: readonly RetentionLanguage[] = RETENTION_LANGUAGES,
): string[] {
  const errors: string[] = [];
  if (catalog.baseline.baselineCommit !== quizCorrections.baselineCommit) {
    errors.push('approved quiz corrections target a different immutable baseline commit');
  }
  const indexed = new Set<string>();
  for (const language of languages) {
    try {
      for (const id of indexedLessonIds(catalog.indexes[language])) indexed.add(`${language}/${id}`);
    } catch (error) {
      errors.push(`${language}: invalid/missing index: ${String(error)}`);
    }
  }
  const inventories = new Map<string, LessonInventory>();
  for (const [file, raw] of Object.entries(catalog.inventories)) {
    const filename = /^(ja|ar|es|pt|ro)-[a-z0-9][a-z0-9._-]*\.json$/.exec(file);
    const parsed = parseRetentionInventory(raw);
    errors.push(...parsed.errors.map((error) => `${file}: ${error}`));
    if (!filename) errors.push(`${file}: unexpected/stale inventory filename`);
    const inventory = parsed.inventory;
    if (!inventory) continue;
    if (filename && inventory.language !== filename[1]) errors.push(`${file}: filename language differs from inventory`);
    for (const lesson of inventory.lessons) {
      const key = `${inventory.language}/${lesson.lessonId}`;
      if (inventories.has(key)) errors.push(`${file}: lesson "${key}" is inventoried more than once`);
      inventories.set(key, lesson);
      if (!indexed.has(key)) errors.push(`${file}: stale inventory for non-indexed lesson "${key}"`);
    }
  }
  for (const key of Object.keys(catalog.baseline.lessons)) {
    if (!languages.includes(key.split('/')[0] as RetentionLanguage)) continue;
    if (!indexed.has(key)) errors.push(`${key}: baseline lesson is no longer indexed`);
  }
  for (const key of indexed) {
    const markdown = catalog.lessons[key];
    if (!isNonemptyString(markdown)) {
      errors.push(`${key}: missing/empty indexed lesson asset`);
      continue;
    }
    const baseline = catalog.baseline.lessons[key];
    if (!baseline) errors.push(`${key}: missing legacy/quiz baseline`);
    if (baseline) errors.push(...validateLegacyLesson(markdown, baseline, key).map((error) => `${key}: ${error}`));
    const inventory = inventories.get(key);
    if (!inventory) {
      errors.push(`${key}: missing reviewed lesson inventory`);
      continue;
    }
    errors.push(...validateRetentionLesson(markdown, inventory, baseline).map((error) => `${key}: ${error}`));
  }
  return errors;
}

export function grammarItem(items: LessonReviewItem[], id: string): GrammarReviewItem {
  const item = items.find((candidate) => candidate.id === id);
  if (!item || item.kind === 'vocabulary') throw new Error(`Missing grammar item "${id}"`);
  return item;
}
