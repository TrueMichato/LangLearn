import { db } from '../db/schema';
import { getLessonProgress } from '../db/lessons';
import { getAlphabetsForLanguage } from '../data/alphabets';
import type { Character } from '../data/alphabets';

export interface ChallengeQuestion {
  type: 'vocab' | 'grammar' | 'letter';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface VocabWord {
  word: string;
  reading: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
}

interface VocabLesson {
  id: string;
  words: VocabWord[];
}

interface GrammarQuiz {
  type: string;
  question: string;
  options: string[];
  answer: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandom<T>(arr: T[], count: number, rand: () => number): T[] {
  const shuffled = shuffle(arr, rand);
  return shuffled.slice(0, count);
}

async function fetchVocabIndex(lang: string): Promise<{ id: string }[]> {
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}content/vocab/${lang}/index.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchVocabLesson(lang: string, lessonId: string): Promise<VocabLesson | null> {
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}content/vocab/${lang}/${lessonId}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchGrammarLesson(lang: string, lessonId: string): Promise<string | null> {
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}content/grammar/${lang}/${lessonId}.md`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseGrammarQuizzes(markdown: string): GrammarQuiz[] {
  const quizzes: GrammarQuiz[] = [];
  const regex = /<!--\s*quiz:\s*(\{.*?\})\s*-->/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    try {
      const quiz = JSON.parse(match[1]) as GrammarQuiz;
      if (quiz.question && quiz.options && typeof quiz.answer === 'number') {
        quizzes.push(quiz);
      }
    } catch {
      // skip malformed quiz comments
    }
  }
  return quizzes;
}

async function generateVocabQuestions(
  lang: string,
  count: number,
  rand: () => number
): Promise<ChallengeQuestion[]> {
  const questions: ChallengeQuestion[] = [];

  // Try SRS words first
  const srsWords = await db.words.where('language').equals(lang).toArray();
  if (srsWords.length >= 4) {
    const picked = pickRandom(srsWords, count, rand);
    for (const word of picked) {
      const otherWords = srsWords.filter((w) => w.meaning !== word.meaning);
      const distractors = pickRandom(otherWords, 3, rand).map((w) => w.meaning);
      const options = shuffle([word.meaning, ...distractors], rand);
      questions.push({
        type: 'vocab',
        question: `What does "${word.word}" mean?`,
        options,
        correctIndex: options.indexOf(word.meaning),
        explanation: word.contextSentence || undefined,
      });
    }
    if (questions.length >= count) return questions.slice(0, count);
  }

  // Fall back to vocab lesson files (only completed lessons)
  const vocabIndex = await fetchVocabIndex(lang);
  if (vocabIndex.length === 0) return questions;

  const progress = await getLessonProgress(lang);
  const completedVocabIds = new Set(
    progress.filter((p) => p.completed && p.lessonId.startsWith('vocab/')).map((p) => p.lessonId.replace('vocab/', ''))
  );
  const completedLessons = vocabIndex.filter((entry) => completedVocabIds.has(entry.id));
  if (completedLessons.length === 0) return questions;

  const selectedLessons = pickRandom(completedLessons, Math.min(3, completedLessons.length), rand);

  const allWords: VocabWord[] = [];
  for (const entry of selectedLessons) {
    const lesson = await fetchVocabLesson(lang, entry.id);
    if (lesson?.words) {
      allWords.push(...lesson.words);
    }
  }

  if (allWords.length < 4) return questions;

  const needed = count - questions.length;
  const picked = pickRandom(allWords, needed, rand);
  for (const word of picked) {
    const otherWords = allWords.filter((w) => w.meaning !== word.meaning);
    const distractors = pickRandom(otherWords, 3, rand).map((w) => w.meaning);
    const options = shuffle([word.meaning, ...distractors], rand);
    questions.push({
      type: 'vocab',
      question: `What does "${word.word}" (${word.reading}) mean?`,
      options,
      correctIndex: options.indexOf(word.meaning),
      explanation: word.example
        ? `${word.example} — ${word.exampleMeaning}`
        : undefined,
    });
  }

  return questions.slice(0, count);
}

async function generateGrammarQuestions(
  lang: string,
  count: number,
  rand: () => number
): Promise<ChallengeQuestion[]> {
  const questions: ChallengeQuestion[] = [];

  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}content/grammar/${lang}/index.json`);
    if (!res.ok) return [];
    const grammarIndex: { id: string }[] = await res.json();
    if (grammarIndex.length === 0) return [];

    const progress = await getLessonProgress(lang);
    const completedGrammarIds = new Set(
      progress.filter((p) => p.completed && p.lessonId.startsWith('grammar/')).map((p) => p.lessonId.replace('grammar/', ''))
    );
    const completedLessons = grammarIndex.filter((entry) => completedGrammarIds.has(entry.id));
    if (completedLessons.length === 0) return [];

    const selectedLessons = pickRandom(completedLessons, Math.min(4, completedLessons.length), rand);
    const allQuizzes: GrammarQuiz[] = [];

    for (const entry of selectedLessons) {
      const content = await fetchGrammarLesson(lang, entry.id);
      if (content) {
        allQuizzes.push(...parseGrammarQuizzes(content));
      }
    }

    const picked = pickRandom(allQuizzes, count, rand);
    for (const quiz of picked) {
      questions.push({
        type: 'grammar',
        question: quiz.question,
        options: quiz.options,
        correctIndex: quiz.answer,
      });
    }
  } catch {
    // grammar content unavailable
  }

  return questions.slice(0, count);
}

function generateLetterQuestions(
  lang: string,
  count: number,
  rand: () => number
): ChallengeQuestion[] {
  const alphabets = getAlphabetsForLanguage(lang);
  if (alphabets.length === 0) return [];

  const allChars: Character[] = alphabets.flatMap((a) => a.characters);
  if (allChars.length < 4) return [];

  const picked = pickRandom(allChars, count, rand);
  const questions: ChallengeQuestion[] = [];

  for (const char of picked) {
    const otherChars = allChars.filter((c) => c.romanji !== char.romanji);
    const distractors = pickRandom(otherChars, 3, rand).map((c) => c.romanji);
    const options = shuffle([char.romanji, ...distractors], rand);
    questions.push({
      type: 'letter',
      question: `What is the reading of "${char.char}"?`,
      options,
      correctIndex: options.indexOf(char.romanji),
      explanation: char.meaning ? `Meaning: ${char.meaning}` : undefined,
    });
  }

  return questions.slice(0, count);
}

export async function generateDailyChallenge(
  language: string
): Promise<ChallengeQuestion[]> {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const rand = seededRandom(seed + language.charCodeAt(0));

  const [vocabQs, grammarQs] = await Promise.all([
    generateVocabQuestions(language, 3, rand),
    generateGrammarQuestions(language, 2, rand),
  ]);
  const letterQs = generateLetterQuestions(language, 2, rand);

  const allQuestions = [...vocabQs, ...grammarQs, ...letterQs];

  // If we don't have enough of one type, fill from others
  if (allQuestions.length < 7) {
    const extra = generateLetterQuestions(language, 7 - allQuestions.length, rand);
    allQuestions.push(...extra);
  }

  return shuffle(allQuestions, rand).slice(0, 7);
}
