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

const db = new Dexie('LangLearnDB') as Dexie & {
  words: EntityTable<Word, 'id'>;
  reviews: EntityTable<Review, 'id'>;
  texts: EntityTable<Text, 'id'>;
  studySessions: EntityTable<StudySession, 'id'>;
  settings: EntityTable<Setting, 'key'>;
  dailyActivity: EntityTable<DailyActivity, 'date'>;
  lessonProgress: EntityTable<LessonProgress, 'id'>;
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

export { db };
