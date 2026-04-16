import type { Character } from './hiragana';

export const KANJI: Character[] = [
  // Numbers
  { char: '一', romanji: 'ichi', group: 'Numbers', strokes: 1 },
  { char: '二', romanji: 'ni', group: 'Numbers', strokes: 2 },
  { char: '三', romanji: 'san', group: 'Numbers', strokes: 3 },
  { char: '四', romanji: 'yon', group: 'Numbers', strokes: 5 },
  { char: '五', romanji: 'go', group: 'Numbers', strokes: 4 },
  { char: '六', romanji: 'roku', group: 'Numbers', strokes: 4 },
  { char: '七', romanji: 'nana', group: 'Numbers', strokes: 2 },
  { char: '八', romanji: 'hachi', group: 'Numbers', strokes: 2 },
  { char: '九', romanji: 'kyū', group: 'Numbers', strokes: 2 },
  { char: '十', romanji: 'jū', group: 'Numbers', strokes: 2 },

  // People
  { char: '人', romanji: 'hito', group: 'People', strokes: 2 },
  { char: '女', romanji: 'onna', group: 'People', strokes: 3 },
  { char: '男', romanji: 'otoko', group: 'People', strokes: 7 },
  { char: '子', romanji: 'ko', group: 'People', strokes: 3 },
  { char: '母', romanji: 'haha', group: 'People', strokes: 5 },
  { char: '父', romanji: 'chichi', group: 'People', strokes: 4 },

  // Nature
  { char: '山', romanji: 'yama', group: 'Nature', strokes: 3 },
  { char: '川', romanji: 'kawa', group: 'Nature', strokes: 3 },
  { char: '水', romanji: 'mizu', group: 'Nature', strokes: 4 },
  { char: '火', romanji: 'hi', group: 'Nature', strokes: 4 },
  { char: '木', romanji: 'ki', group: 'Nature', strokes: 4 },
  { char: '花', romanji: 'hana', group: 'Nature', strokes: 7 },

  // Time
  { char: '日', romanji: 'nichi', group: 'Time', strokes: 4 },
  { char: '月', romanji: 'tsuki', group: 'Time', strokes: 4 },
  { char: '年', romanji: 'nen', group: 'Time', strokes: 6 },
  { char: '時', romanji: 'toki', group: 'Time', strokes: 10 },
  { char: '先', romanji: 'saki', group: 'Time', strokes: 6 },
  { char: '今', romanji: 'ima', group: 'Time', strokes: 4 },
  { char: '週', romanji: 'shū', group: 'Time', strokes: 11 },

  // Body/Life
  { char: '目', romanji: 'me', group: 'Body/Life', strokes: 5 },
  { char: '口', romanji: 'kuchi', group: 'Body/Life', strokes: 3 },
  { char: '手', romanji: 'te', group: 'Body/Life', strokes: 4 },
  { char: '足', romanji: 'ashi', group: 'Body/Life', strokes: 7 },

  // Place
  { char: '国', romanji: 'kuni', group: 'Place', strokes: 8 },
  { char: '学', romanji: 'gaku', group: 'Place', strokes: 8 },
  { char: '校', romanji: 'kō', group: 'Place', strokes: 10 },
  { char: '店', romanji: 'mise', group: 'Place', strokes: 8 },
  { char: '駅', romanji: 'eki', group: 'Place', strokes: 14 },

  // Actions
  { char: '食', romanji: 'taberu', group: 'Actions', strokes: 9 },
  { char: '飲', romanji: 'nomu', group: 'Actions', strokes: 12 },
  { char: '見', romanji: 'miru', group: 'Actions', strokes: 7 },
  { char: '聞', romanji: 'kiku', group: 'Actions', strokes: 14 },
  { char: '読', romanji: 'yomu', group: 'Actions', strokes: 14 },
  { char: '書', romanji: 'kaku', group: 'Actions', strokes: 10 },
  { char: '行', romanji: 'iku', group: 'Actions', strokes: 6 },

  // Adjectives
  { char: '大', romanji: 'ōkii', group: 'Adjectives', strokes: 3 },
  { char: '小', romanji: 'chīsai', group: 'Adjectives', strokes: 3 },
  { char: '新', romanji: 'atarashii', group: 'Adjectives', strokes: 13 },
  { char: '高', romanji: 'takai', group: 'Adjectives', strokes: 10 },
  { char: '長', romanji: 'nagai', group: 'Adjectives', strokes: 8 },
];
