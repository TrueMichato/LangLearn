import { isRTLLanguage } from './languages';

/**
 * Right-to-left language support.
 *
 * Arabic (and future Hebrew/Persian/Urdu) is written RTL. The app UI itself
 * stays LTR (English labels), but any element that renders *target-language*
 * text must be marked so the browser's Unicode bidi algorithm lays it out
 * correctly — otherwise mixed Arabic + Latin/number content renders in the
 * wrong visual order and punctuation jumps to the wrong side.
 *
 * Use these helpers at every render point that shows target text: flashcards,
 * grammar lessons, reading, sentence tiles, cloze, vocab, listening, lyrics.
 */

export type Direction = 'rtl' | 'ltr';

/** Reading direction for a language code. */
export function dirForLanguage(lang: string): Direction {
  return isRTLLanguage(lang) ? 'rtl' : 'ltr';
}

/** True when the language should render right-to-left. */
export function isRTL(lang: string): boolean {
  return isRTLLanguage(lang);
}

/**
 * Props to spread onto an element that renders target-language text, so it
 * inherits the correct writing direction. Returns an empty object for LTR
 * languages so existing layouts are untouched.
 *
 *   <p {...rtlProps(lang)}>{word.word}</p>
 */
export function rtlProps(lang: string): { dir?: Direction } {
  return isRTLLanguage(lang) ? { dir: 'rtl' } : {};
}

/**
 * Tailwind text-alignment class matching the language direction. Useful for
 * blocks (lesson prose, transcripts) that should start-align to the script's
 * natural side. Returns '' for LTR so nothing changes for existing languages.
 */
export function rtlTextAlign(lang: string): string {
  return isRTLLanguage(lang) ? 'text-right' : '';
}
