export interface IchiMoeWord {
  surface: string;
  reading: string;
  partOfSpeech: string;
  definition: string;
  dictionaryForm?: string;
}

export interface IchiMoeResult {
  words: IchiMoeWord[];
  corsBlocked: boolean;
}

const CACHE_PREFIX = 'ichimoe:';

function getCached(text: string): IchiMoeWord[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + text);
    if (raw) return JSON.parse(raw) as IchiMoeWord[];
  } catch {
    // ignore corrupt cache
  }
  return null;
}

function setCache(text: string, words: IchiMoeWord[]): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + text, JSON.stringify(words));
  } catch {
    // storage full — silently ignore
  }
}

/** Build the ichi.moe URL for a given query. */
export function getIchiMoeUrl(text: string): string {
  return `https://ichi.moe/cl/qr?q=${encodeURIComponent(text)}&r=htr`;
}

/**
 * Parse the HTML returned by ichi.moe and extract word entries.
 *
 * The page contains `<div class="gloss-rw">` blocks — one per morpheme.
 * Inside each block:
 *   - `.gloss-rw dt` contains the surface form
 *   - `.gloss-rw .alternatives .romaji` contains the reading
 *   - `.gloss-rw .alternatives .pos-desc` or the first `.tag` has the POS
 *   - `.gloss-rw .alternatives .gloss-desc li` has definitions
 *   - `.gloss-rw .alternatives .conjugations` may contain the dictionary form
 */
function parseIchiMoeHtml(html: string): IchiMoeWord[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const words: IchiMoeWord[] = [];

  const blocks = doc.querySelectorAll('.gloss-rw');
  for (const block of blocks) {
    // Surface text: the <dt> tag inside the block
    const dtEl = block.querySelector('dt');
    const surface = dtEl?.textContent?.trim() ?? '';
    if (!surface) continue;

    // Skip punctuation-only entries
    if (/^[\s。、！？「」『』（）\u3000…・―]+$/.test(surface)) continue;

    // First alternative is the primary interpretation
    const alt = block.querySelector('.alternatives .alternative') ?? block.querySelector('.alternatives');

    // Reading
    const readingEl = alt?.querySelector('.romaji') ?? alt?.querySelector('.reading');
    const reading = readingEl?.textContent?.trim() ?? '';

    // Part of speech
    const posEl = alt?.querySelector('.pos-desc') ?? alt?.querySelector('.tag');
    const partOfSpeech = posEl?.textContent?.trim() ?? '';

    // Definitions — collect all <li> in .gloss-desc
    const defItems = alt?.querySelectorAll('.gloss-desc li');
    let definition = '';
    if (defItems && defItems.length > 0) {
      definition = Array.from(defItems)
        .map((li) => li.textContent?.trim())
        .filter(Boolean)
        .join('; ');
    }
    // Fallback: try plain .gloss-desc text
    if (!definition) {
      const glossDesc = alt?.querySelector('.gloss-desc');
      definition = glossDesc?.textContent?.trim() ?? '';
    }

    // Dictionary form from conjugation info
    const conjEl = alt?.querySelector('.conjugations a, .conjugations .conj-gloss');
    const dictionaryForm = conjEl?.textContent?.trim() || undefined;

    words.push({ surface, reading, partOfSpeech, definition, dictionaryForm });
  }

  return words;
}

/**
 * Parse Japanese text with ichi.moe.
 *
 * Tries a direct fetch first. If CORS blocks the request, returns
 * `{ words: [], corsBlocked: true }` so the UI can show a fallback link.
 */
export async function parseWithIchiMoe(text: string): Promise<IchiMoeResult> {
  const trimmed = text.trim();
  if (!trimmed) return { words: [], corsBlocked: false };

  // Check session cache
  const cached = getCached(trimmed);
  if (cached) return { words: cached, corsBlocked: false };

  const url = getIchiMoeUrl(trimmed);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return { words: [], corsBlocked: false };
    }
    const html = await res.text();
    const words = parseIchiMoeHtml(html);
    if (words.length > 0) setCache(trimmed, words);
    return { words, corsBlocked: false };
  } catch (err: unknown) {
    // TypeError with "Failed to fetch" is the typical CORS / network error
    if (err instanceof TypeError || (err instanceof DOMException && err.name === 'AbortError')) {
      return { words: [], corsBlocked: true };
    }
    return { words: [], corsBlocked: true };
  } finally {
    clearTimeout(timeout);
  }
}
