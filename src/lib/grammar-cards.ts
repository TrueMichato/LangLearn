/** Pure helpers for grammar SRS cards, shared by lesson generation and the review card. */

export interface GrammarCardSource {
  rule: string;
  hint?: string;
  example?: string;
  answer?: string;
  explanation: string;
}

export interface GrammarCardFields {
  word: string;
  reading: string;
  contextSentence: string;
  meaning: string;
  grammarRule: string;
}

const GRAMMAR_CARD_BLOCK_REGEX = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

/** Parse every valid grammar-card metadata block from lesson markdown. */
export function extractGrammarCardSources(markdown: string): GrammarCardSource[] {
  const cards: GrammarCardSource[] = [];
  GRAMMAR_CARD_BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = GRAMMAR_CARD_BLOCK_REGEX.exec(markdown)) !== null) {
    try {
      cards.push(JSON.parse(match[1]) as GrammarCardSource);
    } catch {
      // Malformed content is ignored here and surfaced by content validation.
    }
  }
  return cards;
}

/** Remove grammar-card metadata before rendering lesson markdown. */
export function stripGrammarCardSources(markdown: string): string {
  GRAMMAR_CARD_BLOCK_REGEX.lastIndex = 0;
  return markdown.replace(GRAMMAR_CARD_BLOCK_REGEX, '');
}

/** A blank placeholder: a run of ASCII underscores or full-width underscores. */
export const BLANK_REGEX = /[_＿]{2,}/;

export function hasBlank(sentence: string | undefined | null): boolean {
  return !!sentence && BLANK_REGEX.test(sentence);
}

/**
 * Separates a `token — gloss` answer. Matches an em dash, en dash or a
 * hyphen, but only when surrounded by whitespace, so hyphenated words and
 * Arabic transliterations like `al-kutubu` survive intact.
 */
const GLOSS_SEPARATOR = /\s+[—–-]\s+/;

/** A parenthetical suffix, e.g. the ` (dārisun)` in `دَارِسٌ (dārisun)`. */
const TRAILING_PARENTHETICAL = /\s*\(([^()]*)\)\s*$/;

export interface ParsedAnswer {
  /** Exactly what belongs in the blank, and nothing else. */
  token: string;
  /** Any explanatory tail that was bundled into the answer field. */
  gloss: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split a prompt into the text either side of its blank. */
export function splitAroundBlank(prompt: string): { prefix: string; suffix: string } | null {
  const match = BLANK_REGEX.exec(prompt);
  if (!match) return null;
  return {
    prefix: prompt.slice(0, match.index),
    suffix: prompt.slice(match.index + match[0].length),
  };
}

/** How many blanks a prompt contains. Some prompts test two things at once. */
export function countBlanks(prompt: string): number {
  const matches = prompt.match(new RegExp(BLANK_REGEX.source, 'g'));
  return matches ? matches.length : 0;
}

/**
 * Split a comma-separated answer without breaking on commas inside brackets,
 * so `sei (saber), conheço (conhecer)` yields two parts rather than three.
 */
export function splitAnswerParts(answer: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of answer) {
    if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

/**
 * Recover the missing token from an answer that restates the whole sentence.
 *
 * Some content gives `example: "私＿＿学生です。"` with `answer: "私は学生です。"` —
 * the complete sentence rather than the particle under test. Substituting that
 * answer into the blank produced `私私は学生です。学生です。`. Diffing the answer
 * against the prompt's fixed prefix and suffix recovers the `は` that was
 * actually being tested.
 */
export function extractTokenFromFilledSentence(
  prompt: string,
  answer: string,
): string | null {
  const parts = splitAroundBlank(prompt);
  if (!parts) return null;

  const prefix = parts.prefix.trim();
  const suffix = parts.suffix.trim();
  const trimmed = answer.trim();

  // Nothing to diff against, or the answer does not restate the frame.
  if (!prefix && !suffix) return null;
  if (prefix && !trimmed.startsWith(prefix)) return null;

  // `Eu ___ fui ao Japão. (never)` — the parenthetical is a hint for the
  // learner, so the answer restates the sentence without it.
  const suffixVariants = [suffix, suffix.replace(TRAILING_PARENTHETICAL, '').trim()].filter(
    (value, index, all) => value && all.indexOf(value) === index,
  );

  for (const variant of suffixVariants) {
    if (!trimmed.endsWith(variant)) continue;
    if (trimmed.length <= prefix.length + variant.length) return null;
    const token = trimmed.slice(prefix.length, trimmed.length - variant.length).trim();
    if (token) return token;
  }

  // The answer restates the opening but not the tail — `Ela dança ___. (well)`
  // answered with `Ela dança bem.`, where the prompt's `(well)` hint is a note
  // to the learner rather than part of the sentence. Take everything after the
  // prefix and drop punctuation the prompt already supplies.
  if (prefix.length >= 3 && trimmed.length > prefix.length) {
    const rest = trimmed.slice(prefix.length).trim();
    const token = trimSharedTrailingPunctuation(rest, suffix);
    return token || null;
  }

  return null;
}

/** Drop trailing punctuation from `token` that the prompt's suffix already prints. */
function trimSharedTrailingPunctuation(token: string, suffix: string): string {
  const leadingPunctuation = suffix.match(/^[\s.,!?;:。、．！？]*/)?.[0] ?? '';
  if (!leadingPunctuation.trim()) return token;
  let result = token;
  for (const char of leadingPunctuation.trim()) {
    if (result.endsWith(char)) result = result.slice(0, -1).trim();
  }
  return result;
}

/**
 * Drop a transliteration from the token when the prompt already prints it
 * beside the blank.
 *
 * `Complete: دَرَسَ (darasa) → ___ (dārisun).` with answer `دَارِسٌ (dārisun)`
 * would otherwise reveal `… → دَارِسٌ (dārisun) (dārisun).`
 */
function stripRedundantParenthetical(token: string, prompt: string): string {
  const match = TRAILING_PARENTHETICAL.exec(token);
  if (!match) return token;

  const inner = match[1].trim();
  if (!inner) return token;

  const parts = splitAroundBlank(prompt);
  if (!parts) return token;

  // Only strip when that exact parenthetical already sits after the blank.
  const suffixHasIt = new RegExp(`\\(\\s*${escapeRegExp(inner)}\\s*\\)`).test(parts.suffix);
  if (!suffixHasIt) return token;

  const stripped = token.slice(0, match.index).trim();
  return stripped || token;
}

/**
 * Reduce a raw `answer` field to the token that belongs in the blank, plus any
 * gloss that was bundled alongside it.
 *
 * The content carries three shapes, and only the first is directly usable:
 *
 *   1. `は`                                   — the bare token
 *   2. `دَارِسٌ (dārisun) — student / studying` — token plus an English gloss
 *   3. `私は学生です。`                          — the whole filled sentence
 *
 * Shapes 2 and 3 both corrupted the reveal side, because the card substituted
 * the raw string into the blank verbatim.
 */
export function parseAnswer(rawAnswer: string, prompt = ''): ParsedAnswer {
  const answer = (rawAnswer ?? '').trim();
  if (!answer) return { token: '', gloss: '' };

  // Shape 3 first: a restated sentence can itself contain a dash, so testing it
  // against the prompt frame before splitting on a separator avoids truncating
  // a legitimate sentence at its punctuation.
  const fromSentence = extractTokenFromFilledSentence(prompt, answer);
  if (fromSentence) {
    return { token: stripRedundantParenthetical(fromSentence, prompt), gloss: '' };
  }

  // Shape 2: peel off a trailing gloss.
  const separatorMatch = GLOSS_SEPARATOR.exec(answer);
  let token = answer;
  let gloss = '';
  if (separatorMatch && separatorMatch.index > 0) {
    token = answer.slice(0, separatorMatch.index).trim();
    gloss = answer.slice(separatorMatch.index + separatorMatch[0].length).trim();
  }

  return { token: stripRedundantParenthetical(token, prompt), gloss };
}

/**
 * Positions of each blank in a prompt, and whether it sits inside a bracket.
 *
 * Arabic prompts mirror the sentence in transliteration —
 * `الطَّالِبَةُ ___ (aṭ-ṭālibatu ___)` — so the two blanks are the same slot
 * written twice, not two things to answer.
 */
function blankPositions(prompt: string): { index: number; inBracket: boolean }[] {
  const global = new RegExp(BLANK_REGEX.source, 'g');
  const positions: { index: number; inBracket: boolean }[] = [];
  let depth = 0;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = global.exec(prompt)) !== null) {
    for (; cursor < match.index; cursor++) {
      const char = prompt[cursor];
      if (char === '(' || char === '[') depth++;
      else if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
    }
    positions.push({ index: match.index, inBracket: depth > 0 });
  }
  return positions;
}

/** Split `token (transliteration)` into its script and transliteration halves. */
function splitTransliteration(answer: string): [string, string] | null {
  const match = answer.match(/^(.+?)\s*[([](.+)[)\]]$/);
  if (!match) return null;
  const [, script, transliteration] = match;
  if (!script.trim() || !transliteration.trim()) return null;
  return [script.trim(), transliteration.trim()];
}

/**
 * Work out what goes in each blank of a multi-blank prompt.
 * Returns null when the answer cannot be confidently distributed, in which case
 * the caller repeats the whole answer rather than inventing a split.
 */
function distributeAnswer(prompt: string, answer: string): string[] | null {
  const positions = blankPositions(prompt);
  const blanks = positions.length;

  // `Embora ... seja` — the author marked the split explicitly.
  const ellipsisParts = answer
    .split(/\s*(?:\.{3}|…)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (ellipsisParts.length === blanks) return ellipsisParts;

  // `sei (saber), conheço (conhecer)` — one comma-separated part per blank.
  const commaParts = splitAnswerParts(answer);
  if (commaParts.length === blanks) return commaParts;

  // A sentence mirrored in transliteration: the script fills the blanks in the
  // sentence, the transliteration fills the matching ones inside the brackets.
  const mirrored = distributeMirrored(positions, answer);
  if (mirrored) return mirrored;

  // `A música ___ ___ por Tom Jobim.` answered `foi composta` — one word per
  // blank. Only safe when the answer has no brackets to be torn apart.
  if (!/[()[\]]/.test(answer)) {
    const words = answer.split(/\s+/).filter(Boolean);
    if (words.length === blanks) return words;
  }

  return null;
}

/**
 * Fill a prompt whose blanks are mirrored between script and transliteration,
 * as Arabic prompts are: `عَلِمْتُ ___ ___ (ʿalimtu ___ ___)`.
 */
function distributeMirrored(
  positions: { inBracket: boolean }[],
  answer: string,
): string[] | null {
  const inside = positions.filter((p) => p.inBracket).length;
  const outside = positions.length - inside;
  if (inside === 0 || inside !== outside) return null;

  const halves = splitTransliteration(answer);
  // Without a transliteration to split, repeating the answer in both halves is
  // still the right reading of a mirrored prompt.
  if (!halves) return inside === 1 ? positions.map(() => answer) : null;

  const [script, transliteration] = halves;
  const scriptWords = script.split(/\s+/).filter(Boolean);
  const translitWords = transliteration.split(/\s+/).filter(Boolean);
  if (scriptWords.length !== inside || translitWords.length !== inside) {
    return inside === 1 ? positions.map((p) => (p.inBracket ? transliteration : script)) : null;
  }

  let scriptIndex = 0;
  let translitIndex = 0;
  return positions.map((p) =>
    p.inBracket ? translitWords[translitIndex++] : scriptWords[scriptIndex++],
  );
}

/**
 * Replace the blank placeholder in the prompt with the answer for the reveal side.
 * Callers pass the parsed token, never the raw answer field.
 */
export function fillBlank(sentence: string, answer: string): string {
  if (!sentence || !answer) return sentence;
  const global = new RegExp(BLANK_REGEX.source, 'g');
  const blanks = countBlanks(sentence);
  if (blanks === 0) return sentence;
  if (blanks === 1) return sentence.replace(global, answer);

  const parts = distributeAnswer(sentence, answer);
  if (!parts) return sentence.replace(global, answer);

  let index = 0;
  return sentence.replace(global, () => parts[index++] ?? answer);
}

/** Join an explanation and a gloss without repeating one inside the other. */
export function combineExplanation(explanation: string, gloss: string): string {
  const base = (explanation ?? '').trim();
  const extra = (gloss ?? '').trim();
  if (!extra) return base;
  if (!base) return extra;
  if (base.toLowerCase().includes(extra.toLowerCase())) return base;
  return `${extra} — ${base}`;
}

/**
 * Map a grammar-card source block to the Word fields stored for SRS.
 *
 * The prompt (example sentence, which contains a `___` blank when present) becomes the
 * question side; the parsed answer token becomes the hidden side; the rule is kept
 * separate so it never leaks onto the question. Returns null when there is nothing to test.
 */
export function buildGrammarCardFields(card: GrammarCardSource): GrammarCardFields | null {
  const prompt = card.example ?? '';
  const { token, gloss } = parseAnswer(card.answer ?? '', prompt);
  if (!token && !prompt) return null;
  return {
    word: token || card.rule,
    reading: card.hint ?? '',
    contextSentence: prompt,
    meaning: combineExplanation(card.explanation, gloss),
    grammarRule: card.rule,
  };
}
