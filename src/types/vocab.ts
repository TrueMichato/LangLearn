export interface VocabLessonMeta {
  id: string;
  title: string;
  order: number;
  wordCount: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface VocabWord {
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

export interface MatchExercise {
  type: 'match';
  pairs: number;
}

export interface FillBlankItem {
  sentence: string;
  answer: string;
  hint: string;
}

export interface FillBlankExercise {
  type: 'fill-blank';
  items: FillBlankItem[];
}

export interface MCItem {
  question: string;
  options: string[];
  answer: number;
}

export interface MCExercise {
  type: 'multiple-choice';
  items: MCItem[];
}

export interface TypingItem {
  prompt: string;
  answer: string;
  hint: string;
}

export interface TypingExercise {
  type: 'typing';
  items: TypingItem[];
}

export interface ListeningItem {
  word: string;
  options: string[];
  answer: number;
}

export interface ListeningExercise {
  type: 'listening';
  items: ListeningItem[];
}

export type VocabExercise = MatchExercise | FillBlankExercise | MCExercise | TypingExercise | ListeningExercise;

export interface VocabLesson {
  id: string;
  words: VocabWord[];
  exercises: VocabExercise[];
}
