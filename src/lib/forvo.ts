const FORVO_LANG_CODES: Record<string, string> = {
  ja: 'ja',
  ru: 'ru',
  es: 'es',
  pt: 'pt',
  ar: 'ar',
  ro: 'ro',
};

/**
 * Get a Forvo pronunciation page URL for a word.
 * Returns null if the language isn't supported.
 */
export function getForvoUrl(word: string, language: string): string | null {
  const lang = FORVO_LANG_CODES[language];
  if (!lang) return null;
  return `https://forvo.com/word/${encodeURIComponent(word)}/#${lang}`;
}
