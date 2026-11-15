/** Shared contract for authored material, legacy cards, and optional lexical suggestions. */
export type LessonReviewPriority = 'essential' | 'optional';
export type LessonReviewFormat = 'qa' | 'cloze';
export type LessonReviewProvenance = 'authored' | 'legacy' | 'formatting' | 'custom';
export type LessonReviewBlock = 'grammar-card' | 'vocab-card' | 'vocab-inventory';

export interface LegacyGrammarAlias {
  rule: string;
  example: string;
}

interface LessonReviewItemBase {
  /** Authored IDs are stable and unique across both block types within a lesson. */
  id: string;
  priority: LessonReviewPriority;
  sourceSection: string;
  provenance: LessonReviewProvenance;
  /** An intentional edit of an authored item before saving, not a source repair. */
  learnerEdited?: boolean;
}

export interface VocabularyReviewItem extends LessonReviewItemBase {
  kind: 'vocabulary';
  source: 'vocab-card' | 'list' | 'table';
  word: string;
  reading: string;
  meaning: string;
  contextSentence: string;
  isSentence: boolean;
  /** Visible list text, when available, for the existing inline capture affordance. */
  sourceText: string;
}

export interface GrammarReviewItem extends LessonReviewItemBase {
  kind: 'rule' | 'concept';
  source: 'grammar-card';
  format: LessonReviewFormat;
  rule: string;
  hint: string;
  prompt: string;
  answer: string;
  explanation: string;
  legacyAliases: LegacyGrammarAlias[];
}

export type LessonReviewItem = VocabularyReviewItem | GrammarReviewItem;

export interface LessonReviewDiagnostic {
  code: 'invalid-json' | 'invalid-metadata' | 'duplicate-id' | 'duplicate-inventory' | 'unterminated-block';
  block: LessonReviewBlock;
  /** One-based source line, suitable for an author-facing error. */
  line: number;
  message: string;
  itemId?: string;
}

export interface LessonReviewParseResult<T = LessonReviewItem> {
  items: T[];
  diagnostics: LessonReviewDiagnostic[];
}

export interface LessonReviewMetadataBlock {
  block: LessonReviewBlock;
  line: number;
  value: Record<string, unknown>;
}

export function isMetadataObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Lowercase, lesson-local identifiers; never derive maintained IDs from wording. */
export const LESSON_REVIEW_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export function authoredMetadataErrors(value: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (typeof value.id !== 'string' || !LESSON_REVIEW_ID.test(value.id)) {
    errors.push('id must be a stable lowercase identifier (letters, digits, ".", "_" or "-")');
  }
  if (value.priority !== 'essential' && value.priority !== 'optional') {
    errors.push('priority must be "essential" or "optional"');
  }
  if (!isNonemptyString(value.sourceSection)) errors.push('sourceSection must be nonempty text');
  return errors;
}

/** Preserve offsets and line numbers while hiding fenced authoring examples. */
function maskFencedCode(markdown: string): string {
  let fence: { marker: string; length: number } | undefined;
  return markdown.split('\n').map((line) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (marker) {
      if (!fence) {
        fence = { marker: marker[1][0], length: marker[1].length };
      } else if (
        marker[1][0] === fence.marker &&
        marker[1].length >= fence.length &&
        !marker[2].trim()
      ) {
        fence = undefined;
      }
      return ' '.repeat(line.length);
    }
    return fence ? ' '.repeat(line.length) : line;
  }).join('\n');
}

/**
 * Read actual HTML comments, not fenced examples. Inventory controls are emitted
 * only when exactly one valid declaration exists; failures retain diagnostics.
 */
export function readLessonReviewBlocks(
  markdown: string,
  only?: LessonReviewBlock,
): LessonReviewParseResult<LessonReviewMetadataBlock> {
  const visible = maskFencedCode(markdown);
  const items: LessonReviewMetadataBlock[] = [];
  const diagnostics: LessonReviewDiagnostic[] = [];
  const comments = /<!--([\s\S]*?)(?:-->|$)/g;
  let inventoryCount = 0;
  let match: RegExpExecArray | null;
  while ((match = comments.exec(visible))) {
    const metadata = /^\s*(grammar-card|vocab-card|vocab-inventory)\b\s*(:?)([\s\S]*)$/.exec(match[1]);
    if (!metadata) continue;
    const block = metadata[1] as LessonReviewBlock;
    if (only && block !== only) continue;
    const line = markdown.slice(0, match.index).split('\n').length;
    if (block === 'vocab-inventory' && ++inventoryCount > 1) {
      diagnostics.push({
        code: 'duplicate-inventory', block, line,
        message: 'Only one vocab-inventory control is allowed per lesson',
      });
    }
    if (!match[0].endsWith('-->')) {
      diagnostics.push({ code: 'unterminated-block', block, line, message: `Unclosed ${block} comment` });
      continue;
    }
    if (metadata[2] !== ':') {
      diagnostics.push({ code: 'invalid-metadata', block, line, message: `Expected "${block}:"` });
      continue;
    }
    let value: unknown;
    try {
      value = JSON.parse(metadata[3]);
    } catch {
      diagnostics.push({ code: 'invalid-json', block, line, message: `Invalid JSON in ${block}` });
      continue;
    }
    if (!isMetadataObject(value)) {
      diagnostics.push({ code: 'invalid-metadata', block, line, message: `${block} must contain an object` });
      continue;
    }
    if (block === 'vocab-inventory' && (
      /[\r\n]/.test(match[0]) ||
      value.mode !== 'explicit' ||
      Object.keys(value).some((key) => key !== 'mode')
    )) {
      diagnostics.push({
        code: 'invalid-metadata', block, line,
        message: 'vocab-inventory must be a single-line comment containing only {"mode":"explicit"}',
      });
      continue;
    }
    items.push({ block, line, value });
  }
  // An ambiguous or broken control must never masquerade as an empty inventory.
  return {
    items: diagnostics.some((diagnostic) => diagnostic.block === 'vocab-inventory')
      ? items.filter((item) => item.block !== 'vocab-inventory')
      : items,
    diagnostics,
  };
}

/** Hide review controls, including malformed ones, but leave fenced examples intact. */
export function stripLessonReviewSources(markdown: string): string {
  const visible = maskFencedCode(markdown);
  const comments = /<!--\s*(?:grammar-card|vocab-card|vocab-inventory)\b[\s\S]*?(?:-->|$)/g;
  let result = '';
  let lastIndex = 0;
  for (const match of visible.matchAll(comments)) {
    result += markdown.slice(lastIndex, match.index);
    lastIndex = match.index + match[0].length;
  }
  return result + markdown.slice(lastIndex);
}
