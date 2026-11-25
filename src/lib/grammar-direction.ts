import { rtlProps, type Direction } from './rtl';

// First letter picks the script, but Arabic-leading English prose stays LTR.
export function grammarDirection(text: string, language: string): { dir?: Direction } {
  const firstLetter = text.match(/\p{Letter}/u)?.[0];
  if (!firstLetter) return rtlProps(language);
  if (!/\p{Script=Arabic}/u.test(firstLetter)) return { dir: 'ltr' };
  if (language === 'ar') {
    // Ignore glosses and transliterations, including nested parentheses.
    let outside = text, previous;
    do {
      previous = outside;
      outside = outside.replace(/\([^()]*\)/g, ' ');
    } while (outside !== previous);
    const letters = outside.match(/\p{Letter}/gu) ?? [];
    const latin = letters.filter((letter) => /\p{Script=Latin}/u.test(letter)).length;
    if (latin > letters.filter((letter) => /\p{Script=Arabic}/u.test(letter)).length) return { dir: 'ltr' };
  }
  return { dir: 'rtl' };
}
