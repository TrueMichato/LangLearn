import { isLexical } from './lexical';
import { tokenizeJapanese, type Token } from './tokenizer';

export interface ReaderSegment {
  readonly surface: string;
  /** UTF-16 offsets into the unmodified source, including every separator. */
  readonly start: number;
  readonly end: number;
  /** Only lexical segments are lookup/highlight targets. */
  readonly token?: Token;
}

export function getReaderNavigationIndex(
  wordIndices: readonly number[], current: number, key: string, rtl = false,
): number | null {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
  const position = wordIndices.indexOf(current);
  if (position < 0) return null;
  const forward = key === (rtl ? 'ArrowLeft' : 'ArrowRight');
  return wordIndices[Math.max(0, Math.min(wordIndices.length - 1, position + (forward ? 1 : -1)))];
}

function surfaceSegments(source: string, language: string): ReaderSegment[] {
  const pattern = language === 'ja'
    ? /[\p{Script=Han}]+|[\p{Script=Hiragana}]+|[\p{Script=Katakana}ー]+|[\p{L}\p{M}]+/gu
    : /\p{L}[\p{L}\p{M}]*(?:['’‘ʼ-]\p{L}[\p{L}\p{M}]*)*/gu;
  const segments: ReaderSegment[] = [];
  let end = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > end) {
      segments.push({ surface: source.slice(end, match.index), start: end, end: match.index });
    }
    end = match.index + match[0].length;
    segments.push({
      surface: match[0],
      start: match.index,
      end,
      token: { surface: match[0], reading: '', isKanji: false },
    });
  }
  if (end < source.length) {
    segments.push({ surface: source.slice(end), start: end, end: source.length });
  }
  return segments;
}

/** Project dictionary tokens onto raw source; never normalize or invent display text. */
export function segmentReaderText(
  source: string,
  language: string,
  japaneseTokens?: readonly Token[],
): ReaderSegment[] {
  if (language !== 'ja' || !japaneseTokens?.length) return surfaceSegments(source, language);

  const segments: ReaderSegment[] = [];
  let end = 0;
  for (const token of japaneseTokens) {
    if (!token.surface) continue;
    const start = source.indexOf(token.surface, end);
    if (start < 0) return surfaceSegments(source, language);
    if (start > end) {
      segments.push(...surfaceSegments(source.slice(end, start), language).map((segment) => ({
        ...segment, start: segment.start + end, end: segment.end + end,
      })));
    }
    end = start + token.surface.length;
    segments.push({
      surface: source.slice(start, end),
      start,
      end,
      token: isLexical(token.surface) && token.partOfSpeech !== '記号' &&
        token.partOfSpeechDetail !== '数' ? token : undefined,
    });
  }
  if (end < source.length) {
    segments.push(...surfaceSegments(source.slice(end), language).map((segment) => ({
      ...segment, start: segment.start + end, end: segment.end + end,
    })));
  }
  return segments;
}

/** All Reader entry paths use the same presentation, independent of coverage analysis. */
export async function loadReaderSegments(source: string, language: string): Promise<ReaderSegment[]> {
  if (language === 'ja') {
    try {
      return segmentReaderText(source, language, await tokenizeJapanese(source));
    } catch {
      // Coverage independently labels its existing approximate Japanese fallback.
    }
  }
  return segmentReaderText(source, language);
}
