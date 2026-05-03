import type { Character } from './hiragana';

// Portuguese Diacritics & Special Characters
// Portuguese uses the Latin alphabet with several accent marks that change
// vowel pronunciation and one special consonant (ç). These are essential
// for correct spelling and pronunciation.

export const PT_ACCENTED_VOWELS: Character[] = [
  // Acute accent (acento agudo) — open vowel sound
  { char: 'á', romanji: 'ah (open)', group: 'Acute Accent (Acento Agudo)', strokes: 1, meaning: 'Open "a" sound, as in "café". Stressed syllable marker.' },
  { char: 'é', romanji: 'eh (open)', group: 'Acute Accent (Acento Agudo)', strokes: 1, meaning: 'Open "e" sound, as in "café". Distinct from closed ê.' },
  { char: 'í', romanji: 'ee', group: 'Acute Accent (Acento Agudo)', strokes: 1, meaning: 'Stressed "i" sound, as in "saída" (exit).' },
  { char: 'ó', romanji: 'aw (open)', group: 'Acute Accent (Acento Agudo)', strokes: 1, meaning: 'Open "o" sound, as in "avó" (grandmother). Distinct from closed ô.' },
  { char: 'ú', romanji: 'oo', group: 'Acute Accent (Acento Agudo)', strokes: 1, meaning: 'Stressed "u" sound, as in "saúde" (health).' },

  // Circumflex (acento circunflexo) — closed vowel sound
  { char: 'â', romanji: 'ah (closed)', group: 'Circumflex (Acento Circunflexo)', strokes: 1, meaning: 'Closed "a" sound, as in "câmera". More nasal than á.' },
  { char: 'ê', romanji: 'ay (closed)', group: 'Circumflex (Acento Circunflexo)', strokes: 1, meaning: 'Closed "e" sound, as in "você" (you). Like "ay" in "say".' },
  { char: 'ô', romanji: 'oh (closed)', group: 'Circumflex (Acento Circunflexo)', strokes: 1, meaning: 'Closed "o" sound, as in "avô" (grandfather). Like "oh".' },

  // Tilde (til) — nasal vowels
  { char: 'ã', romanji: 'ahn (nasal)', group: 'Tilde (Til) — Nasal', strokes: 1, meaning: 'Nasal "a", as in "pão" (bread), "mãe" (mother). Key Portuguese sound.' },
  { char: 'õ', romanji: 'ohn (nasal)', group: 'Tilde (Til) — Nasal', strokes: 1, meaning: 'Nasal "o", as in "ações" (actions), "põe" (puts). Unique to Portuguese.' },

  // Grave accent (acento grave) — used for crasis (à = a + a)
  { char: 'à', romanji: 'ah (crasis)', group: 'Grave Accent (Crase)', strokes: 1, meaning: 'Crasis: contraction of "a" (preposition) + "a" (article). As in "Vou à escola".' },

  // Cedilla (cedilha)
  { char: 'ç', romanji: 'ss', group: 'Cedilla (Cedilha)', strokes: 1, meaning: 'Soft "c" before a/o/u. "ç" = "ss" sound. As in "coração" (heart), "açúcar" (sugar).' },
];

export const PT_UPPERCASE_ACCENTS: Character[] = [
  { char: 'Á', romanji: 'ah (open)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of á — "Água" (water).' },
  { char: 'É', romanji: 'eh (open)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of é — "É" (is).' },
  { char: 'Í', romanji: 'ee', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of í — "Índia" (India).' },
  { char: 'Ó', romanji: 'aw (open)', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of ó — "Ótimo" (great).' },
  { char: 'Ú', romanji: 'oo', group: 'Uppercase Acute', strokes: 1, meaning: 'Uppercase of ú — "Último" (last).' },
  { char: 'Â', romanji: 'ah (closed)', group: 'Uppercase Circumflex', strokes: 1, meaning: 'Uppercase of â — "Ângulo" (angle).' },
  { char: 'Ê', romanji: 'ay (closed)', group: 'Uppercase Circumflex', strokes: 1, meaning: 'Uppercase of ê — "Êxito" (success).' },
  { char: 'Ô', romanji: 'oh (closed)', group: 'Uppercase Circumflex', strokes: 1, meaning: 'Uppercase of ô — "Ônibus" (bus, BR).' },
  { char: 'Ã', romanji: 'ahn (nasal)', group: 'Uppercase Nasal', strokes: 1, meaning: 'Uppercase of ã — "Ação" (action).' },
  { char: 'Õ', romanji: 'ohn (nasal)', group: 'Uppercase Nasal', strokes: 1, meaning: 'Uppercase of õ — "Õ" (rare standalone).' },
  { char: 'À', romanji: 'ah (crasis)', group: 'Uppercase Crase', strokes: 1, meaning: 'Uppercase crasis — rare, only at sentence start.' },
  { char: 'Ç', romanji: 'ss', group: 'Uppercase Cedilla', strokes: 1, meaning: 'Uppercase of ç — "Ço" never starts a native word; used in names like "Çağla".' },
];
