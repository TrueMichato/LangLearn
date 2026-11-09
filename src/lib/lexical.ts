/** Matching intentionally does not stem words or discard meaningful Latin accents. */
export function normalizeLanguage(language: string): string {
  return language.trim().toLowerCase().replace(/_/g, '-').split('-')[0];
}

export function normalizeLexeme(value: string, language: string): string {
  const lang = normalizeLanguage(language);
  let result = value.normalize('NFKC').toLowerCase()
    .replace(/[’‘ʼ]/g, "'").replace(/\s+/g, ' ').trim()
    .replace(/^[.,;:!?¿¡…。、！？،؛؟\s]+|[.,;:!?¿¡…。、！？،؛؟\s]+$/gu, '');
  if (lang === 'ru') {
    result = result.normalize('NFD').replace(/\u0301/g, '').normalize('NFC');
  }
  if (lang === 'ar') {
    // Harakat, Quranic annotation marks, and tatweel are optional, not letters.
    result = result.replace(
      /\u0640|\u0670|[\u0610-\u061a\u064b-\u065f\u06d6-\u06dc\u06df-\u06e4\u06e7-\u06e8\u06ea-\u06ed]/gu, '',
    );
  }
  return result.normalize('NFC');
}

/** Only explicit complete single-word alternatives, never el / la + noun or guessed suffixes. */
export function lexicalForms(value: string, language: string): readonly string[] {
  const key = normalizeLexeme(value, language);
  const alternatives = key.split(/\s*\/\s*/u);
  if (alternatives.length > 1 && alternatives.every((form) =>
    /^\p{L}[\p{L}\p{M}'-]*$/u.test(form))) {
    return [...new Set([key, ...alternatives])];
  }
  return [key];
}

export function isLexical(value: string): boolean {
  return /\p{L}/u.test(value);
}

export interface LexicalToken {
  readonly surface: string;
  /** A verified dictionary/content lemma, never a guessed stem. */
  readonly lemma?: string;
  /** Prevent phrase matches across punctuation or sentence boundaries. */
  readonly boundaryBefore?: boolean;
}

export type MatchingMode = 'japanese-lemmas' | 'surface' | 'japanese-fallback';

export interface LexicalDocument {
  readonly language: string;
  readonly tokens: readonly LexicalToken[];
  readonly mode: MatchingMode;
  readonly limitations: readonly string[];
}

export const SURFACE_LIMITATION =
  'Surface-form matching only; inflections and unlisted aliases may not match. Accents remain significant.';
export const JAPANESE_FALLBACK_LIMITATION =
  'Japanese tokenizer unavailable: character-run segmentation is approximate and does not resolve inflections.';

export function segmentSurfaceText(text: string, language: string): LexicalDocument {
  const lang = normalizeLanguage(language);
  const normalizedText = text.normalize('NFKC');
  const regex = lang === 'ja'
    ? /[\p{Script=Han}]+|[\p{Script=Hiragana}]+|[\p{Script=Katakana}ー]+|[\p{L}\p{M}]+/gu
    : /\p{L}[\p{L}\p{M}]*(?:['’‘ʼ-]\p{L}[\p{L}\p{M}]*)*/gu;
  const tokens: LexicalToken[] = [];
  let end = 0;
  for (const match of normalizedText.matchAll(regex)) {
    tokens.push(Object.freeze({
      surface: match[0],
      boundaryBefore: /[^\s]/u.test(normalizedText.slice(end, match.index)),
    }));
    end = match.index + match[0].length;
  }
  return Object.freeze({
    language: lang,
    tokens: Object.freeze(tokens),
    mode: lang === 'ja' ? 'japanese-fallback' : 'surface',
    limitations: Object.freeze([
      lang === 'ja' ? JAPANESE_FALLBACK_LIMITATION : SURFACE_LIMITATION,
      ...(['ja', 'ru', 'pt', 'es', 'ar', 'ro', 'en'].includes(lang) ? []
        : ['Word segmentation is not verified for this language; coverage may be approximate.']),
    ]),
  });
}
