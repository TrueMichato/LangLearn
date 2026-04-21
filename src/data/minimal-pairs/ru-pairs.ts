import type { MinimalPair } from './ja-pairs';

export const ruMinimalPairs: MinimalPair[] = [
  // Hard vs soft consonants
  { id: 'ru-1', wordA: 'мат', wordB: 'мать', readingA: 'mat', readingB: 'mat\'', meaningA: 'mat/profanity', meaningB: 'mother', hint: 'hard т vs soft ть', category: 'hard-soft' },
  { id: 'ru-2', wordA: 'кон', wordB: 'конь', readingA: 'kon', readingB: 'kon\'', meaningA: 'round (of a game)', meaningB: 'horse', hint: 'hard н vs soft нь', category: 'hard-soft' },
  { id: 'ru-3', wordA: 'брат', wordB: 'брать', readingA: 'brat', readingB: 'brat\'', meaningA: 'brother', meaningB: 'to take', hint: 'hard т vs soft ть', category: 'hard-soft' },
  { id: 'ru-4', wordA: 'мол', wordB: 'моль', readingA: 'mol', readingB: 'mol\'', meaningA: 'pier', meaningB: 'moth', hint: 'hard л vs soft ль', category: 'hard-soft' },
  { id: 'ru-5', wordA: 'угол', wordB: 'уголь', readingA: 'ugol', readingB: 'ugol\'', meaningA: 'corner', meaningB: 'coal', hint: 'hard л vs soft ль', category: 'hard-soft' },
  { id: 'ru-6', wordA: 'был', wordB: 'быль', readingA: 'byl', readingB: 'byl\'', meaningA: 'was (m)', meaningB: 'true story', hint: 'hard л vs soft ль', category: 'hard-soft' },
  { id: 'ru-7', wordA: 'вес', wordB: 'весь', readingA: 'ves', readingB: 'ves\'', meaningA: 'weight', meaningB: 'all/entire', hint: 'hard с vs soft сь', category: 'hard-soft' },
  { id: 'ru-8', wordA: 'полка', wordB: 'полька', readingA: 'polka', readingB: 'pol\'ka', meaningA: 'shelf', meaningB: 'polka/Polish woman', hint: 'hard л vs soft ль', category: 'hard-soft' },

  // Voiced vs voiceless
  { id: 'ru-9', wordA: 'том', wordB: 'дом', readingA: 'tom', readingB: 'dom', meaningA: 'volume (book)', meaningB: 'house', hint: 'т vs д', category: 'voicing' },
  { id: 'ru-10', wordA: 'кот', wordB: 'год', readingA: 'kot', readingB: 'god', meaningA: 'cat', meaningB: 'year', hint: 'к vs г', category: 'voicing' },
  { id: 'ru-11', wordA: 'почка', wordB: 'бочка', readingA: 'pochka', readingB: 'bochka', meaningA: 'kidney/bud', meaningB: 'barrel', hint: 'п vs б', category: 'voicing' },
  { id: 'ru-12', wordA: 'шар', wordB: 'жар', readingA: 'shar', readingB: 'zhar', meaningA: 'ball/sphere', meaningB: 'heat/fever', hint: 'ш vs ж', category: 'voicing' },
  { id: 'ru-13', wordA: 'суп', wordB: 'зуб', readingA: 'sup', readingB: 'zub', meaningA: 'soup', meaningB: 'tooth', hint: 'с vs з', category: 'voicing' },
  { id: 'ru-14', wordA: 'колос', wordB: 'голос', readingA: 'kolos', readingB: 'golos', meaningA: 'ear (of grain)', meaningB: 'voice', hint: 'к vs г', category: 'voicing' },

  // Sibilant contrasts (ш/щ, с/ш, з/ж)
  { id: 'ru-15', wordA: 'шут', wordB: 'щит', readingA: 'shut', readingB: 'shchit', meaningA: 'jester', meaningB: 'shield', hint: 'ш vs щ', category: 'sibilants' },
  { id: 'ru-16', wordA: 'шёл', wordB: 'щёл', readingA: 'shyol', readingB: 'shchyol', meaningA: 'walked', meaningB: '(щёлк – click)', hint: 'ш vs щ', category: 'sibilants' },
  { id: 'ru-17', wordA: 'шить', wordB: 'щить', readingA: 'shit\'', readingB: 'shchit\'', meaningA: 'to sew', meaningB: '(щитить – shield)', hint: 'ш vs щ', category: 'sibilants' },
  { id: 'ru-18', wordA: 'сок', wordB: 'шок', readingA: 'sok', readingB: 'shok', meaningA: 'juice', meaningB: 'shock', hint: 'с vs ш', category: 'sibilants' },
  { id: 'ru-19', wordA: 'сон', wordB: 'шон', readingA: 'son', readingB: 'shon', meaningA: 'dream', meaningB: '(name)', hint: 'с vs ш', category: 'sibilants' },

  // Stress-dependent vowel reduction (о/а confusion)
  { id: 'ru-20', wordA: 'молоко', wordB: 'малако', readingA: 'molokó', readingB: 'malakó', meaningA: 'milk (correct)', meaningB: 'milk (spoken)', hint: 'о reduces to а when unstressed', category: 'stress' },
  { id: 'ru-21', wordA: 'хорошо', wordB: 'харашо', readingA: 'khoroshó', readingB: 'kharashó', meaningA: 'good (correct)', meaningB: 'good (spoken)', hint: 'о reduces to а', category: 'stress' },
  { id: 'ru-22', wordA: 'замок', wordB: 'замок', readingA: 'zámok', readingB: 'zamók', meaningA: 'castle', meaningB: 'lock', hint: 'stress changes meaning', category: 'stress' },
  { id: 'ru-23', wordA: 'мука', wordB: 'мука', readingA: 'múka', readingB: 'muká', meaningA: 'torment', meaningB: 'flour', hint: 'stress changes meaning', category: 'stress' },
  { id: 'ru-24', wordA: 'белок', wordB: 'белок', readingA: 'bélok', readingB: 'belók', meaningA: 'protein/white', meaningB: 'squirrel (gen. pl)', hint: 'stress changes meaning', category: 'stress' },

  // Similar consonant clusters
  { id: 'ru-25', wordA: 'плот', wordB: 'плод', readingA: 'plot', readingB: 'plod', meaningA: 'raft', meaningB: 'fruit/fetus', hint: 'т vs д (word-final)', category: 'consonant-clusters' },
  { id: 'ru-26', wordA: 'рот', wordB: 'род', readingA: 'rot', readingB: 'rod', meaningA: 'mouth', meaningB: 'gender/kind', hint: 'т vs д', category: 'consonant-clusters' },
  { id: 'ru-27', wordA: 'кость', wordB: 'гость', readingA: 'kost\'', readingB: 'gost\'', meaningA: 'bone', meaningB: 'guest', hint: 'к vs г', category: 'consonant-clusters' },
  { id: 'ru-28', wordA: 'рис', wordB: 'риз', readingA: 'ris', readingB: 'riz', meaningA: 'rice', meaningB: 'vestment (gen pl)', hint: 'с vs з', category: 'consonant-clusters' },
  { id: 'ru-29', wordA: 'пара', wordB: 'бара', readingA: 'para', readingB: 'bara', meaningA: 'pair', meaningB: 'bar (gen)', hint: 'п vs б', category: 'consonant-clusters' },
  { id: 'ru-30', wordA: 'горка', wordB: 'корка', readingA: 'gorka', readingB: 'korka', meaningA: 'hill', meaningB: 'crust', hint: 'г vs к', category: 'consonant-clusters' },
];
