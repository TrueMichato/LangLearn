export interface SrtSegment {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse an SRT subtitle file into segments.
 * Standard SRT format:
 *   1
 *   00:00:01,000 --> 00:00:04,000
 *   Hello, how are you?
 *
 *   2
 *   00:00:05,000 --> 00:00:08,000
 *   I'm fine, thank you.
 */
export function parseSrt(content: string): SrtSegment[] {
  const segments: SrtSegment[] = [];
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/).filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const indexLine = lines[0].trim();
    const index = parseInt(indexLine, 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1].trim();
    const timeMatch = timeLine.match(
      /^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/,
    );
    if (!timeMatch) continue;

    const textLines = lines.slice(2);
    // Strip HTML tags commonly found in subtitles
    const text = textLines
      .map((l) => l.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join('\n');

    if (text) {
      segments.push({
        index,
        startTime: timeMatch[1],
        endTime: timeMatch[2],
        text,
      });
    }
  }

  return segments;
}

/**
 * Convert parsed SRT segments into a single reading text.
 * Each subtitle segment becomes a line, with blank lines between sections.
 */
export function srtToText(segments: SrtSegment[]): string {
  return segments.map((s) => s.text).join('\n');
}

/**
 * Format SRT timestamp (e.g., "00:01:23,456") for display.
 */
export function formatSrtTime(time: string): string {
  const cleaned = time.replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length !== 3) return time;
  const [h, m, s] = parts;
  if (h === '00') return `${m}:${s.split('.')[0]}`;
  return `${h}:${m}:${s.split('.')[0]}`;
}
