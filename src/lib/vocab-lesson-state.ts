import type { VocabExercise, VocabLesson, VocabWord } from '../types/vocab';

export type FrozenVocabExercise = Exclude<VocabExercise, { type: 'match' }> | {
  type: 'match';
  pairs: number;
  words: VocabWord[];
  wordOrder: number[];
  meaningOrder: number[];
};

export interface VocabItemState {
  kind: 'items';
  index: number;
  input: string;
  showHint: boolean;
  selected: number | null;
  /** One result per submitted item, including the current revealed answer. */
  answers: boolean[];
}

export interface VocabMatchState {
  kind: 'match';
  matched: number[];
  selectedWord: number | null;
  wrongMeaning: number | null;
}

export type VocabExerciseState = VocabItemState | VocabMatchState;

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function freezeVocabExercises(lesson: VocabLesson): FrozenVocabExercise[] {
  const exercises: FrozenVocabExercise[] = lesson.exercises.map((exercise) => {
    if (exercise.type !== 'match') return structuredClone(exercise);
    const words = shuffle(lesson.words).slice(0, exercise.pairs);
    const indices = words.map((_, i) => i);
    return { ...exercise, words, wordOrder: shuffle(indices), meaningOrder: shuffle(indices) };
  });
  if (lesson.words.length >= 4) {
    exercises.push({
      type: 'typing',
      items: shuffle(lesson.words).slice(0, 4).map((word) => ({
        prompt: word.meaning, answer: word.word, hint: word.word[0] + '…',
      })),
    }, {
      type: 'listening',
      items: shuffle(lesson.words).slice(0, 4).map((word) => {
        const options = shuffle([word.meaning, ...shuffle(
          lesson.words.filter((other) => other.word !== word.word),
        ).slice(0, 3).map((other) => other.meaning)]);
        return { word: word.word, options, answer: options.indexOf(word.meaning) };
      }),
    });
  }
  return exercises;
}

export function initialVocabExerciseState(exercise: FrozenVocabExercise): VocabExerciseState {
  return exercise.type === 'match'
    ? { kind: 'match', matched: [], selectedWord: null, wrongMeaning: null }
    : { kind: 'items', index: 0, input: '', showHint: false, selected: null, answers: [] };
}

export function vocabExerciseSize(exercise: FrozenVocabExercise): number {
  return exercise.type === 'match' ? exercise.pairs : exercise.items.length;
}

export function vocabExerciseCorrect(state: VocabExerciseState): number {
  return state.kind === 'match' ? state.matched.length : state.answers.filter(Boolean).length;
}

export function vocabExerciseFinished(
  exercise: FrozenVocabExercise, state: VocabExerciseState,
): boolean {
  return state.kind === 'match'
    ? state.matched.length === vocabExerciseSize(exercise)
    : state.answers.length === vocabExerciseSize(exercise);
}

export function submitVocabItem(
  state: VocabItemState, correct: boolean, selected: number | null = null,
): VocabItemState {
  if (state.answers.length > state.index) return state;
  return { ...state, selected, answers: [...state.answers, correct] };
}

export function nextVocabItem(state: VocabItemState): VocabItemState {
  if (state.answers.length <= state.index) return state;
  return { ...state, index: state.index + 1, input: '', showHint: false, selected: null };
}

export function vocabItemFeedback(state: VocabItemState): 'correct' | 'wrong' | null {
  return state.answers.length > state.index ? (state.answers[state.index] ? 'correct' : 'wrong') : null;
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function integer(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
}
function strings(value: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === 'string');
}
function validWord(value: unknown): value is VocabWord {
  return record(value) && strings(value, ['word', 'reading', 'meaning', 'example', 'exampleMeaning']) &&
    String(value.word).trim().length > 0;
}
function validExercise(value: unknown, wordCount: number): value is VocabExercise {
  if (!record(value)) return false;
  if (value.type === 'match') return integer(value.pairs, 1, wordCount);
  if (!Array.isArray(value.items) || value.items.length === 0) return false;
  return value.items.every((item: unknown) => {
    if (!record(item)) return false;
    if (value.type === 'typing') return strings(item, ['prompt', 'answer', 'hint']);
    if (value.type === 'fill-blank') return strings(item, ['sentence', 'answer', 'hint']);
    if (value.type !== 'multiple-choice' && value.type !== 'listening') return false;
    return strings(item, [value.type === 'listening' ? 'word' : 'question']) &&
      Array.isArray(item.options) && item.options.length >= 2 &&
      item.options.every((option) => typeof option === 'string') &&
      integer(item.answer, 0, item.options.length - 1);
  });
}

export function isVocabLesson(value: unknown): value is VocabLesson {
  if (!record(value) || typeof value.id !== 'string' ||
    !Array.isArray(value.words) || value.words.length === 0 || !value.words.every(validWord)) return false;
  const words = value.words;
  return Array.isArray(value.exercises) &&
    value.exercises.every((exercise) => validExercise(exercise, words.length));
}

/** Older Arabic assets put one complete multiple-choice item on the exercise. */
export function normalizeVocabLesson(value: unknown): VocabLesson | null {
  if (isVocabLesson(value)) return value;
  if (!record(value) || !Array.isArray(value.exercises)) return null;
  const exercises = value.exercises.map((exercise: unknown) => {
    if (!record(exercise) || exercise.type !== 'multiple-choice' || Object.hasOwn(exercise, 'items')) {
      return exercise;
    }
    const { type, ...item } = exercise;
    return { type, items: [item] };
  });
  const normalized = { ...value, exercises };
  return isVocabLesson(normalized) ? normalized : null;
}

export function isFrozenVocabExercise(value: unknown, lesson: VocabLesson): value is FrozenVocabExercise {
  if (!validExercise(value, lesson.words.length)) return false;
  if (value.type !== 'match') return true;
  const frozen = value as Partial<Extract<FrozenVocabExercise, { type: 'match' }>>;
  const permutation = (order: unknown): boolean => Array.isArray(order) &&
    order.length === value.pairs && new Set(order).size === value.pairs &&
    order.every((index) => integer(index, 0, value.pairs - 1));
  return Array.isArray(frozen.words) && frozen.words.length === value.pairs &&
    frozen.words.every((word) => validWord(word) &&
      lesson.words.some((original) => JSON.stringify(original) === JSON.stringify(word))) &&
    permutation(frozen.wordOrder) && permutation(frozen.meaningOrder);
}

export function isVocabExerciseState(
  value: unknown, exercise: FrozenVocabExercise,
): value is VocabExerciseState {
  if (!record(value)) return false;
  const size = vocabExerciseSize(exercise);
  const nullableIndex = (index: unknown, max: number) => index === null || integer(index, 0, max);
  if (exercise.type === 'match') {
    return value.kind === 'match' && Array.isArray(value.matched) &&
      new Set(value.matched).size === value.matched.length &&
      value.matched.every((index) => integer(index, 0, size - 1)) &&
      nullableIndex(value.selectedWord, size - 1) &&
      nullableIndex(value.wrongMeaning, size - 1) &&
      (value.selectedWord === null || !value.matched.includes(value.selectedWord));
  }
  if (value.kind !== 'items' || !integer(value.index, 0, size - 1) ||
    typeof value.input !== 'string' || typeof value.showHint !== 'boolean' ||
    !Array.isArray(value.answers) || !value.answers.every((answer) => typeof answer === 'boolean') ||
    (value.answers.length !== value.index && value.answers.length !== value.index + 1)) return false;
  const choice = exercise.type === 'multiple-choice' || exercise.type === 'listening';
  if (!choice) return value.selected === null;
  return value.answers.length === value.index
    ? value.selected === null
    : integer(value.selected, 0, exercise.items[value.index].options.length - 1) &&
      value.answers[value.index] === (value.selected === exercise.items[value.index].answer);
}
