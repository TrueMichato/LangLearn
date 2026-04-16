export interface SentenceSpan {
  text: string;
  start: number;
  end: number;
}

const SENTENCE_PATTERN = /[^。！？.!?\n]+[。！？.!?\n]?/g;

/** Split text into sentences by common delimiters (Japanese, Russian, Latin). */
export function splitSentences(text: string): SentenceSpan[] {
  if (!text) return [];

  const sentences: SentenceSpan[] = [];
  let match: RegExpExecArray | null;

  SENTENCE_PATTERN.lastIndex = 0;
  while ((match = SENTENCE_PATTERN.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed) {
      sentences.push({
        text: trimmed,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return sentences;
}

/** Given a character position, find which sentence it belongs to. */
export function findSentenceAt(
  sentences: SentenceSpan[],
  position: number,
): string {
  for (const s of sentences) {
    if (position >= s.start && position < s.end) {
      return s.text;
    }
  }
  return '';
}
