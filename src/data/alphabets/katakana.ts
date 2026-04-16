import type { Character } from './hiragana';

export const KATAKANA: Character[] = [
  // Vowels
  { char: 'ア', romanji: 'a', group: 'Vowels', strokes: 2 },
  { char: 'イ', romanji: 'i', group: 'Vowels', strokes: 2 },
  { char: 'ウ', romanji: 'u', group: 'Vowels', strokes: 3 },
  { char: 'エ', romanji: 'e', group: 'Vowels', strokes: 3 },
  { char: 'オ', romanji: 'o', group: 'Vowels', strokes: 3 },
  // K-row
  { char: 'カ', romanji: 'ka', group: 'K-row', strokes: 2 },
  { char: 'キ', romanji: 'ki', group: 'K-row', strokes: 3 },
  { char: 'ク', romanji: 'ku', group: 'K-row', strokes: 2 },
  { char: 'ケ', romanji: 'ke', group: 'K-row', strokes: 3 },
  { char: 'コ', romanji: 'ko', group: 'K-row', strokes: 2 },
  // S-row
  { char: 'サ', romanji: 'sa', group: 'S-row', strokes: 3 },
  { char: 'シ', romanji: 'shi', group: 'S-row', strokes: 3 },
  { char: 'ス', romanji: 'su', group: 'S-row', strokes: 2 },
  { char: 'セ', romanji: 'se', group: 'S-row', strokes: 2 },
  { char: 'ソ', romanji: 'so', group: 'S-row', strokes: 2 },
  // T-row
  { char: 'タ', romanji: 'ta', group: 'T-row', strokes: 3 },
  { char: 'チ', romanji: 'chi', group: 'T-row', strokes: 3 },
  { char: 'ツ', romanji: 'tsu', group: 'T-row', strokes: 3 },
  { char: 'テ', romanji: 'te', group: 'T-row', strokes: 3 },
  { char: 'ト', romanji: 'to', group: 'T-row', strokes: 2 },
  // N-row
  { char: 'ナ', romanji: 'na', group: 'N-row', strokes: 2 },
  { char: 'ニ', romanji: 'ni', group: 'N-row', strokes: 2 },
  { char: 'ヌ', romanji: 'nu', group: 'N-row', strokes: 2 },
  { char: 'ネ', romanji: 'ne', group: 'N-row', strokes: 4 },
  { char: 'ノ', romanji: 'no', group: 'N-row', strokes: 1 },
  // H-row
  { char: 'ハ', romanji: 'ha', group: 'H-row', strokes: 2 },
  { char: 'ヒ', romanji: 'hi', group: 'H-row', strokes: 2 },
  { char: 'フ', romanji: 'fu', group: 'H-row', strokes: 1 },
  { char: 'ヘ', romanji: 'he', group: 'H-row', strokes: 1 },
  { char: 'ホ', romanji: 'ho', group: 'H-row', strokes: 4 },
  // M-row
  { char: 'マ', romanji: 'ma', group: 'M-row', strokes: 2 },
  { char: 'ミ', romanji: 'mi', group: 'M-row', strokes: 3 },
  { char: 'ム', romanji: 'mu', group: 'M-row', strokes: 2 },
  { char: 'メ', romanji: 'me', group: 'M-row', strokes: 2 },
  { char: 'モ', romanji: 'mo', group: 'M-row', strokes: 3 },
  // Y-row
  { char: 'ヤ', romanji: 'ya', group: 'Y-row', strokes: 2 },
  { char: 'ユ', romanji: 'yu', group: 'Y-row', strokes: 2 },
  { char: 'ヨ', romanji: 'yo', group: 'Y-row', strokes: 3 },
  // R-row
  { char: 'ラ', romanji: 'ra', group: 'R-row', strokes: 2 },
  { char: 'リ', romanji: 'ri', group: 'R-row', strokes: 2 },
  { char: 'ル', romanji: 'ru', group: 'R-row', strokes: 2 },
  { char: 'レ', romanji: 're', group: 'R-row', strokes: 1 },
  { char: 'ロ', romanji: 'ro', group: 'R-row', strokes: 3 },
  // W-row + N
  { char: 'ワ', romanji: 'wa', group: 'W-row', strokes: 2 },
  { char: 'ヲ', romanji: 'wo', group: 'W-row', strokes: 3 },
  { char: 'ン', romanji: 'n', group: 'W-row', strokes: 2 },
];
