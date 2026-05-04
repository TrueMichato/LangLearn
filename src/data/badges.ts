export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'xp' | 'streak' | 'reviews' | 'vocabulary' | 'lessons' | 'kanji' | 'letters-ja' | 'letters-ru' | 'daily-challenge' | 'reading';
  condition: {
    type: 'xp' | 'streak' | 'reviews' | 'words' | 'lessons' | 'kanji' | 'letters-ja' | 'letters-ru' | 'challenges' | 'texts';
    threshold: number;
  };
}

export const BADGES: BadgeDefinition[] = [
  // XP Milestones
  { id: 'xp-100', name: 'First Steps', description: 'Earn 100 XP', icon: '🌱', category: 'xp', condition: { type: 'xp', threshold: 100 } },
  { id: 'xp-500', name: 'Getting Serious', description: 'Earn 500 XP', icon: '🌿', category: 'xp', condition: { type: 'xp', threshold: 500 } },
  { id: 'xp-1000', name: 'Dedicated Learner', description: 'Earn 1,000 XP', icon: '🌳', category: 'xp', condition: { type: 'xp', threshold: 1000 } },
  { id: 'xp-2500', name: 'Rising Star', description: 'Earn 2,500 XP', icon: '⭐', category: 'xp', condition: { type: 'xp', threshold: 2500 } },
  { id: 'xp-5000', name: 'Language Enthusiast', description: 'Earn 5,000 XP', icon: '🏔️', category: 'xp', condition: { type: 'xp', threshold: 5000 } },
  { id: 'xp-10000', name: 'Language Master', description: 'Earn 10,000 XP', icon: '🏆', category: 'xp', condition: { type: 'xp', threshold: 10000 } },
  { id: 'xp-25000', name: 'Polyglot', description: 'Earn 25,000 XP', icon: '🌍', category: 'xp', condition: { type: 'xp', threshold: 25000 } },
  { id: 'xp-50000', name: 'Language Legend', description: 'Earn 50,000 XP', icon: '🐉', category: 'xp', condition: { type: 'xp', threshold: 50000 } },

  // Streak Badges
  { id: 'streak-3', name: "Three's a Charm", description: '3-day streak', icon: '⚡', category: 'streak', condition: { type: 'streak', threshold: 3 } },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streak', condition: { type: 'streak', threshold: 7 } },
  { id: 'streak-14', name: 'Fortnight Force', description: '14-day streak', icon: '✨', category: 'streak', condition: { type: 'streak', threshold: 14 } },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day streak', icon: '💎', category: 'streak', condition: { type: 'streak', threshold: 30 } },
  { id: 'streak-60', name: 'Two-Month Titan', description: '60-day streak', icon: '🛡️', category: 'streak', condition: { type: 'streak', threshold: 60 } },
  { id: 'streak-100', name: 'Century Club', description: '100-day streak', icon: '👑', category: 'streak', condition: { type: 'streak', threshold: 100 } },
  { id: 'streak-365', name: 'Year of Dedication', description: '365-day streak', icon: '🎆', category: 'streak', condition: { type: 'streak', threshold: 365 } },

  // Review Badges
  { id: 'reviews-10', name: 'First Review', description: 'Review 10 cards', icon: '📝', category: 'reviews', condition: { type: 'reviews', threshold: 10 } },
  { id: 'reviews-50', name: 'Getting the Hang of It', description: 'Review 50 cards', icon: '📋', category: 'reviews', condition: { type: 'reviews', threshold: 50 } },
  { id: 'reviews-100', name: 'Card Crusher', description: 'Review 100 cards', icon: '🃏', category: 'reviews', condition: { type: 'reviews', threshold: 100 } },
  { id: 'reviews-500', name: 'Review Machine', description: 'Review 500 cards', icon: '⚙️', category: 'reviews', condition: { type: 'reviews', threshold: 500 } },
  { id: 'reviews-1000', name: 'SRS Master', description: 'Review 1,000 cards', icon: '🧠', category: 'reviews', condition: { type: 'reviews', threshold: 1000 } },
  { id: 'reviews-2500', name: 'Memory Palace', description: 'Review 2,500 cards', icon: '🏰', category: 'reviews', condition: { type: 'reviews', threshold: 2500 } },
  { id: 'reviews-5000', name: 'Review Legend', description: 'Review 5,000 cards', icon: '🌟', category: 'reviews', condition: { type: 'reviews', threshold: 5000 } },

  // Vocabulary Badges
  { id: 'words-10', name: 'Word Collector', description: 'Learn 10 words', icon: '📖', category: 'vocabulary', condition: { type: 'words', threshold: 10 } },
  { id: 'words-25', name: 'Word Explorer', description: 'Learn 25 words', icon: '🔤', category: 'vocabulary', condition: { type: 'words', threshold: 25 } },
  { id: 'words-50', name: 'Vocabulary Builder', description: 'Learn 50 words', icon: '📚', category: 'vocabulary', condition: { type: 'words', threshold: 50 } },
  { id: 'words-100', name: 'Word Wizard', description: 'Learn 100 words', icon: '🧙', category: 'vocabulary', condition: { type: 'words', threshold: 100 } },
  { id: 'words-200', name: 'Lexicon Legend', description: 'Learn 200 words', icon: '🎓', category: 'vocabulary', condition: { type: 'words', threshold: 200 } },
  { id: 'words-500', name: 'Walking Dictionary', description: 'Learn 500 words', icon: '📕', category: 'vocabulary', condition: { type: 'words', threshold: 500 } },
  { id: 'words-1000', name: 'Thousand Words', description: 'Learn 1,000 words', icon: '💬', category: 'vocabulary', condition: { type: 'words', threshold: 1000 } },

  // Lesson Badges
  { id: 'lessons-5', name: 'Student', description: 'Complete 5 lessons', icon: '📘', category: 'lessons', condition: { type: 'lessons', threshold: 5 } },
  { id: 'lessons-10', name: 'Eager Learner', description: 'Complete 10 lessons', icon: '📗', category: 'lessons', condition: { type: 'lessons', threshold: 10 } },
  { id: 'lessons-20', name: 'Scholar', description: 'Complete 20 lessons', icon: '🎒', category: 'lessons', condition: { type: 'lessons', threshold: 20 } },
  { id: 'lessons-50', name: 'Professor', description: 'Complete 50 lessons', icon: '🏛️', category: 'lessons', condition: { type: 'lessons', threshold: 50 } },
  { id: 'lessons-100', name: 'Grand Scholar', description: 'Complete 100 lessons', icon: '🎖️', category: 'lessons', condition: { type: 'lessons', threshold: 100 } },

  // Kanji Badges
  { id: 'kanji-10', name: 'Kanji Beginner', description: 'Master 10 kanji', icon: '漢', category: 'kanji', condition: { type: 'kanji', threshold: 10 } },
  { id: 'kanji-50', name: 'Kanji Student', description: 'Master 50 kanji', icon: '字', category: 'kanji', condition: { type: 'kanji', threshold: 50 } },
  { id: 'kanji-100', name: 'Kanji Warrior', description: 'Master 100 kanji', icon: '刀', category: 'kanji', condition: { type: 'kanji', threshold: 100 } },
  { id: 'kanji-200', name: 'Kanji Sage', description: 'Master 200 kanji', icon: '龍', category: 'kanji', condition: { type: 'kanji', threshold: 200 } },

  // Japanese Kana Badges (Hiragana + Katakana)
  { id: 'letters-ja-10', name: 'Kana Starter', description: 'Master 10 Japanese kana', icon: 'あ', category: 'letters-ja', condition: { type: 'letters-ja', threshold: 10 } },
  { id: 'letters-ja-46', name: 'Hiragana Hero', description: 'Master 46 Japanese kana', icon: 'か', category: 'letters-ja', condition: { type: 'letters-ja', threshold: 46 } },
  { id: 'letters-ja-92', name: 'Kana Master', description: 'Master 92 Japanese kana', icon: 'カ', category: 'letters-ja', condition: { type: 'letters-ja', threshold: 92 } },

  // Russian Letter Badges (Cyrillic)
  { id: 'letters-ru-10', name: 'Cyrillic Starter', description: 'Master 10 Russian letters', icon: 'Б', category: 'letters-ru', condition: { type: 'letters-ru', threshold: 10 } },
  { id: 'letters-ru-33', name: 'Alphabet Complete', description: 'Master 33 Russian letters', icon: 'Я', category: 'letters-ru', condition: { type: 'letters-ru', threshold: 33 } },
  { id: 'letters-ru-50', name: 'Cyrillic Expert', description: 'Master 50 Russian letters', icon: 'Ж', category: 'letters-ru', condition: { type: 'letters-ru', threshold: 50 } },

  // Daily Challenge Badges
  { id: 'challenges-1', name: 'Challenge Accepted', description: 'Complete 1 daily challenge', icon: '🎯', category: 'daily-challenge', condition: { type: 'challenges', threshold: 1 } },
  { id: 'challenges-7', name: 'Weekly Challenger', description: 'Complete 7 daily challenges', icon: '🎪', category: 'daily-challenge', condition: { type: 'challenges', threshold: 7 } },
  { id: 'challenges-30', name: 'Challenge Conqueror', description: 'Complete 30 daily challenges', icon: '⚔️', category: 'daily-challenge', condition: { type: 'challenges', threshold: 30 } },
  { id: 'challenges-100', name: 'Challenge Champion', description: 'Complete 100 daily challenges', icon: '🥇', category: 'daily-challenge', condition: { type: 'challenges', threshold: 100 } },

  // Reading Badges
  { id: 'texts-1', name: 'First Read', description: 'Save 1 text to reader', icon: '📄', category: 'reading', condition: { type: 'texts', threshold: 1 } },
  { id: 'texts-5', name: 'Bookworm', description: 'Save 5 texts to reader', icon: '📑', category: 'reading', condition: { type: 'texts', threshold: 5 } },
  { id: 'texts-15', name: 'Avid Reader', description: 'Save 15 texts to reader', icon: '🏆', category: 'reading', condition: { type: 'texts', threshold: 15 } },
];

export const BADGE_MAP = new Map(BADGES.map((b) => [b.id, b]));
