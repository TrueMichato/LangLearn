export interface ClozeSpan {
  start: number;
  end: number;
}

const NO_WORD_BOUNDARY_LANGUAGES = new Set(['ja', 'zh', 'ko']);
const ARABIC_IGNORABLE = /[\u064B-\u065F\u0670\u0640]/gu;
// A base character followed by its combining marks (or a run of stray marks).
const CLUSTER = /\P{M}\p{M}*|\p{M}+/gsu;
const WORD_CHAR_BEFORE = /[\p{L}\p{M}\p{N}]$/u;
const WORD_CHAR_AFTER = /^[\p{L}\p{M}\p{N}]/u;

interface Normalized {
  text: string;
  /** Per code unit of `text`: original index where its source cluster starts. */
  starts: number[];
  /** Per code unit of `text`: original index just past its source cluster. */
  ends: number[];
}

/**
 * NFC-normalize and lowercase cluster-by-cluster (stripping Arabic harakat and
 * tatweel when relevant) so each normalized code unit maps back to an exact
 * range of the original string, even when lowercasing changes length.
 */
function normalize(original: string, language: string): Normalized {
  const stripArabic = language === 'ar';
  const starts: number[] = [];
  const ends: number[] = [];
  let text = '';
  for (const match of original.matchAll(CLUSTER)) {
    const start = match.index;
    const end = start + match[0].length;
    let cluster = match[0];
    if (stripArabic) cluster = cluster.replace(ARABIC_IGNORABLE, '');
    const normalized = cluster.normalize('NFC').toLocaleLowerCase();
    if (!normalized) {
      // An ignored mark/tatweel belongs to the preceding letter's span.
      for (let k = ends.length - 1; k >= 0 && ends[k] === start; k--) ends[k] = end;
      continue;
    }
    text += normalized;
    for (let k = 0; k < normalized.length; k++) {
      starts.push(start);
      ends.push(end);
    }
  }
  return { text, starts, ends };
}

/**
 * Locate `target` inside `sentence` for a cloze blank. Returns indices into the
 * original `sentence`, or null when the exact form isn't present. Matching is
 * case-insensitive and NFC-normalized; Arabic ignores harakat/tatweel; spaced
 * languages require whole-word boundaries. No stemming or inflection guessing.
 */
export function findClozeSpan(sentence: string, target: string, language: string): ClozeSpan | null {
  const needle = normalize(target.trim(), language).text;
  if (!needle || !sentence) return null;
  const hay = normalize(sentence, language);
  const needsBoundary = !NO_WORD_BOUNDARY_LANGUAGES.has(language);

  let from = 0;
  for (;;) {
    const found = hay.text.indexOf(needle, from);
    if (found === -1) return null;
    const start = hay.starts[found];
    const end = hay.ends[found + needle.length - 1];
    // A match must cover whole clusters, and (for spaced scripts) whole words.
    const alignedStart = found === 0 || hay.starts[found - 1] !== start;
    const last = found + needle.length - 1;
    const alignedEnd = last + 1 === hay.text.length || hay.starts[last + 1] !== hay.starts[last];
    const bounded = !needsBoundary || (
      !WORD_CHAR_BEFORE.test(sentence.slice(Math.max(0, start - 2), start))
      && !WORD_CHAR_AFTER.test(sentence.slice(end, end + 2))
    );
    if (alignedStart && alignedEnd && bounded) return { start, end };
    from = found + 1;
  }
}
