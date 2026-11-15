/** Shared contract for authored material, legacy cards, and optional lexical suggestions. */
export type LessonReviewPriority = 'essential' | 'optional';
export type LessonReviewFormat = 'qa' | 'cloze';
export type LessonReviewProvenance = 'authored' | 'legacy' | 'formatting' | 'custom';
export type LessonReviewBlock = 'grammar-card' | 'vocab-card';

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
  code: 'invalid-json' | 'invalid-metadata' | 'duplicate-id' | 'unterminated-block';
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

/** Read actual HTML comments, not metadata examples inside fenced code. */
export function readLessonReviewBlocks(
  markdown: string,
  only?: LessonReviewBlock,
): LessonReviewParseResult<LessonReviewMetadataBlock> {
  let fence: { marker: string; length: number } | undefined;
  const visible = markdown.split('\n').map((line) => {
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
  const items: LessonReviewMetadataBlock[] = [];
  const diagnostics: LessonReviewDiagnostic[] = [];
  const comments = /<!--([\s\S]*?)(?:-->|$)/g;
  let match: RegExpExecArray | null;
  while ((match = comments.exec(visible))) {
    const metadata = /^\s*(grammar-card|vocab-card)\b\s*(:?)([\s\S]*)$/.exec(match[1]);
    if (!metadata) continue;
    const block = metadata[1] as LessonReviewBlock;
    if (only && block !== only) continue;
    const line = markdown.slice(0, match.index).split('\n').length;
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
    items.push({ block, line, value });
  }
  return { items, diagnostics };
}
