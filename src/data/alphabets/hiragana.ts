export interface Character {
  char: string;
  romanji: string;
  group: string;
  strokes: number;
}

export const HIRAGANA: Character[] = [
  // Vowels
  { char: 'あ', romanji: 'a', group: 'Vowels', strokes: 3 },
  { char: 'い', romanji: 'i', group: 'Vowels', strokes: 2 },
  { char: 'う', romanji: 'u', group: 'Vowels', strokes: 2 },
  { char: 'え', romanji: 'e', group: 'Vowels', strokes: 2 },
  { char: 'お', romanji: 'o', group: 'Vowels', strokes: 3 },
  // K-row
  { char: 'か', romanji: 'ka', group: 'K-row', strokes: 3 },
  { char: 'き', romanji: 'ki', group: 'K-row', strokes: 4 },
  { char: 'く', romanji: 'ku', group: 'K-row', strokes: 1 },
  { char: 'け', romanji: 'ke', group: 'K-row', strokes: 3 },
  { char: 'こ', romanji: 'ko', group: 'K-row', strokes: 2 },
  // S-row
  { char: 'さ', romanji: 'sa', group: 'S-row', strokes: 3 },
  { char: 'し', romanji: 'shi', group: 'S-row', strokes: 1 },
  { char: 'す', romanji: 'su', group: 'S-row', strokes: 2 },
  { char: 'せ', romanji: 'se', group: 'S-row', strokes: 3 },
  { char: 'そ', romanji: 'so', group: 'S-row', strokes: 1 },
  // T-row
  { char: 'た', romanji: 'ta', group: 'T-row', strokes: 4 },
  { char: 'ち', romanji: 'chi', group: 'T-row', strokes: 2 },
  { char: 'つ', romanji: 'tsu', group: 'T-row', strokes: 1 },
  { char: 'て', romanji: 'te', group: 'T-row', strokes: 1 },
  { char: 'と', romanji: 'to', group: 'T-row', strokes: 2 },
  // N-row
  { char: 'な', romanji: 'na', group: 'N-row', strokes: 4 },
  { char: 'に', romanji: 'ni', group: 'N-row', strokes: 3 },
  { char: 'ぬ', romanji: 'nu', group: 'N-row', strokes: 2 },
  { char: 'ね', romanji: 'ne', group: 'N-row', strokes: 2 },
  { char: 'の', romanji: 'no', group: 'N-row', strokes: 1 },
  // H-row
  { char: 'は', romanji: 'ha', group: 'H-row', strokes: 3 },
  { char: 'ひ', romanji: 'hi', group: 'H-row', strokes: 1 },
  { char: 'ふ', romanji: 'fu', group: 'H-row', strokes: 4 },
  { char: 'へ', romanji: 'he', group: 'H-row', strokes: 1 },
  { char: 'ほ', romanji: 'ho', group: 'H-row', strokes: 4 },
  // M-row
  { char: 'ま', romanji: 'ma', group: 'M-row', strokes: 3 },
  { char: 'み', romanji: 'mi', group: 'M-row', strokes: 2 },
  { char: 'む', romanji: 'mu', group: 'M-row', strokes: 3 },
  { char: 'め', romanji: 'me', group: 'M-row', strokes: 2 },
  { char: 'も', romanji: 'mo', group: 'M-row', strokes: 3 },
  // Y-row
  { char: 'や', romanji: 'ya', group: 'Y-row', strokes: 3 },
  { char: 'ゆ', romanji: 'yu', group: 'Y-row', strokes: 2 },
  { char: 'よ', romanji: 'yo', group: 'Y-row', strokes: 2 },
  // R-row
  { char: 'ら', romanji: 'ra', group: 'R-row', strokes: 2 },
  { char: 'り', romanji: 'ri', group: 'R-row', strokes: 2 },
  { char: 'る', romanji: 'ru', group: 'R-row', strokes: 1 },
  { char: 'れ', romanji: 're', group: 'R-row', strokes: 2 },
  { char: 'ろ', romanji: 'ro', group: 'R-row', strokes: 1 },
  // W-row + N
  { char: 'わ', romanji: 'wa', group: 'W-row', strokes: 2 },
  { char: 'を', romanji: 'wo', group: 'W-row', strokes: 3 },
  { char: 'ん', romanji: 'n', group: 'W-row', strokes: 1 },
];
