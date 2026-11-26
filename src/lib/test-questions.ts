import { isRTL } from './rtl';
import {
  buildGrammarCardFields,
  extractGrammarCardSources,
  hasBlank,
  type GrammarCardSource,
} from './grammar-cards';
import { MAX_TEST_OUT_LESSONS } from './lesson-assessment-limits';

export type TestType = 'vocabulary' | 'grammar' | 'mixed' | 'full';

export interface Question {
  id: number;
  category: 'vocabulary' | 'grammar';
  question: string;
  options: string[];
  correctIndex: number;
  /** The whole question is target-language text rather than English framing. */
  questionDirection?: 'target';
  /** Option indexes whose text should use the target language's direction. */
  targetOptionIndices?: number[];
  /** The actual source lesson, never a topic inferred from an answer. */
  lessonId?: string;
  lessonTitle?: string;
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
  title?: string;
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

export const QUESTION_COUNTS: Record<TestType, { vocab: number; grammar: number }> = {
  vocabulary: { vocab: 15, grammar: 0 },
  grammar: { vocab: 0, grammar: 15 },
  mixed: { vocab: 10, grammar: 10 },
  full: { vocab: 20, grammar: 20 },
};

function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(
  arr: T[],
  n: number,
  random: () => number = Math.random,
): T[] {
  return shuffle(arr, random).slice(0, n);
}

function pickDistractors(
  correct: string,
  pool: string[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const filtered = [...new Set(pool.filter((w) => w !== correct))];
  return pickRandom(filtered, count, random);
}

async function fetchVocabLessons(lang: string): Promise<VocabLesson[]> {
  const base = import.meta.env.BASE_URL;
  try {
    const indexRes = await fetch(`${base}content/vocab/${lang}/index.json`);
    if (!indexRes.ok) return [];
    const index: { id: string; title?: string }[] = await indexRes.json();
    const results = await Promise.allSettled(
      index.map(async ({ id, title }): Promise<VocabLesson | null> => {
        const res = await fetch(`${base}content/vocab/${lang}/${id}.json`);
        if (!res.ok) return null;
        const lesson = await res.json() as VocabLesson;
        if (!Array.isArray(lesson.words) || !Array.isArray(lesson.exercises)) return null;
        return { ...lesson, id, title };
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

async function fetchGrammarQuizzes(lang: string): Promise<QuizWithLesson[]> {
  const base = import.meta.env.BASE_URL;
  try {
    const indexRes = await fetch(`${base}content/grammar/${lang}/index.json`);
    if (!indexRes.ok) return [];
    const index: { id: string; title?: string }[] = await indexRes.json();
    const quizzes: QuizWithLesson[] = [];
    const results = await Promise.allSettled(
      index.map(async ({ id, title }) => {
        const res = await fetch(`${base}content/grammar/${lang}/${id}.md`);
        if (!res.ok) return [];
        const text = await res.text();
        const matches = text.matchAll(/<!-- quiz:(.*?) -->/g);
        const parsed: QuizWithLesson[] = [];
        for (const m of matches) {
          try {
            const quiz = JSON.parse(m[1]) as GrammarQuiz;
            if (
              quiz.type !== 'multiple-choice' || typeof quiz.question !== 'string' ||
              !Array.isArray(quiz.options) || quiz.options.length < 2 ||
              !quiz.options.every((option) => typeof option === 'string' && option.trim()) ||
              new Set(quiz.options).size !== quiz.options.length ||
              !Number.isInteger(quiz.answer) || quiz.answer < 0 || quiz.answer >= quiz.options.length
            ) continue;
            parsed.push({ ...quiz, lessonId: id, lessonTitle: title });
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

function generateVocabQuestions(
  lessons: VocabLesson[],
  count: number,
  random: () => number,
): Question[] {
  const allWords = lessons.flatMap((lesson) => lesson.words.map((word) => ({
    ...word, lessonId: lesson.id, lessonTitle: lesson.title,
  })));
  if (allWords.length < 4) return [];

  const meaningPool = allWords.map((w) => w.meaning);
  const wordPool = allWords.map((w) => w.word);
  const questions: Question[] = [];

  // Collect fill-blank items from exercises
  const fillBlanks: Array<{ sentence: string; answer: string; hint: string; lessonId: string; lessonTitle?: string }> = [];
  for (const lesson of lessons) {
    for (const ex of lesson.exercises) {
      if (ex.type === 'fill-blank' && ex.items) {
        for (const item of ex.items) {
          fillBlanks.push({ ...item, lessonId: lesson.id, lessonTitle: lesson.title });
        }
      }
    }
  }

  const selectedWords = pickRandom(allWords, count, random);

  for (let i = 0; i < selectedWords.length; i++) {
    const w = selectedWords[i];
    const questionType = random();

    if (questionType < 0.4) {
      // Show word → pick meaning
      const distractors = pickDistractors(w.meaning, meaningPool, 3, random);
      if (distractors.length < 3) continue;
      const opts = shuffle([w.meaning, ...distractors], random);
      questions.push({
        id: i,
        category: 'vocabulary',
        question: `What does "${w.word}" (${w.reading}) mean?`,
        options: opts,
        correctIndex: opts.indexOf(w.meaning),
        lessonId: w.lessonId,
        lessonTitle: w.lessonTitle,
      });
    } else if (questionType < 0.8) {
      // Show meaning → pick word
      const distractors = pickDistractors(w.word, wordPool, 3, random);
      if (distractors.length < 3) continue;
      const opts = shuffle([w.word, ...distractors], random);
      questions.push({
        id: i,
        category: 'vocabulary',
        question: `Which word means "${w.meaning}"?`,
        options: opts,
        correctIndex: opts.indexOf(w.word),
        lessonId: w.lessonId,
        lessonTitle: w.lessonTitle,
      });
    } else {
      // Fill-in-blank from exercises (fallback to meaning→word)
      const fb = fillBlanks.length > 0
        ? fillBlanks.splice(Math.floor(random() * fillBlanks.length), 1)[0]
        : null;
      if (fb) {
        const distractors = pickDistractors(fb.answer, wordPool, 3, random);
        if (distractors.length < 3) continue;
        const opts = shuffle([fb.answer, ...distractors], random);
        questions.push({
          id: i,
          category: 'vocabulary',
          question: `Fill in the blank: ${fb.sentence} (${fb.hint})`,
          options: opts,
          correctIndex: opts.indexOf(fb.answer),
          lessonId: fb.lessonId,
          lessonTitle: fb.lessonTitle,
        });
      } else {
        const distractors = pickDistractors(w.word, wordPool, 3, random);
        if (distractors.length < 3) continue;
        const opts = shuffle([w.word, ...distractors], random);
        questions.push({
          id: i,
          category: 'vocabulary',
          question: `Which word means "${w.meaning}"?`,
          options: opts,
          correctIndex: opts.indexOf(w.word),
          lessonId: w.lessonId,
          lessonTitle: w.lessonTitle,
        });
      }
    }
  }

  return questions;
}

function generateGrammarQuestions(
  quizzes: QuizWithLesson[],
  count: number,
  random: () => number,
): Question[] {
  const selected = pickRandom(quizzes, count, random);
  return selected.map((q, i) => ({
    id: 1000 + i,
    category: 'grammar' as const,
    question: q.question,
    options: q.options,
    correctIndex: q.answer,
    lessonId: q.lessonId,
    lessonTitle: q.lessonTitle,
  }));
}

export async function generateTestQuestions(
  lang: string,
  type: TestType,
  random: () => number = Math.random,
): Promise<Question[]> {
  const counts = QUESTION_COUNTS[type];
  const questions: Question[] = [];

  if (counts.vocab > 0) {
    const lessons = await fetchVocabLessons(lang);
    questions.push(...generateVocabQuestions(lessons, counts.vocab, random));
  }

  if (counts.grammar > 0) {
    const quizzes = await fetchGrammarQuizzes(lang);
    questions.push(...generateGrammarQuestions(quizzes, counts.grammar, random));
  }

  // Re-assign IDs after combining and shuffling
  const shuffled = shuffle(questions, random);
  return shuffled.map((q, i) => ({ ...q, id: i, ...directionMetadata(lang, q.question, q.options) }));
}

// ─── Scoped "test out of a lesson range" generation ─────────────────────────
//
// Unlike `generateTestQuestions` above (which samples across an entire
// language's content for standalone practice checks, untouched by any
// of this), the functions below take an *explicit, ordered* list of lesson
// ids — exactly the range a learner picked to test out of — and guarantee
// two things the standalone test never needed to:
//
//   1. Every lesson id in the input either contributes at least one
//      attributed question, or is reported back as "missing" so the caller
//      can refuse the attempt instead of silently granting credit for a
//      lesson nobody was actually tested on.
//   2. Every generated question carries the `lessonId` it came from.

/** A cap so an enormous range (most of a course) can't generate an unbounded quiz. */
const MAX_RANGE_QUESTIONS = MAX_TEST_OUT_LESSONS;
/** Five checks make an 80% pass meaningful while keeping each lesson bounded. */
const RANGE_QUESTIONS_PER_LESSON = 5;

function requiredQuestionsPerLesson(lessonCount: number): number {
  if (lessonCount <= 0) return 0;
  return Math.max(
    1,
    Math.min(
      RANGE_QUESTIONS_PER_LESSON,
      Math.floor(MAX_RANGE_QUESTIONS / lessonCount),
    ),
  );
}

function directionMetadata(
  lang: string,
  question: string,
  options: readonly string[],
): Pick<Question, 'questionDirection' | 'targetOptionIndices'> {
  if (!isRTL(lang)) return {};
  const targetChars = (question.match(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/g) ?? [])
    .length;
  const latinChars = (question.match(/[A-Za-z]/g) ?? []).length;
  const targetOptionIndices = options.flatMap((option, index) =>
    /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(option) ? [index] : [],
  );
  return {
    ...(targetChars > latinChars ? { questionDirection: 'target' as const } : {}),
    ...(targetOptionIndices.length > 0 ? { targetOptionIndices } : {}),
  };
}

function targetOptionMetadata(
  lang: string,
  options: readonly string[],
): Pick<Question, 'targetOptionIndices'> {
  const { targetOptionIndices } = directionMetadata(lang, '', options);
  return targetOptionIndices ? { targetOptionIndices } : {};
}

export interface LessonRangeQuestions {
  questions: Question[];
  /** Lesson ids (subset of the input, same order) that contributed a question. */
  coveredLessonIds: string[];
  /**
   * Lesson ids that could not provide enough attributable questions — no
   * vocab words, too few distinct distractors, or too little grammar metadata.
   * A non-empty list means a meaningful check cannot be guaranteed and the
   * range should be rejected.
   */
  missingLessonIds: string[];
}

async function fetchVocabLessonsByIds(lang: string, lessonIds: readonly string[]): Promise<VocabLesson[]> {
  const base = import.meta.env.BASE_URL;
  const byId = new Map<string, VocabLesson>();
  const results = await Promise.allSettled(
    lessonIds.map(async (id) => {
      const res = await fetch(`${base}content/vocab/${lang}/${id}.json`);
      if (!res.ok) return null;
      const lesson = (await res.json()) as VocabLesson;
      return { ...lesson, id };
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) byId.set(r.value.id, r.value);
  }
  // Preserve input order, dropping ids whose content failed to load —
  // those surface as `missingLessonIds` by the caller.
  return lessonIds.map((id) => byId.get(id)).filter((l): l is VocabLesson => l !== undefined);
}

interface WordWithLesson extends VocabWord {
  lessonId: string;
}

/** One MC question from `word`, or null if there aren't enough distinct
 *  distractors anywhere in `pool` to build four real options. */
function buildVocabQuestion(
  lang: string,
  word: WordWithLesson,
  meaningPool: string[],
  wordPool: string[],
  usedQuestions: ReadonlySet<string>,
  wordToMeaning: boolean,
): Question | null {
  if (wordToMeaning) {
    const question = `What does "${word.word}" (${word.reading}) mean?`;
    if (usedQuestions.has(question)) return null;
    const distractors = pickDistractors(word.meaning, meaningPool, 3);
    if (distractors.length < 3) return null;
    const opts = shuffle([word.meaning, ...distractors]);
    return {
      id: 0,
      category: 'vocabulary',
      question,
      options: opts,
      correctIndex: opts.indexOf(word.meaning),
      lessonId: word.lessonId,
      ...directionMetadata(lang, question, opts),
    };
  }
  const question = `Which word means "${word.meaning}"?`;
  if (usedQuestions.has(question)) return null;
  const distractors = pickDistractors(word.word, wordPool, 3);
  if (distractors.length < 3) return null;
  const opts = shuffle([word.word, ...distractors]);
  return {
    id: 0,
    category: 'vocabulary',
    question,
    options: opts,
    correctIndex: opts.indexOf(word.word),
    lessonId: word.lessonId,
    ...directionMetadata(lang, question, opts),
  };
}

/** Try both directions for every word until one yields a new usable question. */
function coveringVocabQuestion(
  lang: string,
  lesson: VocabLesson,
  meaningPool: string[],
  wordPool: string[],
  usedQuestions: ReadonlySet<string>,
): Question | null {
  for (const word of shuffle(lesson.words)) {
    for (const wordToMeaning of shuffle([true, false])) {
      const q = buildVocabQuestion(
        lang,
        { ...word, lessonId: lesson.id },
        meaningPool,
        wordPool,
        usedQuestions,
        wordToMeaning,
      );
      if (q) return q;
    }
  }
  return null;
}

async function generateVocabRangeQuestions(lang: string, lessonIds: readonly string[]): Promise<LessonRangeQuestions> {
  const lessons = await fetchVocabLessonsByIds(lang, lessonIds);
  const lessonsById = new Map(lessons.map((l) => [l.id, l]));
  const meaningPool = lessons.flatMap((l) => l.words.map((w) => w.meaning));
  const wordPool = lessons.flatMap((l) => l.words.map((w) => w.word));

  const questions: Question[] = [];
  const coveredLessonIds: string[] = [];
  const missingLessonIds: string[] = [];
  const usedQuestions = new Set<string>();

  // Pass 1: one guaranteed, attributed question per lesson.
  for (const lessonId of lessonIds) {
    const lesson = lessonsById.get(lessonId);
    const q = lesson
      ? coveringVocabQuestion(
          lang,
          lesson,
          meaningPool,
          wordPool,
          usedQuestions,
        )
      : null;
    if (!q) {
      missingLessonIds.push(lessonId);
      continue;
    }
    questions.push(q);
    usedQuestions.add(q.question);
    coveredLessonIds.push(lessonId);
  }

  // Add questions round-robin so every covered lesson gets comparable depth
  // before the overall cap is reached.
  for (let round = 1; round < RANGE_QUESTIONS_PER_LESSON; round++) {
    for (const lessonId of coveredLessonIds) {
      if (questions.length >= MAX_RANGE_QUESTIONS) break;
      const q = coveringVocabQuestion(
        lang,
        lessonsById.get(lessonId)!,
        meaningPool,
        wordPool,
        usedQuestions,
      );
      if (q) {
        questions.push(q);
        usedQuestions.add(q.question);
      }
    }
    if (questions.length >= MAX_RANGE_QUESTIONS) break;
  }

  const required = requiredQuestionsPerLesson(lessonIds.length);
  const counts = new Map<string, number>();
  for (const question of questions) {
    if (!question.lessonId) continue;
    counts.set(
      question.lessonId,
      (counts.get(question.lessonId) ?? 0) + 1,
    );
  }
  const insufficient = coveredLessonIds.filter(
    (lessonId) => (counts.get(lessonId) ?? 0) < required,
  );
  const validCoveredLessonIds = coveredLessonIds.filter(
    (lessonId) => !insufficient.includes(lessonId),
  );
  const validLessons = new Set(validCoveredLessonIds);
  const shuffled = shuffle(
    questions.filter(
      (question) =>
        question.lessonId !== undefined && validLessons.has(question.lessonId),
    ),
  ).map((q, i) => ({ ...q, id: i }));
  return {
    questions: shuffled,
    coveredLessonIds: validCoveredLessonIds,
    missingLessonIds: [...missingLessonIds, ...insufficient],
  };
}

interface QuizWithLesson extends GrammarQuiz {
  lessonId: string;
  lessonTitle?: string;
}

interface GrammarLessonMaterial {
  quizzes: QuizWithLesson[];
  cards: GrammarCardSource[];
}

interface GrammarLessonMeta {
  id: string;
  title: string;
}

async function fetchGrammarLessonMeta(
  lang: string,
): Promise<Map<string, GrammarLessonMeta>> {
  try {
    const res = await fetch(
      `${import.meta.env.BASE_URL}content/grammar/${lang}/index.json`,
    );
    if (!res.ok) return new Map();
    const lessons = (await res.json()) as GrammarLessonMeta[];
    return new Map(lessons.map((lesson) => [lesson.id, lesson]));
  } catch {
    return new Map();
  }
}

async function fetchGrammarMaterialByIds(
  lang: string,
  lessonIds: readonly string[],
): Promise<Map<string, GrammarLessonMaterial>> {
  const base = import.meta.env.BASE_URL;
  const byLesson = new Map<string, GrammarLessonMaterial>();
  const results = await Promise.allSettled(
    lessonIds.map(async (id) => {
      const res = await fetch(`${base}content/grammar/${lang}/${id}.md`);
      if (!res.ok) {
        return { id, quizzes: [] as GrammarQuiz[], cards: [] as GrammarCardSource[] };
      }
      const text = await res.text();
      const quizzes: GrammarQuiz[] = [];
      for (const m of text.matchAll(/<!-- quiz:(.*?) -->/g)) {
        try {
          quizzes.push(JSON.parse(m[1]));
        } catch {
          /* skip malformed */
        }
      }
      return { id, quizzes, cards: extractGrammarCardSources(text) };
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled') {
      byLesson.set(r.value.id, {
        quizzes: r.value.quizzes.map((q) => ({
          ...q,
          lessonId: r.value.id,
        })),
        cards: r.value.cards,
      });
    }
  }
  return byLesson;
}

async function generateGrammarRangeQuestions(lang: string, lessonIds: readonly string[]): Promise<LessonRangeQuestions> {
  const [byLesson, lessonMeta] = await Promise.all([
    fetchGrammarMaterialByIds(lang, lessonIds),
    fetchGrammarLessonMeta(lang),
  ]);

  const questions: Question[] = [];
  const coveredLessonIds: string[] = [];
  const missingLessonIds: string[] = [];
  const required = requiredQuestionsPerLesson(lessonIds.length);
  const cardAnswerPool = [...byLesson.values()].flatMap((material) =>
    material.cards.flatMap((card) => {
      const fields = buildGrammarCardFields(card);
      return fields?.word ? [fields.word] : [];
    }),
  );
  const optionPool = [...byLesson.values()].flatMap((material) =>
    material.quizzes.flatMap((quiz) => quiz.options),
  );
  const answerPool = [...cardAnswerPool, ...optionPool];
  const rulePool = [...byLesson.values()].flatMap((material) =>
    material.cards.map((card) => card.rule).filter(Boolean),
  );
  const topicPool = [...lessonMeta.values()].map((lesson) => lesson.title);
  const candidatesByLesson = new Map<string, Question[]>();

  for (const lessonId of lessonIds) {
    const material = byLesson.get(lessonId);
    if (!material) continue;
    const candidates: Question[] = material.quizzes.map((quiz) => ({
      id: 0,
      category: 'grammar',
      question: quiz.question,
      options: quiz.options,
      correctIndex: quiz.answer,
      lessonId,
      ...directionMetadata(lang, quiz.question, quiz.options),
    }));
    const clozeCandidates: Question[] = [];
    for (const card of material.cards) {
      const fields = buildGrammarCardFields(card);
      if (!fields?.word) continue;
      if (hasBlank(fields.contextSentence)) {
        const question = `Complete the example: ${fields.contextSentence}`;
        const distractors = pickDistractors(fields.word, answerPool, 3);
        if (distractors.length === 3) {
          const options = shuffle([fields.word, ...distractors]);
          clozeCandidates.push({
            id: 0,
            category: 'grammar',
            question,
            options,
            correctIndex: options.indexOf(fields.word),
            lessonId,
            ...targetOptionMetadata(lang, options),
          });
        }
      }

      if (card.example) {
        const distractors = pickDistractors(card.rule, rulePool, 3);
        if (distractors.length > 0) {
          const options = shuffle([card.rule, ...distractors]);
          const question = `Which rule does this example illustrate? ${card.example}`;
          candidates.push({
            id: 0,
            category: 'grammar',
            question,
            options,
            correctIndex: options.indexOf(card.rule),
            lessonId,
            ...targetOptionMetadata(lang, options),
          });
        }
      }

      const topic = lessonMeta.get(lessonId)?.title;
      if (topic) {
        const distractors = pickDistractors(topic, topicPool, 3);
        if (distractors.length === 3) {
          const topicPrompts = [
            card.example
              ? `Which grammar topic best matches this example? ${card.example}`
              : null,
            card.rule
              ? `Which grammar topic covers this rule? ${card.rule}`
              : null,
            card.hint
              ? `Which grammar topic does this hint support? ${card.hint}`
              : null,
            card.explanation
              ? `Which grammar topic explains this idea? ${card.explanation}`
              : null,
          ].filter((prompt): prompt is string => prompt !== null);
          for (const question of topicPrompts) {
            const options = shuffle([topic, ...distractors]);
            candidates.push({
              id: 0,
              category: 'grammar',
              question,
              options,
              correctIndex: options.indexOf(topic),
              lessonId,
              ...targetOptionMetadata(lang, options),
            });
          }
        }
      }
    }
    const unique = [
      ...new Map(
        [...candidates, ...clozeCandidates].map((candidate) => [
          candidate.question,
          candidate,
        ]),
      ).values(),
    ];
    const clozeQuestions = unique.filter((candidate) =>
      candidate.question.startsWith('Complete the example:'),
    );
    const otherQuestions = unique.filter(
      (candidate) => !candidate.question.startsWith('Complete the example:'),
    );
    const [firstCloze, ...remainingCloze] = shuffle(clozeQuestions);
    candidatesByLesson.set(
      lessonId,
      firstCloze
        ? [firstCloze, ...shuffle(otherQuestions), ...remainingCloze]
        : shuffle(otherQuestions),
    );
  }

  // Pass 1: one guaranteed, attributed question per lesson.
  for (const lessonId of lessonIds) {
    const candidates = candidatesByLesson.get(lessonId) ?? [];
    if (candidates.length < required) {
      missingLessonIds.push(lessonId);
      continue;
    }
    const chosen = candidates.shift();
    if (!chosen) {
      missingLessonIds.push(lessonId);
      continue;
    }
    questions.push(chosen);
    coveredLessonIds.push(lessonId);
  }

  for (let round = 1; round < RANGE_QUESTIONS_PER_LESSON; round++) {
    for (const lessonId of coveredLessonIds) {
      if (questions.length >= MAX_RANGE_QUESTIONS) break;
      const chosen = candidatesByLesson.get(lessonId)?.shift();
      if (chosen) questions.push(chosen);
    }
    if (questions.length >= MAX_RANGE_QUESTIONS) break;
  }

  const shuffled = shuffle(questions).map((q, i) => ({ ...q, id: i }));
  return { questions: shuffled, coveredLessonIds, missingLessonIds };
}

/**
 * Generates an assessment for testing out of `lessonIds` (an ordered, single
 * -track range within Grammar or Vocabulary — the caller, not this function,
 * is responsible for keeping the two tracks from mixing).
 *
 * `missingLessonIds` in the result is the coverage guarantee surfacing as
 * data: if it's non-empty, at least one lesson in the range couldn't be
 * given an attributable question, and the caller should refuse the test-out
 * attempt for that range rather than silently granting credit for a lesson
 * nobody was actually tested on.
 */
export async function generateLessonRangeQuestions(
  lang: string,
  kind: 'grammar' | 'vocab',
  lessonIds: readonly string[],
): Promise<LessonRangeQuestions> {
  if (lessonIds.length === 0) {
    return { questions: [], coveredLessonIds: [], missingLessonIds: [] };
  }
  if (lessonIds.length > MAX_RANGE_QUESTIONS) {
    return {
      questions: [],
      coveredLessonIds: [],
      missingLessonIds: [...lessonIds],
    };
  }
  return kind === 'grammar'
    ? generateGrammarRangeQuestions(lang, lessonIds)
    : generateVocabRangeQuestions(lang, lessonIds);
}
