/**
 * Pull vocabulary candidates out of grammar lesson markdown.
 *
 * Lessons present vocabulary in two ways: bold list items and markdown tables.
 * Only the list items were capturable before, which left the majority of terms
 * — every table row — with no way to reach the review deck.
 *
 * The parser is deliberately conservative. Lessons are full of paradigm tables
 * (Russian case endings, Japanese conjugation forms) whose rows are not
 * vocabulary at all, so a table only yields candidates when it declares a
 * meaning column. Offering a learner a card for `нов**ого**` with no meaning is
 * worse than offering nothing.
 */

import type { ReactNode } from 'react';

export interface CaptureCandidate {
  /** Stable identity for dedupe and selection state. */
  id: string;
  /** The term in the target language. */
  word: string;
  /** Romanisation, furigana or pronunciation guide. May be empty. */
  reading: string;
  /** English meaning. Never empty — a candidate without one is dropped. */
  meaning: string;
  /**
   * A genuine target-language example sentence, or empty.
   *
   * Never a `word — meaning` dictionary line: `Flashcard` renders this on the
   * question side, so putting the meaning here prints the answer under the
   * prompt.
   */
  contextSentence: string;
  /** Whether the term is a full sentence rather than a single word or phrase. */
  isSentence: boolean;
  source: 'list' | 'table';
  /**
   * The plain text of the line this came from, used to attach an inline save
   * button to the matching rendered list item.
   */
  sourceText: string;
}

const MEANING_HEADER = /\b(meaning|translation|english|gloss|sense|significado|sens|significat)\b/i;
const READING_HEADER =
  /\b(reading|pronunciation|pronúncia|pronunciación|romaji|rōmaji|romanization|romanisation|transliteration|furigana|kana|ipa)\b/i;
const EXAMPLE_HEADER = /\b(example|sentence|usage|exemplo|ejemplo|exemplu)\b/i;
/** Headers that name the term itself rather than a grammatical property. */
const TERM_HEADER =
  /\b(word|term|vocabulary|phrase|expression|verb|noun|adjective|adverb|pronoun|particle|preposition|conjunction|kanji|base|form|japanese|russian|arabic|portuguese|spanish|romanian|hebrew)\b/i;

/** Sections that describe the lesson rather than teach vocabulary. */
const SKIPPED_SECTION = /^#{1,6}\s*(sources|further reading|references|see also)\b/i;

/**
 * Common English words, used to tell instructional prose apart from a term in
 * the target language. Lessons are written in English, so a bullet like
 * `**Hard-stem adjectives (новый) are the most common** — learn this first` is
 * explanation rather than vocabulary, and a parenthetical like `(only short)`
 * is an annotation rather than a romanisation.
 */
const ENGLISH_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'from',
  'with', 'without', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do',
  'does', 'did', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'you',
  'your', 'we', 'our', 'not', 'no', 'all', 'any', 'some', 'other', 'another', 'both',
  'each', 'every', 'most', 'more', 'less', 'than', 'only', 'also', 'always', 'usually',
  'often', 'never', 'when', 'while', 'if', 'so', 'because', 'common', 'used', 'use',
  'uses', 'note', 'remember', 'learn', 'means', 'meaning', 'pattern', 'patterns', 'form',
  'forms', 'ending', 'endings', 'stem', 'rule', 'rules', 'word', 'words', 'verb', 'verbs',
  'noun', 'nouns', 'adjective', 'adjectives', 'adverb', 'adverbs', 'formal', 'informal',
  'literal', 'literally', 'same', 'different', 'first', 'second', 'third', 'here', 'there',
]);

function englishWordRatio(text: string): number {
  const tokens = text
    .toLowerCase()
    .split(/[\s,;:]+/)
    .map((token) => token.replace(/[^a-z-]/g, ''))
    .filter(Boolean);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => ENGLISH_WORDS.has(token)).length;
  return hits / tokens.length;
}

/** Whether a term is really a sentence of English explanation. */
function isEnglishProse(word: string): boolean {
  const tokens = word.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return false;
  return englishWordRatio(word) >= 0.5;
}

/** Whether a bracketed suffix is an English annotation rather than a reading. */
function isAnnotation(value: string): boolean {
  if (!/^[\x20-\x7E]+$/.test(value)) return false;
  return englishWordRatio(value) > 0;
}

/** Strip emphasis, inline code and links down to their text. */
function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove the parts of a lesson that never contain capturable vocabulary. */
function usableLines(markdown: string): string[] {
  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '');
  const lines = withoutComments.split('\n');
  const result: string[] = [];
  let inFence = false;
  let skipping = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#{1,6}\s/.test(line)) skipping = SKIPPED_SECTION.test(line);
    if (skipping) continue;
    result.push(line);
  }
  return result;
}

/** A cell or list item may carry its own `term (reading) — meaning` gloss. */
function parseGlossed(text: string): { word: string; reading: string; meaning: string } | null {
  const cleaned = stripMarkdown(text);
  if (!cleaned) return null;

  const withGloss = cleaned.match(/^(.+?)\s+[—–]\s+(.+)$/);
  const head = withGloss ? withGloss[1].trim() : cleaned;
  const meaning = withGloss ? withGloss[2].trim() : '';

  // `دَارِسٌ (dārisun)` / `静(しず)か` — a trailing bracket is the reading,
  // unless it is an English aside like `(only short)`.
  const withReading = head.match(/^(.+?)\s*[(（]([^()（）]+)[)）]\s*$/);
  if (withReading && !isAnnotation(withReading[2].trim())) {
    return {
      word: withReading[1].trim(),
      reading: withReading[2].trim(),
      meaning,
    };
  }
  if (withReading) {
    return { word: withReading[1].trim(), reading: '', meaning };
  }
  return { word: head, reading: '', meaning };
}

/**
 * Whether a captured term is a sentence rather than a word or short phrase.
 * Japanese and Arabic are checked by length and punctuation because word
 * spacing is not a reliable signal in either.
 */
export function looksLikeSentence(word: string): boolean {
  if (/[。．！？…]$/.test(word)) return true;
  if (/[.!?]$/.test(word) && word.length > 12) return true;
  const words = word.split(/\s+/).filter(Boolean);
  if (words.length >= 4) return true;
  return words.length === 1 && word.length > 14;
}

/** Reject candidates that would make a useless or misleading card. */
function isUsable(word: string, meaning: string): boolean {
  if (!word || !meaning) return false;
  if (word.length > 160 || meaning.length > 200) return false;
  if (word.toLowerCase() === meaning.toLowerCase()) return false;
  // Lessons are written in English, so an English sentence in the term slot is
  // the author explaining something, not a term to learn.
  if (isEnglishProse(word)) return false;
  // Grammatical labels ("masculine singular", "past affirmative") are table
  // scaffolding, not terms to learn.
  if (/^(masculine|feminine|neuter|singular|plural|present|past|future|formal|informal|positive|negative|affirmative)\b/i.test(word)) {
    return false;
  }
  return true;
}

function candidateId(word: string, meaning: string): string {
  return `${word}::${meaning}`;
}

function buildCandidate(
  parts: { word: string; reading: string; meaning: string; contextSentence?: string },
  source: 'list' | 'table',
  sourceText: string,
): CaptureCandidate | null {
  const word = parts.word.trim();
  const meaning = parts.meaning.trim();
  if (!isUsable(word, meaning)) return null;

  const isSentence = looksLikeSentence(word);
  const context = (parts.contextSentence ?? '').trim();
  return {
    id: candidateId(word, meaning),
    word,
    reading: parts.reading.trim(),
    meaning,
    // A sentence is its own context; repeating it adds nothing to the card.
    contextSentence: isSentence || context === word ? '' : context,
    isSentence,
    source,
    sourceText,
  };
}

/** Capture candidates from bold list items: `- **term (reading)** — meaning`. */
export function parseListCandidates(markdown: string): CaptureCandidate[] {
  const candidates: CaptureCandidate[] = [];

  for (const line of usableLines(markdown)) {
    const item = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/);
    if (!item) continue;
    const body = item[1].trim();
    // Requiring bold avoids capturing prose bullets like "Note that …".
    if (!body.startsWith('**')) continue;

    const parsed = parseGlossed(body);
    if (!parsed) continue;
    const candidate = buildCandidate(parsed, 'list', stripMarkdown(body));
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');
}

interface ColumnRoles {
  target: number;
  reading: number;
  meaning: number;
  example: number;
}

/**
 * Decide what each column of a table holds.
 *
 * Returns null when there is no meaning column, which is how paradigm tables
 * (`| Case | Masculine | Feminine |`) are excluded — their rows are endings to
 * recognise, not vocabulary to memorise.
 */
export function resolveColumnRoles(headers: string[]): ColumnRoles | null {
  const cleaned = headers.map(stripMarkdown);
  const meaning = cleaned.findIndex((h) => MEANING_HEADER.test(h));
  if (meaning === -1) return null;

  const taken = new Set<number>([meaning]);
  const findRole = (pattern: RegExp): number => {
    const index = cleaned.findIndex((h, i) => !taken.has(i) && pattern.test(h));
    if (index !== -1) taken.add(index);
    return index;
  };

  const reading = findRole(READING_HEADER);
  const example = findRole(EXAMPLE_HEADER);
  // A named term column wins over position, so `| Pattern | Arabic | Translation |`
  // captures the Arabic rather than the pattern label.
  let target = findRole(TERM_HEADER);
  if (target === -1) {
    target = cleaned.findIndex((_, i) => !taken.has(i));
  }
  if (target === -1) return null;

  return { target, reading, meaning, example };
}

/** Capture candidates from markdown tables that declare a meaning column. */
export function parseTableCandidates(markdown: string): CaptureCandidate[] {
  const lines = usableLines(markdown);
  const candidates: CaptureCandidate[] = [];
  let roles: ColumnRoles | null = null;
  let expectSeparator = false;

  for (const line of lines) {
    const isRow = /^\s*\|.*\|\s*$/.test(line);
    if (!isRow) {
      roles = null;
      expectSeparator = false;
      continue;
    }
    if (isSeparatorRow(line)) {
      expectSeparator = false;
      continue;
    }

    const cells = splitRow(line);

    // The first row of a table block is its header.
    if (!roles && !expectSeparator) {
      roles = resolveColumnRoles(cells);
      expectSeparator = true;
      continue;
    }
    if (!roles) continue;

    const targetCell = cells[roles.target] ?? '';
    const meaningCell = roles.meaning >= 0 ? (cells[roles.meaning] ?? '') : '';
    const parsed = parseGlossed(targetCell);
    if (!parsed) continue;

    // A cell that carries its own gloss is more precise than the row's meaning
    // column, which is often a hint rather than a translation.
    const meaning = parsed.meaning || stripMarkdown(meaningCell);
    const reading = parsed.reading || (roles.reading >= 0 ? stripMarkdown(cells[roles.reading] ?? '') : '');
    const example = roles.example >= 0 ? stripMarkdown(cells[roles.example] ?? '') : '';

    const candidate = buildCandidate(
      { word: parsed.word, reading, meaning, contextSentence: example },
      'table',
      stripMarkdown(targetCell),
    );
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

/**
 * Flatten a rendered markdown node back to its plain text.
 *
 * Lives here rather than in the view because it is one half of the inline-button
 * match: this must produce exactly what `stripMarkdown` produced when the same
 * line was parsed, or the button silently fails to appear.
 */
export function nodeText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return nodeText((node as { props: { children?: ReactNode } }).props.children ?? '');
  }
  return '';
}

/**
 * Normalise rendered text so it can be matched back to a parsed candidate.
 *
 * Emphasis markers are stripped rather than trusted. CommonMark's flanking
 * rules refuse to open emphasis when `**` sits between a letter and CJK
 * punctuation, so a line like `**寝ている**間**、静かに**` renders with a literal
 * `**` that our own markdown stripper removed. Dropping the markers from both
 * sides makes the comparison immune to that class of divergence.
 */
export function normalizeForMatch(text: string): string {
  return text.replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Find the candidate a rendered list item belongs to.
 *
 * A list item that has a nested sub-list renders its own text followed by every
 * child's, so an exact comparison misses it. Falling back to the longest key
 * that the rendered text starts with attaches the button to the parent while
 * still letting each child match itself exactly.
 */
export function matchCandidate(
  index: Map<string, CaptureCandidate>,
  renderedText: string,
): CaptureCandidate | undefined {
  const key = normalizeForMatch(renderedText);
  const exact = index.get(key);
  if (exact) return exact;

  let best: CaptureCandidate | undefined;
  let bestLength = 0;
  for (const [candidateKey, candidate] of index) {
    if (candidateKey.length > bestLength && key.startsWith(candidateKey)) {
      best = candidate;
      bestLength = candidateKey.length;
    }
  }
  return best;
}

/** Index list candidates by their source line, for attaching inline buttons. */
export function indexBySourceText(
  candidates: CaptureCandidate[],
): Map<string, CaptureCandidate> {
  const index = new Map<string, CaptureCandidate>();
  for (const candidate of candidates) {
    if (candidate.source !== 'list') continue;
    index.set(normalizeForMatch(candidate.sourceText), candidate);
  }
  return index;
}

/** Every capturable term in a lesson, in document order, without duplicates. */
export function parseLessonCandidates(markdown: string): CaptureCandidate[] {
  const seen = new Set<string>();
  const result: CaptureCandidate[] = [];

  for (const candidate of [...parseListCandidates(markdown), ...parseTableCandidates(markdown)]) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    result.push(candidate);
  }

  return result;
}

/** The provenance tag that ties a saved word back to the lesson it came from. */
export function lessonTag(lessonId: string): string {
  return `lesson:${lessonId}`;
}

/** The lesson a saved card came from, if it was tagged with one. */
export function lessonIdFromTags(tags: string[] | undefined): string | null {
  const tag = (tags ?? []).find((t) => t.startsWith('lesson:'));
  return tag ? tag.slice('lesson:'.length) : null;
}

/** Turn a lesson id into something readable: `particles-wa-ga` → `Particles wa ga`. */
export function humanizeLessonId(lessonId: string): string {
  const words = lessonId.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Tags for a captured word: always provenance, plus a sentence marker. */
export function captureTags(lessonId: string, isSentence: boolean): string[] {
  const tags = ['grammar', lessonTag(lessonId)];
  if (isSentence) tags.push('sentence');
  return tags;
}
