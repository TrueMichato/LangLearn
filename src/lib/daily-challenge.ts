import { db } from '../db/schema';
import { getLessonProgress } from '../db/lessons';
import { getAlphabetsForLanguage } from '../data/alphabets';
import type { Character } from '../data/alphabets';
import { loadKnowledgeSnapshot } from '../db/knowledge';
import { selectPracticeItems } from './practice-selector';
import { evidenceHash, type KnowledgeSnapshot } from './knowledge';
import { todayStr } from './streaks';

export interface ChallengeQuestion {
  id: string;
  type: 'vocab' | 'grammar' | 'letter';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  word?: { word: string; reading: string; meaning: string; context?: string };
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
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}content/vocab/${lang}/index.json`);
  if (!res.ok) throw new Error('Vocabulary lesson index is unavailable.');
  return await res.json();
}

async function fetchVocabLesson(lang: string, lessonId: string): Promise<VocabLesson | null> {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}content/vocab/${lang}/${lessonId}.json`);
  if (!res.ok) throw new Error('A completed vocabulary lesson could not load.');
  return await res.json();
}

async function fetchGrammarLesson(lang: string, lessonId: string): Promise<string | null> {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}content/grammar/${lang}/${lessonId}.md`);
  if (!res.ok) throw new Error('A completed grammar lesson could not load.');
  return await res.text();
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
  rand: () => number,
  snapshot: KnowledgeSnapshot,
  seed: string,
): Promise<ChallengeQuestion[]> {
  const questions: ChallengeQuestion[] = [];

  // Try SRS words first
  const srsWords = (await db.words.where('language').equals(lang).toArray())
    .filter((word) => !word.type || word.type === 'word');
  const rank = <T extends { word: string }>(words: T[], target: number): T[] => {
    if (!words.length || target < 1) return [];
    const unique = [...new Map(words.map((word) => [word.word, word])).values()];
    const byId = new Map(unique.map((word) => [word.word, word]));
    const selected = selectPracticeItems(unique.map((word, order) => ({
      id: word.word, language: lang, vocabulary: [word.word], order,
    })), snapshot, { language: lang, seed,
      session: { minItems: 1, targetItems: target, maxItems: target } });
    return selected.itemIds.map((id) => byId.get(id)!);
  };
  if (srsWords.length >= 4) {
    const picked = rank(srsWords, count);
    for (const word of picked) {
      const otherWords = srsWords.filter((w) => w.meaning !== word.meaning);
      const distractors = pickRandom(otherWords, 3, rand).map((w) => w.meaning);
      const options = shuffle([word.meaning, ...distractors], rand);
      questions.push({
        id: `vocab:${evidenceHash(`${lang}:${word.word}`)}`,
        type: 'vocab',
        word: { word: word.word, reading: word.reading, meaning: word.meaning, context: word.contextSentence },
        question: `What does "${word.word}" mean?`,
        options,
        correctIndex: options.indexOf(word.meaning),
        explanation: word.contextSentence || undefined,
      });
    }
    if (questions.length >= count) return questions.slice(0, count);
  }

  // Fall back to vocab lesson files (only completed lessons)
  const progress = await getLessonProgress(lang);
  const completedVocabIds = new Set(
    progress.filter((p) => p.completed && p.lessonId.startsWith('vocab/')).map((p) => p.lessonId.replace('vocab/', ''))
  );
  if (!completedVocabIds.size) return questions;
  const vocabIndex = await fetchVocabIndex(lang);
  if (vocabIndex.length === 0) return questions;
  const completedLessons = vocabIndex.filter((entry) => completedVocabIds.has(entry.id));
  if (completedLessons.length === 0) return questions;

  const allWords: VocabWord[] = [];
  for (let index = 0; index < completedLessons.length; index += 4) {
    const lessons = await Promise.all(completedLessons.slice(index, index + 4)
      .map((entry) => fetchVocabLesson(lang, entry.id)));
    for (const lesson of lessons) {
      if (lesson?.words) allWords.push(...lesson.words);
    }
  }

  if (allWords.length < 4) return questions;

  const needed = count - questions.length;
  const picked = rank(allWords, needed);
  for (const word of picked) {
    const otherWords = allWords.filter((w) => w.meaning !== word.meaning);
    const distractors = pickRandom(otherWords, 3, rand).map((w) => w.meaning);
    const options = shuffle([word.meaning, ...distractors], rand);
    questions.push({
      id: `vocab:${evidenceHash(`${lang}:${word.word}`)}`,
      type: 'vocab',
      word: { ...word, context: word.example },
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

  const progress = await getLessonProgress(lang);
  const completedGrammarIds = new Set(
    progress.filter((p) => p.completed && !p.lessonId.startsWith('vocab/'))
      .map((p) => p.lessonId.replace(/^grammar\//u, '')),
  );
  if (!completedGrammarIds.size) return [];
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}content/grammar/${lang}/index.json`);
  if (!res.ok) throw new Error('Grammar lesson index is unavailable.');
  const grammarIndex: { id: string }[] = await res.json();
  if (grammarIndex.length === 0) return [];

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
      id: `grammar:${evidenceHash(JSON.stringify(quiz))}`,
      type: 'grammar',
      question: quiz.question,
      options: quiz.options,
      correctIndex: quiz.answer,
    });
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
      id: `letter:${char.char}:${char.romanji}`,
      type: 'letter',
      question: `What is the reading of "${char.char}"?`,
      options,
      correctIndex: options.indexOf(char.romanji),
      explanation: char.meaning ? `Meaning: ${char.meaning}` : undefined,
    });
  }

  return questions.slice(0, count);
}

async function generateUnfrozenDailyChallenge(
  language: string,
  date: string,
  snapshot: KnowledgeSnapshot,
): Promise<{ questions: ChallengeQuestion[]; notices: string[] }> {
  const seed = Number(date.replaceAll('-', ''));
  const rand = seededRandom(seed + language.charCodeAt(0));

  const [vocabQs, grammarQs] = await Promise.all([
    generateVocabQuestions(language, 3, seededRandom(seed + 11), snapshot, `${date}:${language}`),
    generateGrammarQuestions(language, 2, seededRandom(seed + 23)),
  ]);
  const letterQs = generateLetterQuestions(language, 2, rand);

  const allQuestions = [...vocabQs, ...grammarQs, ...letterQs];

  // If we don't have enough of one type, fill from others
  if (allQuestions.length < 7) {
    const extra = generateLetterQuestions(language, 7 - allQuestions.length, rand);
    allQuestions.push(...extra);
  }

  const notices: string[] = [];
  if (vocabQs.length < 3) notices.push(`Vocabulary pool limited: ${vocabQs.length}/3 items available from saved words and completed vocabulary lessons.`);
  if (grammarQs.length < 2) notices.push(`Grammar pool limited: ${grammarQs.length}/2 items available from completed grammar lessons.`);
  if (letterQs.length < 2) notices.push(`Character pool limited: ${letterQs.length}/2 items available for this language.`);
  return { questions: shuffle(allQuestions, rand).slice(0, 7), notices };
}

export interface DailyChallengeAttempt {
  date: string;
  language: string;
  snapshotRevision: string;
  questions: ChallengeQuestion[];
  notices: string[];
}

const pendingAttempts = new Map<string, Promise<DailyChallengeAttempt>>();

/**
 * Freeze the actual prompt payload as well as IDs: edits/deletions and updated
 * content must not change an already generated day's assessment-like attempt.
 * The existing settings table keeps this local without a schema migration.
 */
export function loadDailyChallengeAttempt(language: string, date = todayStr()): Promise<DailyChallengeAttempt> {
  const key = `daily-practice:v1:${date}:${language}`;
  const pending = pendingAttempts.get(key);
  if (pending) return pending;
  const task = (async () => {
    const saved = await db.settings.get(key);
    if (saved) {
      const attempt = JSON.parse(saved.value) as DailyChallengeAttempt;
      if (attempt.date !== date || attempt.language !== language || !Array.isArray(attempt.questions) ||
        attempt.questions.some((question) => !question.id || !Array.isArray(question.options) ||
          !Number.isInteger(question.correctIndex) || question.correctIndex < 0 ||
          question.correctIndex >= question.options.length)) {
        throw new Error('The saved daily attempt could not be read; it was not replaced.');
      }
      return { ...attempt, notices: attempt.notices ?? [] };
    }
    const snapshot = await loadKnowledgeSnapshot(language);
    const generated = await generateUnfrozenDailyChallenge(language, date, snapshot);
    const attempt: DailyChallengeAttempt = {
      date, language, snapshotRevision: snapshot.revision, ...generated,
    };
    if (!attempt.questions.length) return attempt;
    return db.transaction('rw', db.settings, async () => {
      const concurrent = await db.settings.get(key);
      if (concurrent) return JSON.parse(concurrent.value) as DailyChallengeAttempt;
      await db.settings.put({ key, value: JSON.stringify(attempt) });
      return attempt;
    });
  })();
  pendingAttempts.set(key, task);
  void task.then(() => pendingAttempts.delete(key), () => pendingAttempts.delete(key));
  return task;
}

export async function generateDailyChallenge(language: string, date = todayStr()): Promise<ChallengeQuestion[]> {
  return (await loadDailyChallengeAttempt(language, date)).questions;
}
