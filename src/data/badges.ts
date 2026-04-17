export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'xp' | 'streak' | 'reviews' | 'vocabulary' | 'lessons' | 'kanji';
  condition: {
    type: 'xp' | 'streak' | 'reviews' | 'words' | 'lessons' | 'kanji';
    threshold: number;
  };
}

export const BADGES: BadgeDefinition[] = [
  // XP Milestones
  { id: 'xp-100', name: 'First Steps', description: 'Earn 100 XP', icon: '🌱', category: 'xp', condition: { type: 'xp', threshold: 100 } },
  { id: 'xp-500', name: 'Getting Serious', description: 'Earn 500 XP', icon: '🌿', category: 'xp', condition: { type: 'xp', threshold: 500 } },
  { id: 'xp-1000', name: 'Dedicated Learner', description: 'Earn 1,000 XP', icon: '🌳', category: 'xp', condition: { type: 'xp', threshold: 1000 } },
  { id: 'xp-5000', name: 'Language Enthusiast', description: 'Earn 5,000 XP', icon: '🏔️', category: 'xp', condition: { type: 'xp', threshold: 5000 } },
  { id: 'xp-10000', name: 'Language Master', description: 'Earn 10,000 XP', icon: '🏆', category: 'xp', condition: { type: 'xp', threshold: 10000 } },

  // Streak Badges
  { id: 'streak-3', name: "Three's a Charm", description: '3-day streak', icon: '⚡', category: 'streak', condition: { type: 'streak', threshold: 3 } },
  { id: 'streak-7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streak', condition: { type: 'streak', threshold: 7 } },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day streak', icon: '💎', category: 'streak', condition: { type: 'streak', threshold: 30 } },
  { id: 'streak-100', name: 'Century Club', description: '100-day streak', icon: '👑', category: 'streak', condition: { type: 'streak', threshold: 100 } },

  // Review Badges
  { id: 'reviews-10', name: 'First Review', description: 'Review 10 cards', icon: '📝', category: 'reviews', condition: { type: 'reviews', threshold: 10 } },
  { id: 'reviews-100', name: 'Card Crusher', description: 'Review 100 cards', icon: '🃏', category: 'reviews', condition: { type: 'reviews', threshold: 100 } },
  { id: 'reviews-500', name: 'Review Machine', description: 'Review 500 cards', icon: '⚡', category: 'reviews', condition: { type: 'reviews', threshold: 500 } },
  { id: 'reviews-1000', name: 'SRS Master', description: 'Review 1,000 cards', icon: '🧠', category: 'reviews', condition: { type: 'reviews', threshold: 1000 } },

  // Vocabulary Badges
  { id: 'words-10', name: 'Word Collector', description: 'Learn 10 words', icon: '📖', category: 'vocabulary', condition: { type: 'words', threshold: 10 } },
  { id: 'words-50', name: 'Vocabulary Builder', description: 'Learn 50 words', icon: '📚', category: 'vocabulary', condition: { type: 'words', threshold: 50 } },
  { id: 'words-200', name: 'Lexicon Legend', description: 'Learn 200 words', icon: '🎓', category: 'vocabulary', condition: { type: 'words', threshold: 200 } },

  // Lesson Badges
  { id: 'lessons-5', name: 'Student', description: 'Complete 5 lessons', icon: '📘', category: 'lessons', condition: { type: 'lessons', threshold: 5 } },
  { id: 'lessons-20', name: 'Scholar', description: 'Complete 20 lessons', icon: '🎒', category: 'lessons', condition: { type: 'lessons', threshold: 20 } },
  { id: 'lessons-50', name: 'Professor', description: 'Complete 50 lessons', icon: '🏛️', category: 'lessons', condition: { type: 'lessons', threshold: 50 } },

  // Kanji Badges
  { id: 'kanji-10', name: 'Kanji Beginner', description: 'Master 10 kanji', icon: '漢', category: 'kanji', condition: { type: 'kanji', threshold: 10 } },
  { id: 'kanji-50', name: 'Kanji Student', description: 'Master 50 kanji', icon: '字', category: 'kanji', condition: { type: 'kanji', threshold: 50 } },
];

export const BADGE_MAP = new Map(BADGES.map((b) => [b.id, b]));
