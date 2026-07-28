export type BadgeCategory =
  | 'xp'
  | 'streak'
  | 'reviews'
  | 'vocabulary'
  | 'lessons'
  | 'kanji'
  | 'letters-ja'
  | 'letters-ru'
  | 'letters-pt'
  | 'daily-challenge'
  | 'reading'
  | 'vocabulary-lang'
  | 'lessons-lang'
  | 'tests-lang';

export type BadgeConditionType =
  | 'xp'
  | 'streak'
  | 'reviews'
  | 'words'
  | 'lessons'
  | 'kanji'
  | 'letters-ja'
  | 'letters-ru'
  | 'letters-pt'
  | 'challenges'
  | 'texts'
  | 'words-lang'
  | 'lessons-lang'
  | 'tests-lang';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  /** When set, the badge is only visible/unlockable while this language is in activeLanguages. */
  language?: string;
  condition: {
    type: BadgeConditionType;
    threshold: number;
  };
}

const LANGUAGE_FLAGS: Record<string, string> = { ja: '🇯🇵', ru: '🇷🇺', pt: '🇧🇷', es: '🇪🇸', ar: '🇸🇦' };
const LANGUAGE_NAMES: Record<string, string> = { ja: 'Japanese', ru: 'Russian', pt: 'Portuguese', es: 'Spanish', ar: 'Arabic' };

const PER_LANGUAGE_CODES = ['ja', 'ru', 'pt', 'es', 'ar'] as const;

const WORD_LANG_THRESHOLDS: Array<{ n: number; name: string; icon: string }> = [
  { n: 25, name: 'Word Starter', icon: '🌱' },
  { n: 100, name: 'Word Builder', icon: '📚' },
  { n: 500, name: 'Word Master', icon: '📕' },
];

const LESSON_LANG_THRESHOLDS: Array<{ n: number; name: string; icon: string }> = [
  { n: 5, name: 'Lesson Starter', icon: '📘' },
  { n: 20, name: 'Lesson Scholar', icon: '🎓' },
];

const TEST_LANG_THRESHOLDS: Array<{ n: number; name: string; icon: string }> = [
  { n: 1, name: 'Test Passed', icon: '✅' },
  { n: 5, name: 'Test Veteran', icon: '🏅' },
];

function perLanguageBadges(): BadgeDefinition[] {
  const out: BadgeDefinition[] = [];
  for (const code of PER_LANGUAGE_CODES) {
    const flag = LANGUAGE_FLAGS[code];
    const name = LANGUAGE_NAMES[code];
    for (const t of WORD_LANG_THRESHOLDS) {
      out.push({
        id: `words-${code}-${t.n}`,
        name: `${flag} ${t.name}`,
        description: `Learn ${t.n.toLocaleString()} ${name} words`,
        icon: t.icon,
        category: 'vocabulary-lang',
        language: code,
        condition: { type: 'words-lang', threshold: t.n },
      });
    }
    for (const t of LESSON_LANG_THRESHOLDS) {
      out.push({
        id: `lessons-${code}-${t.n}`,
        name: `${flag} ${t.name}`,
        description: `Complete ${t.n} ${name} lessons`,
        icon: t.icon,
        category: 'lessons-lang',
        language: code,
        condition: { type: 'lessons-lang', threshold: t.n },
      });
    }
    for (const t of TEST_LANG_THRESHOLDS) {
      out.push({
        id: `tests-${code}-${t.n}`,
        name: `${flag} ${t.name}`,
        description:
          t.n === 1
            ? `Pass a ${name} proficiency test (≥70%)`
            : `Pass ${t.n} ${name} proficiency tests (≥70%)`,
        icon: t.icon,
        category: 'tests-lang',
        language: code,
        condition: { type: 'tests-lang', threshold: t.n },
      });
    }
  }
  return out;
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

  // Vocabulary Badges (global, across all languages)
  { id: 'words-10', name: 'Word Collector', description: 'Learn 10 words', icon: '📖', category: 'vocabulary', condition: { type: 'words', threshold: 10 } },
  { id: 'words-25', name: 'Word Explorer', description: 'Learn 25 words', icon: '🔤', category: 'vocabulary', condition: { type: 'words', threshold: 25 } },
  { id: 'words-50', name: 'Vocabulary Builder', description: 'Learn 50 words', icon: '📚', category: 'vocabulary', condition: { type: 'words', threshold: 50 } },
  { id: 'words-100', name: 'Word Wizard', description: 'Learn 100 words', icon: '🧙', category: 'vocabulary', condition: { type: 'words', threshold: 100 } },
  { id: 'words-200', name: 'Lexicon Legend', description: 'Learn 200 words', icon: '🎓', category: 'vocabulary', condition: { type: 'words', threshold: 200 } },
  { id: 'words-500', name: 'Walking Dictionary', description: 'Learn 500 words', icon: '📕', category: 'vocabulary', condition: { type: 'words', threshold: 500 } },
  { id: 'words-1000', name: 'Thousand Words', description: 'Learn 1,000 words', icon: '💬', category: 'vocabulary', condition: { type: 'words', threshold: 1000 } },

  // Lesson Badges (global)
  { id: 'lessons-5', name: 'Student', description: 'Complete 5 lessons', icon: '📘', category: 'lessons', condition: { type: 'lessons', threshold: 5 } },
  { id: 'lessons-10', name: 'Eager Learner', description: 'Complete 10 lessons', icon: '📗', category: 'lessons', condition: { type: 'lessons', threshold: 10 } },
  { id: 'lessons-20', name: 'Scholar', description: 'Complete 20 lessons', icon: '🎒', category: 'lessons', condition: { type: 'lessons', threshold: 20 } },
  { id: 'lessons-50', name: 'Professor', description: 'Complete 50 lessons', icon: '🏛️', category: 'lessons', condition: { type: 'lessons', threshold: 50 } },
  { id: 'lessons-100', name: 'Grand Scholar', description: 'Complete 100 lessons', icon: '🎖️', category: 'lessons', condition: { type: 'lessons', threshold: 100 } },

  // Kanji Badges (Japanese only)
  { id: 'kanji-10', name: 'Kanji Beginner', description: 'Master 10 kanji', icon: '漢', category: 'kanji', language: 'ja', condition: { type: 'kanji', threshold: 10 } },
  { id: 'kanji-50', name: 'Kanji Student', description: 'Master 50 kanji', icon: '字', category: 'kanji', language: 'ja', condition: { type: 'kanji', threshold: 50 } },
  { id: 'kanji-100', name: 'Kanji Warrior', description: 'Master 100 kanji', icon: '刀', category: 'kanji', language: 'ja', condition: { type: 'kanji', threshold: 100 } },
  { id: 'kanji-200', name: 'Kanji Sage', description: 'Master 200 kanji', icon: '龍', category: 'kanji', language: 'ja', condition: { type: 'kanji', threshold: 200 } },

  // Japanese Kana Badges (Hiragana + Katakana)
  { id: 'letters-ja-10', name: 'Kana Starter', description: 'Master 10 Japanese kana', icon: 'あ', category: 'letters-ja', language: 'ja', condition: { type: 'letters-ja', threshold: 10 } },
  { id: 'letters-ja-46', name: 'Hiragana Hero', description: 'Master 46 Japanese kana', icon: 'か', category: 'letters-ja', language: 'ja', condition: { type: 'letters-ja', threshold: 46 } },
  { id: 'letters-ja-92', name: 'Kana Master', description: 'Master 92 Japanese kana', icon: 'カ', category: 'letters-ja', language: 'ja', condition: { type: 'letters-ja', threshold: 92 } },

  // Russian Letter Badges (Cyrillic)
  { id: 'letters-ru-10', name: 'Cyrillic Starter', description: 'Master 10 Russian letters', icon: 'Б', category: 'letters-ru', language: 'ru', condition: { type: 'letters-ru', threshold: 10 } },
  { id: 'letters-ru-33', name: 'Alphabet Complete', description: 'Master 33 Russian letters', icon: 'Я', category: 'letters-ru', language: 'ru', condition: { type: 'letters-ru', threshold: 33 } },
  { id: 'letters-ru-50', name: 'Cyrillic Expert', description: 'Master 50 Russian letters', icon: 'Ж', category: 'letters-ru', language: 'ru', condition: { type: 'letters-ru', threshold: 50 } },

  // Portuguese Letter Badges (accented letters)
  { id: 'letters-pt-10', name: 'Acentos Starter', description: 'Master 10 Portuguese accented letters', icon: 'á', category: 'letters-pt', language: 'pt', condition: { type: 'letters-pt', threshold: 10 } },
  { id: 'letters-pt-24', name: 'Acentos Complete', description: 'Master all 24 Portuguese accented letters', icon: 'ã', category: 'letters-pt', language: 'pt', condition: { type: 'letters-pt', threshold: 24 } },

  // Daily Challenge Badges
  { id: 'challenges-1', name: 'Challenge Accepted', description: 'Complete 1 daily challenge', icon: '🎯', category: 'daily-challenge', condition: { type: 'challenges', threshold: 1 } },
  { id: 'challenges-7', name: 'Weekly Challenger', description: 'Complete 7 daily challenges', icon: '🎪', category: 'daily-challenge', condition: { type: 'challenges', threshold: 7 } },
  { id: 'challenges-30', name: 'Challenge Conqueror', description: 'Complete 30 daily challenges', icon: '⚔️', category: 'daily-challenge', condition: { type: 'challenges', threshold: 30 } },
  { id: 'challenges-100', name: 'Challenge Champion', description: 'Complete 100 daily challenges', icon: '🥇', category: 'daily-challenge', condition: { type: 'challenges', threshold: 100 } },

  // Reading Badges
  { id: 'texts-1', name: 'First Read', description: 'Save 1 text to reader', icon: '📄', category: 'reading', condition: { type: 'texts', threshold: 1 } },
  { id: 'texts-5', name: 'Bookworm', description: 'Save 5 texts to reader', icon: '📑', category: 'reading', condition: { type: 'texts', threshold: 5 } },
  { id: 'texts-15', name: 'Avid Reader', description: 'Save 15 texts to reader', icon: '🏆', category: 'reading', condition: { type: 'texts', threshold: 15 } },

  // Per-language tracks (Japanese / Russian / Portuguese)
  ...perLanguageBadges(),
];

export const BADGE_MAP = new Map(BADGES.map((b) => [b.id, b]));

/** Threshold (0–100) at which a proficiency test counts as "passed". */
export const TEST_PASS_SCORE = 70;
