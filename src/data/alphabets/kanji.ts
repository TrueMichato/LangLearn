import type { Character } from './hiragana';

export const KANJI: Character[] = [
  // Numbers
  { char: '一', romanji: 'ichi', group: 'Numbers', strokes: 1, meaning: 'one' },
  { char: '二', romanji: 'ni', group: 'Numbers', strokes: 2, meaning: 'two' },
  { char: '三', romanji: 'san', group: 'Numbers', strokes: 3, meaning: 'three' },
  { char: '四', romanji: 'yon', group: 'Numbers', strokes: 5, meaning: 'four' },
  { char: '五', romanji: 'go', group: 'Numbers', strokes: 4, meaning: 'five' },
  { char: '六', romanji: 'roku', group: 'Numbers', strokes: 4, meaning: 'six' },
  { char: '七', romanji: 'nana', group: 'Numbers', strokes: 2, meaning: 'seven' },
  { char: '八', romanji: 'hachi', group: 'Numbers', strokes: 2, meaning: 'eight' },
  { char: '九', romanji: 'kyū', group: 'Numbers', strokes: 2, meaning: 'nine' },
  { char: '十', romanji: 'jū', group: 'Numbers', strokes: 2, meaning: 'ten' },

  // People
  { char: '人', romanji: 'hito', group: 'People', strokes: 2, meaning: 'person' },
  { char: '女', romanji: 'onna', group: 'People', strokes: 3, meaning: 'woman' },
  { char: '男', romanji: 'otoko', group: 'People', strokes: 7, meaning: 'man' },
  { char: '子', romanji: 'ko', group: 'People', strokes: 3, meaning: 'child' },
  { char: '母', romanji: 'haha', group: 'People', strokes: 5, meaning: 'mother' },
  { char: '父', romanji: 'chichi', group: 'People', strokes: 4, meaning: 'father' },

  // Nature
  { char: '山', romanji: 'yama', group: 'Nature', strokes: 3, meaning: 'mountain' },
  { char: '川', romanji: 'kawa', group: 'Nature', strokes: 3, meaning: 'river' },
  { char: '水', romanji: 'mizu', group: 'Nature', strokes: 4, meaning: 'water' },
  { char: '火', romanji: 'hi', group: 'Nature', strokes: 4, meaning: 'fire' },
  { char: '木', romanji: 'ki', group: 'Nature', strokes: 4, meaning: 'tree' },
  { char: '花', romanji: 'hana', group: 'Nature', strokes: 7, meaning: 'flower' },

  // Time
  { char: '日', romanji: 'nichi', group: 'Time', strokes: 4, meaning: 'day/sun' },
  { char: '月', romanji: 'tsuki', group: 'Time', strokes: 4, meaning: 'month/moon' },
  { char: '年', romanji: 'nen', group: 'Time', strokes: 6, meaning: 'year' },
  { char: '時', romanji: 'toki', group: 'Time', strokes: 10, meaning: 'time/hour' },
  { char: '先', romanji: 'saki', group: 'Time', strokes: 6, meaning: 'before/previous' },
  { char: '今', romanji: 'ima', group: 'Time', strokes: 4, meaning: 'now' },
  { char: '週', romanji: 'shū', group: 'Time', strokes: 11, meaning: 'week' },

  // Body/Life
  { char: '目', romanji: 'me', group: 'Body/Life', strokes: 5, meaning: 'eye' },
  { char: '口', romanji: 'kuchi', group: 'Body/Life', strokes: 3, meaning: 'mouth' },
  { char: '手', romanji: 'te', group: 'Body/Life', strokes: 4, meaning: 'hand' },
  { char: '足', romanji: 'ashi', group: 'Body/Life', strokes: 7, meaning: 'foot/leg' },

  // Place
  { char: '国', romanji: 'kuni', group: 'Place', strokes: 8, meaning: 'country' },
  { char: '学', romanji: 'gaku', group: 'Place', strokes: 8, meaning: 'study' },
  { char: '校', romanji: 'kō', group: 'Place', strokes: 10, meaning: 'school' },
  { char: '店', romanji: 'mise', group: 'Place', strokes: 8, meaning: 'shop' },
  { char: '駅', romanji: 'eki', group: 'Place', strokes: 14, meaning: 'station' },

  // Actions
  { char: '食', romanji: 'taberu', group: 'Actions', strokes: 9, meaning: 'eat' },
  { char: '飲', romanji: 'nomu', group: 'Actions', strokes: 12, meaning: 'drink' },
  { char: '見', romanji: 'miru', group: 'Actions', strokes: 7, meaning: 'see' },
  { char: '聞', romanji: 'kiku', group: 'Actions', strokes: 14, meaning: 'hear' },
  { char: '読', romanji: 'yomu', group: 'Actions', strokes: 14, meaning: 'read' },
  { char: '書', romanji: 'kaku', group: 'Actions', strokes: 10, meaning: 'write' },
  { char: '行', romanji: 'iku', group: 'Actions', strokes: 6, meaning: 'go' },

  // Adjectives
  { char: '大', romanji: 'ōkii', group: 'Adjectives', strokes: 3, meaning: 'big' },
  { char: '小', romanji: 'chīsai', group: 'Adjectives', strokes: 3, meaning: 'small' },
  { char: '新', romanji: 'atarashii', group: 'Adjectives', strokes: 13, meaning: 'new' },
  { char: '高', romanji: 'takai', group: 'Adjectives', strokes: 10, meaning: 'tall/expensive' },
  { char: '長', romanji: 'nagai', group: 'Adjectives', strokes: 8, meaning: 'long' },
];
