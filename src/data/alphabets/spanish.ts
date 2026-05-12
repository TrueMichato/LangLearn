import type { Character } from './hiragana';

// Spanish Diacritics & Special Characters
// Spanish uses the Latin alphabet plus the acute accent (´), the diaeresis (¨),
// the tilde on ñ, and the inverted opening punctuation ¿ ¡.

export const ES_ACCENTED_VOWELS: Character[] = [
  // Acute accent (tilde) — marks the stressed syllable; does not change vowel quality the way Portuguese accents do.
  { char: 'á', romanji: 'ah (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: '[a] Stressed "a", as in "está" (is), "café" stress marker. IPA: /a/ (same vowel as a, accent marks stress).' },
  { char: 'é', romanji: 'eh (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: '[e] Stressed "e", as in "café" (coffee), "él" (he). IPA: /e/ (same vowel as e, accent marks stress).' },
  { char: 'í', romanji: 'ee (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: '[i] Stressed "i", as in "sí" (yes), "país" (country). IPA: /i/ (same vowel as i, accent marks stress).' },
  { char: 'ó', romanji: 'oh (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: '[o] Stressed "o", as in "adiós" (goodbye), "canción" (song). IPA: /o/ (same vowel as o, accent marks stress).' },
  { char: 'ú', romanji: 'oo (stressed)', group: 'Acute Accent (Tilde)', strokes: 1, meaning: '[u] Stressed "u", as in "tú" (you), "menú" (menu). IPA: /u/ (same vowel as u, accent marks stress).' },

  // Diaeresis (diéresis) — only on ü, only after g, to force the u to be pronounced.
  { char: 'ü', romanji: 'wuh', group: 'Diaeresis (Diéresis)', strokes: 1, meaning: '[w] Diaeresis: forces "u" to sound after g. As in "pingüino" (penguin), "vergüenza" (shame). IPA: /w/ in -güe-/-güi-.' },
];

export const ES_SPECIAL_LETTERS: Character[] = [
  // The signature letter of Spanish
  { char: 'ñ', romanji: 'ny', group: 'Eñe (Ñ)', strokes: 2, meaning: '[ɲ] Palatal nasal "ny" sound, as in "año" (year), "niño" (child), "España" (Spain). Distinct letter, not a variant of n. IPA: /ɲ/ (palatal nasal).' },
  { char: 'Ñ', romanji: 'NY', group: 'Eñe (Ñ)', strokes: 2, meaning: '[ɲ] Uppercase ñ — "Ñ" follows N in the Spanish alphabet. IPA: /ɲ/ (palatal nasal).' },

  // Inverted opening punctuation
  { char: '¿', romanji: 'opening question', group: 'Inverted Punctuation', strokes: 1, meaning: '[punctuation] Opens every question. Required, not optional: "¿Cómo estás?" No phonetic value.' },
  { char: '¡', romanji: 'opening exclam', group: 'Inverted Punctuation', strokes: 1, meaning: '[punctuation] Opens every exclamation. Required: "¡Hola!" "¡Qué bueno!" No phonetic value.' },

  // Digraphs (no longer treated as separate letters since 2010, but worth practicing)
  { char: 'll', romanji: 'y / zh', group: 'Digraphs', strokes: 0, meaning: '[ʝ ~ ʎ] Double-L. Most dialects (yeísmo) pronounce it like "y" in "yes": "lluvia" (rain), "calle" (street). Argentina/Uruguay say "zh". IPA: /ʝ/ (yeísmo, LatAm) or /ʎ/ (conservative Castilian).' },
  { char: 'rr', romanji: 'rolled R', group: 'Digraphs', strokes: 0, meaning: '[r] Trilled/rolled R: "perro" (dog) vs "pero" (but). Critical contrast — practice it! IPA: /r/ (alveolar trill).' },
  { char: 'ch', romanji: 'ch', group: 'Digraphs', strokes: 0, meaning: '[tʃ] Like English "ch" in "chair": "chico" (boy), "noche" (night). IPA: /tʃ/ (voiceless postalveolar affricate).' },

  // Letters with notable pronunciation
  { char: 'c', romanji: 'k / s', group: 'Letters with Variant Sounds', strokes: 0, meaning: '[k / s (LatAm) / θ (Spain)] "K" before a/o/u (casa, copa, cuna); "s" (or "th" in Spain) before e/i (cero, cine). IPA: /k/ before a/o/u; /s/ (seseo, LatAm) or /θ/ (Castilian) before e/i.' },
  { char: 'g', romanji: 'g / kh', group: 'Letters with Variant Sounds', strokes: 0, meaning: '[ɡ / x] Hard "g" before a/o/u (gato, gota, gusto); harsh "h"/"kh" before e/i (gente, gigante). IPA: /ɡ/ before a/o/u; /x/ before e/i.' },
  { char: 'j', romanji: 'kh', group: 'Letters with Variant Sounds', strokes: 0, meaning: '[x] Harsh "h"/"kh" sound: "jugar" (to play), "trabajo" (work). Same sound as g before e/i. IPA: /x/ (voiceless velar fricative).' },
  { char: 'h', romanji: 'silent', group: 'Letters with Variant Sounds', strokes: 0, meaning: '[∅] Always silent: "hola" sounds like "ola", "hablar" like "ablar". IPA: ∅ (no phoneme).' },
  { char: 'z', romanji: 's / th', group: 'Letters with Variant Sounds', strokes: 0, meaning: '[s / θ] "S" in Latin America (seseo), "th" in most of Spain (ceceo/distinción): "zapato" (shoe). IPA: /s/ (seseo, LatAm) or /θ/ (Castilian).' },
];

export const ES_UPPERCASE_ACCENTS: Character[] = [
  { char: 'Á', romanji: 'ah (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: '[a] Uppercase of á — "Ángel" (angel), "África" (Africa). IPA: /a/ (accent marks stress).' },
  { char: 'É', romanji: 'eh (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: '[e] Uppercase of é — "Él" (he), "Éxito" (success). IPA: /e/ (accent marks stress).' },
  { char: 'Í', romanji: 'ee (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: '[i] Uppercase of í — "Índice" (index). IPA: /i/ (accent marks stress).' },
  { char: 'Ó', romanji: 'oh (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: '[o] Uppercase of ó — "Óscar" (Oscar). IPA: /o/ (accent marks stress).' },
  { char: 'Ú', romanji: 'oo (stressed)', group: 'Uppercase Acute', strokes: 1, meaning: '[u] Uppercase of ú — "Última" (last). IPA: /u/ (accent marks stress).' },
  { char: 'Ü', romanji: 'wuh', group: 'Uppercase Diaeresis', strokes: 1, meaning: '[w] Uppercase of ü — rare; "BILINGÜE". IPA: /w/ in -güe-/-güi-.' },
];
