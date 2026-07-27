import type { Character } from './hiragana';

// Romanian Diacritics & Special Characters
// Romanian uses the Latin alphabet (31 letters) plus five letters with
// diacritics: ă, â, î, ș, ț. Mastering them is essential for correct spelling
// and pronunciation — they represent sounds that plain Latin letters do not.

export const RO_DIACRITICS: Character[] = [
  { char: 'ă', romanji: 'uh (schwa)', group: 'Diacritics (Litere cu Semne)', strokes: 2, pronunciation: 'ă', meaning: 'A-breve. Schwa /ə/, like the "a" in "about". As in "măr" (apple), "casă" (house).' },
  { char: 'â', romanji: 'ih (central)', group: 'Diacritics (Litere cu Semne)', strokes: 2, pronunciation: 'â', meaning: 'A-circumflex. Close central vowel /ɨ/. Same sound as î, but used inside words. As in "român" (Romanian), "când" (when).' },
  { char: 'î', romanji: 'ih (central)', group: 'Diacritics (Litere cu Semne)', strokes: 2, pronunciation: 'î', meaning: 'I-circumflex. Same /ɨ/ sound as â, but used at the start or end of a word. As in "în" (in), "începe" (begins).' },
  { char: 'ș', romanji: 'sh', group: 'Diacritics (Litere cu Semne)', strokes: 2, pronunciation: 'ș', meaning: 'S-comma. The "sh" sound /ʃ/. As in "și" (and), "ușă" (door), "școală" (school).' },
  { char: 'ț', romanji: 'ts', group: 'Diacritics (Litere cu Semne)', strokes: 2, pronunciation: 'ț', meaning: 'T-comma. The "ts" sound /ts/, like "ts" in "cats". As in "țară" (country), "preț" (price).' },
];

export const RO_UPPERCASE_DIACRITICS: Character[] = [
  { char: 'Ă', romanji: 'uh (schwa)', group: 'Uppercase Diacritics', strokes: 2, pronunciation: 'ă', meaning: 'Uppercase of ă — "Ăsta" (this one).' },
  { char: 'Â', romanji: 'ih (central)', group: 'Uppercase Diacritics', strokes: 2, pronunciation: 'â', meaning: 'Uppercase of â — rare mid-word only, e.g. in names.' },
  { char: 'Î', romanji: 'ih (central)', group: 'Uppercase Diacritics', strokes: 2, pronunciation: 'î', meaning: 'Uppercase of î — "În" (in), "Împreună" (together).' },
  { char: 'Ș', romanji: 'sh', group: 'Uppercase Diacritics', strokes: 2, pronunciation: 'ș', meaning: 'Uppercase of ș — "Școala" (the school).' },
  { char: 'Ț', romanji: 'ts', group: 'Uppercase Diacritics', strokes: 2, pronunciation: 'ț', meaning: 'Uppercase of ț — "Țara" (the country).' },
];

// Key letter combinations whose pronunciation is not obvious from the letters.
// These are the single most common pronunciation traps for Romanian learners.
export const RO_COMBINATIONS: Character[] = [
  { char: 'ce', romanji: 'cheh', group: 'Soft C & G', strokes: 2, pronunciation: 'ce', meaning: 'Before e/i, "c" = "ch" as in "cheese". "ce" = "cheh". As in "cer" (sky), "ce" (what).' },
  { char: 'ci', romanji: 'chee', group: 'Soft C & G', strokes: 2, pronunciation: 'ci', meaning: '"ci" = "chee". As in "cine" (who), "aici" (here).' },
  { char: 'ge', romanji: 'jeh', group: 'Soft C & G', strokes: 2, pronunciation: 'ge', meaning: 'Before e/i, "g" = "j" as in "gem". "ge" = "jeh". As in "ger" (frost), "minge" (ball).' },
  { char: 'gi', romanji: 'jee', group: 'Soft C & G', strokes: 2, pronunciation: 'gi', meaning: '"gi" = "jee". As in "gimnastică" (gymnastics).' },
  { char: 'che', romanji: 'keh', group: 'Hard C & G (with H)', strokes: 3, pronunciation: 'che', meaning: '"ch" before e/i = hard "k". "che" = "keh". As in "cheie" (key), "ureche" (ear).' },
  { char: 'chi', romanji: 'kee', group: 'Hard C & G (with H)', strokes: 3, pronunciation: 'chi', meaning: '"chi" = "kee". As in "chibrit" (match), "chip" (face).' },
  { char: 'ghe', romanji: 'gheh', group: 'Hard C & G (with H)', strokes: 3, pronunciation: 'ghe', meaning: '"gh" before e/i = hard "g" as in "get". "ghe" = "gheh". As in "ghete" (boots).' },
  { char: 'ghi', romanji: 'ghee', group: 'Hard C & G (with H)', strokes: 3, pronunciation: 'ghi', meaning: '"ghi" = "ghee". As in "ghinion" (bad luck), "unghi" (angle).' },
];
