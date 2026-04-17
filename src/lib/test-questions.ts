export type TestType = 'vocabulary' | 'grammar' | 'mixed' | 'full';

export interface Question {
  id: number;
  category: 'vocabulary' | 'grammar';
  question: string;
  options: string[];
  correctIndex: number;
}

interface VocabWord {
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
}

interface VocabLesson {
  id: string;
  words: VocabWord[];
  exercises: Array<{
    type: string;
    items?: Array<{ sentence: string; answer: string; hint: string }>;
  }>;
}

interface GrammarQuiz {
  type: string;
  question: string;
  options: string[];
  answer: number;
}

const QUESTION_COUNTS: Record<TestType, { vocab: number; grammar: number }> = {
  vocabulary: { vocab: 15, grammar: 0 },
  grammar: { vocab: 0, grammar: 15 },
  mixed: { vocab: 10, grammar: 10 },
  full: { vocab: 20, grammar: 20 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function pickDistractors(correct: string, pool: string[], count: number): string[] {
  const filtered = pool.filter((w) => w !== correct);
  return pickRandom(filtered, count);
}

async function fetchVocabLessons(lang: string): Promise<VocabLesson[]> {
  const base = import.meta.env.BASE_URL;
  try {
    const indexRes = await fetch(`${base}content/vocab/${lang}/index.json`);
    if (!indexRes.ok) return [];
    const lessonIds: string[] = await indexRes.json();
    const results = await Promise.allSettled(
      lessonIds.map(async (id) => {
        const res = await fetch(`${base}content/vocab/${lang}/${id}.json`);
        if (!res.ok) return null;
        return res.json() as Promise<VocabLesson>;
      })
    );
    return results
      .filter((r): r is PromiseFulfilledResult<VocabLesson | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((v): v is VocabLesson => v !== null);
  } catch {
    return [];
  }
}

async function fetchGrammarQuizzes(lang: string): Promise<GrammarQuiz[]> {
  const base = import.meta.env.BASE_URL;
  try {
    const indexRes = await fetch(`${base}content/grammar/${lang}/index.json`);
    if (!indexRes.ok) return [];
    const lessonIds: string[] = await indexRes.json();
    const quizzes: GrammarQuiz[] = [];
    const results = await Promise.allSettled(
      lessonIds.map(async (id) => {
        const res = await fetch(`${base}content/grammar/${lang}/${id}.md`);
        if (!res.ok) return [];
        const text = await res.text();
        const matches = text.matchAll(/<!-- quiz:(.*?) -->/g);
        const parsed: GrammarQuiz[] = [];
        for (const m of matches) {
          try {
            parsed.push(JSON.parse(m[1]));
          } catch { /* skip malformed */ }
        }
        return parsed;
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') quizzes.push(...r.value);
    }
    return quizzes;
  } catch {
    return [];
  }
}

function generateVocabQuestions(lessons: VocabLesson[], count: number): Question[] {
  const allWords = lessons.flatMap((l) => l.words);
  if (allWords.length < 4) return [];

  const meaningPool = allWords.map((w) => w.meaning);
  const wordPool = allWords.map((w) => w.word);
  const questions: Question[] = [];

  // Collect fill-blank items from exercises
  const fillBlanks: Array<{ sentence: string; answer: string; hint: string; lessonWords: VocabWord[] }> = [];
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      if (ex.type === 'fill-blank' && ex.items) {
        for (const item of ex.items) {
          fillBlanks.push({ ...item, lessonWords: lesson.words });
        }
      }
    }
  }

  const selectedWords = pickRandom(allWords, count);

  for (let i = 0; i < selectedWords.length; i++) {
    const w = selectedWords[i];
    const questionType = Math.random();

    if (questionType < 0.4) {
      // Show word → pick meaning
      const distractors = pickDistractors(w.meaning, meaningPool, 3);
      const opts = shuffle([w.meaning, ...distractors]);
      questions.push({
        id: i,
        category: 'vocabulary',
        question: `What does "${w.word}" (${w.reading}) mean?`,
        options: opts,
        correctIndex: opts.indexOf(w.meaning),
      });
    } else if (questionType < 0.8) {
      // Show meaning → pick word
      const distractors = pickDistractors(w.word, wordPool, 3);
      const opts = shuffle([w.word, ...distractors]);
      questions.push({
        id: i,
        category: 'vocabulary',
        question: `Which word means "${w.meaning}"?`,
        options: opts,
        correctIndex: opts.indexOf(w.word),
      });
    } else {
      // Fill-in-blank from exercises (fallback to meaning→word)
      const fb = fillBlanks.length > 0 ? fillBlanks.splice(Math.floor(Math.random() * fillBlanks.length), 1)[0] : null;
      if (fb) {
        const distractors = pickDistractors(fb.answer, wordPool, 3);
        const opts = shuffle([fb.answer, ...distractors]);
        questions.push({
          id: i,
          category: 'vocabulary',
          question: `Fill in the blank: ${fb.sentence} (${fb.hint})`,
          options: opts,
          correctIndex: opts.indexOf(fb.answer),
        });
      } else {
        const distractors = pickDistractors(w.word, wordPool, 3);
        const opts = shuffle([w.word, ...distractors]);
        questions.push({
          id: i,
          category: 'vocabulary',
          question: `Which word means "${w.meaning}"?`,
          options: opts,
          correctIndex: opts.indexOf(w.word),
        });
      }
    }
  }

  return questions;
}

function generateGrammarQuestions(quizzes: GrammarQuiz[], count: number): Question[] {
  const selected = pickRandom(quizzes, count);
  return selected.map((q, i) => ({
    id: 1000 + i,
    category: 'grammar' as const,
    question: q.question,
    options: q.options,
    correctIndex: q.answer,
  }));
}

export async function generateTestQuestions(lang: string, type: TestType): Promise<Question[]> {
  const counts = QUESTION_COUNTS[type];
  const questions: Question[] = [];

  if (counts.vocab > 0) {
    const lessons = await fetchVocabLessons(lang);
    questions.push(...generateVocabQuestions(lessons, counts.vocab));
  }

  if (counts.grammar > 0) {
    const quizzes = await fetchGrammarQuizzes(lang);
    questions.push(...generateGrammarQuestions(quizzes, counts.grammar));
  }

  // Re-assign IDs after combining and shuffling
  const shuffled = shuffle(questions);
  return shuffled.map((q, i) => ({ ...q, id: i }));
}
