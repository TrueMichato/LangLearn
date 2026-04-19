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
  type: 'word' | 'letter';
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
  activity: 'srs' | 'reading' | 'grammar';
  xpEarned: number;
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
}

export interface LessonProgress {
  id: string; // `${language}/${lessonId}` e.g. "ja/particles"
  language: string;
  lessonId: string;
  completed: boolean;
  quizScore: number; // 0-100 percentage
  completedAt: string; // ISO date
  attempts: number;
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

export { db };
