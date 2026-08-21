import type { StudyActivity } from '../lib/activities';
import Dexie, { type EntityTable } from 'dexie';

export interface Word {
  id?: number;
  language: string;
  word: string;
  reading: string;
  meaning: string;
  contextSentence: string;
  sourceTextId: number | null;
  tags: string[];
  type: 'word' | 'letter' | 'grammar';
  /** For grammar cards: the grammar rule/point, shown only on the answer side. */
  grammarRule?: string;
  createdAt: string;
}

export interface Review {
  id?: number;
  wordId: number;
  ease: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string;
  stability?: number;   // FSRS only; non-indexed, no migration needed
  difficulty?: number;  // FSRS only; 1..10
}

export interface Text {
  id?: number;
  language: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface StudySession {
  id?: number;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  activity: StudyActivity;
  xpEarned: number;
  language?: string;
  wordCount?: number;
  title?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD (primary key)
  studySeconds: number;
  cardsReviewed: number;
  wordsAdded: number;
  goalMet: boolean;
  challengeComplete?: boolean;
  freezeUsed?: boolean; // an explicit streak freeze was spent to bridge this missed day
}

export interface LessonProgress {
  id: string; // `${language}/${lessonId}` e.g. "ja/particles"
  language: string;
  lessonId: string;
  completed: boolean;
  quizScore: number; // 0-100 percentage
  completedAt: string; // ISO date
  attempts: number;
  /**
   * How this lesson came to be completed. Non-indexed on purpose — it is
   * read only when displaying a single lesson's own progress row, never
   * queried across the table, so it doesn't earn a place in `.stores()` and
   * doesn't force a schema version bump.
   *
   * Rows written before this field existed have it as `undefined`. Treat a
   * missing value as `'lesson'` (normal completion) everywhere it's read —
   * never assume `'tested-out'` for legacy rows.
   */
  completionMethod?: 'lesson' | 'tested-out';
}

export interface CharacterProgress {
  id: string;           // `${language}/${alphabetName}/${char}` e.g. "ja/Hiragana/あ"
  language: string;
  character: string;
  romanji: string;
  correctCount: number;
  totalAttempts: number;
  lastPracticed: string; // ISO date
  mastery: 'new' | 'learning' | 'mastered';
}

export interface TestHistory {
  id?: number;
  language: string;
  type: 'vocabulary' | 'grammar' | 'mixed' | 'full';
  score: number;         // 0-100
  level: string;         // 'beginner' | 'elementary' | 'intermediate' | 'advanced'
  totalQuestions: number;
  correctAnswers: number;
  durationSeconds: number;
  date: string;          // ISO date
}

export interface Badge {
  id: string;            // e.g. 'xp-100', 'streak-7', 'kanji-50'
  unlockedAt: string;    // ISO date
}

export interface ReviewLogEntry {
  id?: number;
  reviewId: number;
  wordId: number;
  language: string;
  grade: number;         // SM-2 grade 0-5
  isLapse: boolean;      // grade < 3
  date: string;          // ISO date of the grade event
}

/**
 * A full copy of the learner's data, taken automatically before a schema
 * upgrade runs. This is the safety net that turns "the update ate my progress"
 * into "restore the snapshot from before the update".
 */
export interface Snapshot {
  id?: number;
  createdAt: string;     // ISO date
  /** Why it was taken, e.g. "before upgrade to schema v11". */
  reason: string;
  /** Schema version the data was captured at. */
  schemaVersion: number;
  /** Serialized backup payload (see src/db/backup.ts). */
  payload: string;
  /** Byte length of `payload`, so Settings can show cost without parsing. */
  sizeBytes: number;
}

const db = new Dexie('LangLearnDB') as Dexie & {
  words: EntityTable<Word, 'id'>;
  reviews: EntityTable<Review, 'id'>;
  texts: EntityTable<Text, 'id'>;
  studySessions: EntityTable<StudySession, 'id'>;
  settings: EntityTable<Setting, 'key'>;
  dailyActivity: EntityTable<DailyActivity, 'date'>;
  lessonProgress: EntityTable<LessonProgress, 'id'>;
  characterProgress: EntityTable<CharacterProgress, 'id'>;
  testHistory: EntityTable<TestHistory, 'id'>;
  badges: EntityTable<Badge, 'id'>;
  reviewLog: EntityTable<ReviewLogEntry, 'id'>;
  snapshots: EntityTable<Snapshot, 'id'>;
};

db.version(1).stores({
  words: '++id, language, word, createdAt, *tags',
  reviews: '++id, wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
});

db.version(2).stores({
  words: '++id, language, word, createdAt, *tags',
  reviews: '++id, wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date',
});

db.version(3).stores({
  words: '++id, language, word, createdAt, *tags',
  reviews: '++id, wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date',
  lessonProgress: 'id, language, lessonId',
});

db.version(4).stores({
  words: '++id, [language+createdAt], language, word, createdAt, *tags',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet',
  lessonProgress: 'id, language, lessonId',
});

db.version(5).stores({
  words: '++id, [language+createdAt], language, word, createdAt, *tags',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
});

db.version(6).stores({
  words: '++id, [language+createdAt], language, word, createdAt, *tags',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet, challengeComplete',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
  testHistory: '++id, language, type, score, date',
  badges: 'id, unlockedAt',
});

db.version(7).stores({
  words: '++id, [language+createdAt], language, word, createdAt, *tags, type',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet, challengeComplete',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
  testHistory: '++id, language, type, score, date',
  badges: 'id, unlockedAt',
}).upgrade((tx) => {
  return tx.table('words').toCollection().modify((word) => {
    if (!word.type) {
      word.type = word.tags?.includes('letters') ? 'letter' : 'word';
    }
  });
});

db.version(8).stores({
  words: '++id, [language+createdAt], [word+language], language, word, createdAt, *tags, type',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet, challengeComplete',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
  testHistory: '++id, language, type, score, date',
  badges: 'id, unlockedAt',
});

db.version(9).stores({
  words: '++id, [language+createdAt], [word+language], language, word, createdAt, *tags, type',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet, challengeComplete',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
  testHistory: '++id, language, type, score, date',
  badges: 'id, unlockedAt',
  reviewLog: '++id, reviewId, wordId, isLapse, [language+date], date',
}).upgrade(async (tx) => {
  // Grammar cards created before the field realignment stored the rule in `word`
  // and the answer in `contextSentence`, which leaked the answer onto the question
  // side. They are identifiable by the absence of `grammarRule`.
  //
  // An earlier version of this migration DELETED those rows along with their
  // reviews. That threw away real review history — a learner who had been
  // grading a card for months lost it to a routine app update. Repair the
  // mapping in place instead: the card, and everything the learner earned on
  // it, survives. Migrations must never destroy user data.
  await tx.table('words')
    .where('type')
    .equals('grammar')
    .filter((w: { grammarRule?: string }) => w.grammarRule === undefined)
    .modify((word: Word) => {
      // Legacy layout: word = the rule, contextSentence = the answer.
      const legacyRule = word.word;
      const legacyAnswer = word.contextSentence;
      word.grammarRule = legacyRule;
      // Prefer the stored answer as the tested side; fall back to the rule so
      // the card is never left blank.
      word.word = legacyAnswer || legacyRule;
      // There is no recoverable prompt in the legacy layout, and reusing the
      // answer here would leak it onto the question side again.
      word.contextSentence = '';
    });
});

db.version(10).stores({
  words: '++id, [language+createdAt], [word+language], language, word, createdAt, *tags, type',
  reviews: '++id, [wordId+nextReviewDate], wordId, nextReviewDate',
  texts: '++id, language, createdAt',
  studySessions: '++id, startTime, activity',
  settings: 'key',
  dailyActivity: 'date, goalMet, challengeComplete',
  lessonProgress: 'id, language, lessonId',
  characterProgress: 'id, language, mastery',
  testHistory: '++id, language, type, score, date',
  badges: 'id, unlockedAt',
  reviewLog: '++id, reviewId, wordId, isLapse, [language+date], date',
  snapshots: '++id, createdAt',
});

/** Schema version the running bundle expects. Snapshots record it so a restore
 *  can tell whether it predates the current shape. */
export const CURRENT_SCHEMA_VERSION = 10;

export { db };
