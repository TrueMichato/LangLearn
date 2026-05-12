import type { Character } from './hiragana';

// Spanish Diacritics & Special Characters
// Spanish uses the Latin alphabet plus the acute accent (´), the diaeresis (¨),
// the tilde on ñ, and the inverted opening punctuation ¿ ¡.

export const ES_ACCENTED_VOWELS: Character[] = [
  // Acute accent (tilde) — marks the stressed syllable; does not change vowel quality the way Portuguese accents do.
  { char: 'á', romanji: 'ah (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: 'Stressed "a", as in "está" (is), "café" stress marker.' },
  { char: 'é', romanji: 'eh (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: 'Stressed "e", as in "café" (coffee), "él" (he).' },
  { char: 'í', romanji: 'ee (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: 'Stressed "i", as in "sí" (yes), "país" (country).' },
  { char: 'ó', romanji: 'oh (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: 'Stressed "o", as in "adiós" (goodbye), "canción" (song).' },
  { char: 'ú', romanji: 'oo (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: 'Stressed "u", as in "tú" (you), "menú" (menu).' },

  // Diaeresis (diéresis) — only on ü, only after g, to force the u to be pronounced.
  { char: 'ü', romanji: 'wuh', group: 'Diaeresis (Diéresis)', strokes: 1, meaning: 'Diaeresis: forces "u" to sound after g. As in "pingüino" (penguin), "vergüenza" (shame).' },
];

export const ES_SPECIAL_LETTERS: Character[] = [
  // The signature letter of Spanish
  { char: 'ñ', romanji: 'ny', group: 'Eñe (Ñ)', strokes: 2, meaning: 'Palatal nasal "ny" sound, as in "año" (year), "niño" (child), "España" (Spain). Distinct letter, not a variant of n.' },
  { char: 'Ñ', romanji: 'NY', group: 'Eñe (Ñ)', strokes: 2, meaning: 'Uppercase ñ — "Ñ" follows N in the Spanish alphabet.' },

  // Inverted opening punctuation
  { char: '¿', romanji: 'opening question', group: 'Inverted Punctuation', strokes: 1, meaning: 'Opens every question. Required, not optional: "¿Cómo estás?"' },
  { char: '¡', romanji: 'opening exclam', group: 'Inverted Punctuation', strokes: 1, meaning: 'Opens every exclamation. Required: "¡Hola!" "¡Qué bueno!"' },

  // Digraphs (no longer treated as separate letters since 2010, but worth practicing)
  { char: 'll', romanji: 'y / zh', group: 'Digraphs', strokes: 0, meaning: 'Double-L. Most dialects (yeísmo) pronounce it like "y" in "yes": "lluvia" (rain), "calle" (street). Argentina/Uruguay say "zh".' },
  { char: 'rr', romanji: 'rolled R', group: 'Digraphs', strokes: 0, meaning: 'Trilled/rolled R: "perro" (dog) vs "pero" (but). Critical contrast — practice it!' },
  { char: 'ch', romanji: 'ch', group: 'Digraphs', strokes: 0, meaning: 'Like English "ch" in "chair": "chico" (boy), "noche" (night).' },

  // Letters with notable pronunciation
  { char: 'c', romanji: 'k / s', group: 'Letters with Variant Sounds', strokes: 0, meaning: '"K" before a/o/u (casa, copa, cuna); "s" (or "th" in Spain) before e/i (cero, cine).' },
  { char: 'g', romanji: 'g / kh', group: 'Letters with Variant Sounds', strokes: 0, meaning: 'Hard "g" before a/o/u (gato, gota, gusto); harsh "h"/"kh" before e/i (gente, gigante).' },
  { char: 'j', romanji: 'kh', group: 'Letters with Variant Sounds', strokes: 0, meaning: 'Harsh "h"/"kh" sound: "jugar" (to play), "trabajo" (work). Same sound as g before e/i.' },
  { char: 'h', romanji: 'silent', group: 'Letters with Variant Sounds', strokes: 0, meaning: 'Always silent: "hola" sounds like "ola", "hablar" like "ablar".' },
  { char: 'z', romanji: 's / th', group: 'Letters with Variant Sounds', strokes: 0, meaning: '"S" in Latin America (seseo), "th" in most of Spain (ceceo/distinción): "zapato" (shoe).' },
];

export const ES_UPPERCASE_ACCENTS: Character[] = [
  { char: 'Á', romanji: 'ah (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of á — "Ángel" (angel), "África" (Africa).' },
  { char: 'É', romanji: 'eh (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of é — "Él" (he), "Éxito" (success).' },
  { char: 'Í', romanji: 'ee (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of í — "Índice" (index).' },
  { char: 'Ó', romanji: 'oh (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of ó — "Óscar" (Oscar).' },
  { char: 'Ú', romanji: 'oo (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of ú — "Última" (last).' },
  { char: 'Ü', romanji: 'wuh', group: 'Uppercase Diaeresis', strokes: 1, meaning: 'Uppercase of ü — rare; "BILINGÜE".' },
];
