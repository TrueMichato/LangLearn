export interface LyricLine {
  original: string;
  reading: string;
  translation: string;
}

export interface SongVocab {
  word: string;
  reading: string;
  meaning: string;
}

export interface Song {
  id: string;
  title: string;
  titleRomanized: string;
  artist: string;
  context: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lines: LyricLine[];
  vocab: SongVocab[];
}
