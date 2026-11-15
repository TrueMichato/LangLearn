import { db } from '../db/schema';
import { markLessonComplete } from '../db/lessons';
import { useXPStore } from '../stores/xpStore';
import type { VocabLesson } from '../types/vocab';
import { vocabLessonRoute } from './routes';
import { XP_PER_EXERCISE_CORRECT, XP_PER_VOCAB_LESSON } from './xp';
import {
  freezeVocabExercises, initialVocabExerciseState, isFrozenVocabExercise,
  isVocabExerciseState, isVocabLesson, normalizeVocabLesson, vocabExerciseCorrect, vocabExerciseFinished,
  vocabExerciseSize, type FrozenVocabExercise, type VocabExerciseState,
} from './vocab-lesson-state';

const ATTEMPT_PREFIX = 'vocab-attempt:v1:';
const RECEIPT_PREFIX = 'vocab-receipt:v1:';
const pendingCheckpoints = new Map<string, { language: string; promise: Promise<void> }>();

/** Bridges rapid unmount/remounts in this tab; durable cursors still arbitrate tabs. */
export function trackVocabCheckpoint(language: string, lessonId: string, promise: Promise<void>): void {
  const key = vocabAttemptKey(language, lessonId);
  pendingCheckpoints.set(key, { language, promise });
  const clear = () => {
    if (pendingCheckpoints.get(key)?.promise === promise) pendingCheckpoints.delete(key);
  };
  void promise.then(clear, clear);
}

export async function waitForVocabCheckpoints(language: string, lessonId?: string): Promise<void> {
  await Promise.all([...pendingCheckpoints].filter(([key, pending]) =>
    pending.language === language && (lessonId === undefined || key === vocabAttemptKey(language, lessonId)))
    .map(([, pending]) => pending.promise));
}

export interface VocabAttemptCursor {
  attemptId: string;
  revision: number;
}

export interface VocabLessonAttempt extends VocabAttemptCursor {
  version: 1;
  language: string;
  lessonId: string;
  title: string;
  contentRevision: string;
  savedAt: number;
  lesson: VocabLesson;
  exercises: FrozenVocabExercise[];
  states: VocabExerciseState[];
  step: 'words' | 'exercise' | 'summary';
  wordIndex: number;
  exerciseIndex: number;
  completion: 'active' | 'pending' | 'credited';
}

export interface VocabCompletionReceipt {
  version: 1;
  attemptId: string;
  language: string;
  lessonId: string;
  xp: number;
  score: number;
  completedAt: string;
  status: 'pending' | 'credited';
}

export class VocabAttemptConflict extends Error {
  constructor() {
    super('This lesson changed in another tab. Reload its saved place before continuing.');
    this.name = 'VocabAttemptConflict';
  }
}

export function vocabAttemptKey(language: string, lessonId: string): string {
  return `${ATTEMPT_PREFIX}${encodeURIComponent(language)}:${encodeURIComponent(lessonId)}`;
}

export function vocabReceiptKey(attemptId: string): string {
  return `${RECEIPT_PREFIX}${attemptId}`;
}

/** Snapshot/renderer compatibility, not a curriculum or knowledge revision. */
export function vocabContentRevision(lesson: VocabLesson): string {
  const text = JSON.stringify(lesson);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `vocab-content-v1:${(hash >>> 0).toString(16)}`;
}

export function createVocabAttempt(
  language: string, lessonId: string, lesson: VocabLesson,
  title = lessonId.replace(/-/g, ' '),
): VocabLessonAttempt {
  if (!isVocabLesson(lesson)) throw new Error('This lesson has unsupported or incomplete content.');
  const exercises = freezeVocabExercises(lesson);
  return {
    version: 1, attemptId: crypto.randomUUID(), language, lessonId, title,
    contentRevision: vocabContentRevision(lesson), savedAt: Date.now(), revision: 0,
    lesson: structuredClone(lesson), exercises, states: exercises.map(initialVocabExerciseState),
    step: 'words', wordIndex: 0, exerciseIndex: 0, completion: 'active',
  };
}

export function isVocabAttempt(value: unknown): value is VocabLessonAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as VocabLessonAttempt;
  if (attempt.version !== 1 || typeof attempt.attemptId !== 'string' || !attempt.attemptId ||
    typeof attempt.language !== 'string' || !attempt.language ||
    typeof attempt.lessonId !== 'string' || !attempt.lessonId ||
    typeof attempt.title !== 'string' || !Number.isFinite(attempt.savedAt) ||
    !Number.isInteger(attempt.revision) || attempt.revision < 0 ||
    !isVocabLesson(attempt.lesson) ||
    attempt.contentRevision !== vocabContentRevision(attempt.lesson) ||
    !Array.isArray(attempt.exercises) || !Array.isArray(attempt.states) ||
    attempt.exercises.length !== attempt.states.length ||
    !attempt.exercises.every((exercise) => isFrozenVocabExercise(exercise, attempt.lesson)) ||
    !attempt.states.every((state, index) => isVocabExerciseState(state, attempt.exercises[index])) ||
    !['words', 'exercise', 'summary'].includes(attempt.step) ||
    !['active', 'pending', 'credited'].includes(attempt.completion) ||
    !Number.isInteger(attempt.wordIndex) || attempt.wordIndex < 0 ||
    attempt.wordIndex >= attempt.lesson.words.length ||
    !Number.isInteger(attempt.exerciseIndex) || attempt.exerciseIndex < 0 ||
    attempt.exerciseIndex > Math.max(0, attempt.exercises.length - 1)) return false;
  // Authored stages must remain in order; generated practice is frozen after them.
  const authored = attempt.lesson.exercises;
  if (attempt.exercises.length !== authored.length + (attempt.lesson.words.length >= 4 ? 2 : 0) ||
    !authored.every((exercise, index) => exercise.type === 'match'
      ? attempt.exercises[index].type === 'match' &&
        vocabExerciseSize(attempt.exercises[index]) === exercise.pairs
      : JSON.stringify(exercise) === JSON.stringify(attempt.exercises[index]))) return false;
  if (attempt.lesson.words.length >= 4 &&
    (attempt.exercises.at(-2)?.type !== 'typing' || attempt.exercises.at(-1)?.type !== 'listening')) return false;
  if (attempt.step === 'exercise' && attempt.exercises.length === 0) return false;
  if (attempt.step !== 'summary' && attempt.completion !== 'active') return false;
  const completed = attempt.step === 'summary' ? attempt.exercises.length :
    attempt.step === 'exercise' ? attempt.exerciseIndex : 0;
  return attempt.exercises.every((exercise, index) =>
    index < completed ? vocabExerciseFinished(exercise, attempt.states[index]) :
      index > (attempt.step === 'exercise' ? attempt.exerciseIndex : -1)
        ? JSON.stringify(attempt.states[index]) === JSON.stringify(initialVocabExerciseState(exercise))
        : true);
}

export type VocabAttemptRead =
  | { kind: 'empty'; raw: null }
  | { kind: 'saved'; attempt: VocabLessonAttempt; raw: string }
  | { kind: 'recovery'; raw: string; message: string };

export function parseVocabAttempt(raw: string, language: string, lessonId: string): VocabAttemptRead {
  try {
    const attempt: unknown = JSON.parse(raw);
    if (isVocabAttempt(attempt) && attempt.language === language && attempt.lessonId === lessonId) {
      return { kind: 'saved', attempt, raw };
    }
  } catch { /* Retain the original bytes for recovery/export. */ }
  return { kind: 'recovery', raw, message: 'Your saved lesson could not be read by this version. It has not been removed.' };
}

export async function readVocabAttempt(language: string, lessonId: string): Promise<VocabAttemptRead> {
  const row = await db.settings.get(vocabAttemptKey(language, lessonId));
  return row ? parseVocabAttempt(row.value, language, lessonId) : { kind: 'empty', raw: null };
}

function assertCursor(read: VocabAttemptRead, expected: VocabAttemptCursor | null): void {
  if (expected === null ? read.kind !== 'empty' :
    read.kind !== 'saved' || read.attempt.attemptId !== expected.attemptId ||
    read.attempt.revision !== expected.revision) throw new VocabAttemptConflict();
}

export async function saveVocabAttempt(
  attempt: VocabLessonAttempt, expected: VocabAttemptCursor | null,
): Promise<VocabLessonAttempt> {
  if (!isVocabAttempt(attempt)) throw new Error('The lesson checkpoint is invalid; the saved copy has not been changed.');
  if (expected && attempt.attemptId !== expected.attemptId) throw new VocabAttemptConflict();
  return db.transaction('rw', db.settings, async () => {
    const current = await readVocabAttempt(attempt.language, attempt.lessonId);
    assertCursor(current, expected);
    if (current.kind === 'saved' && (current.attempt.completion !== 'active' ||
      current.attempt.contentRevision !== attempt.contentRevision ||
      JSON.stringify(current.attempt.exercises) !== JSON.stringify(attempt.exercises))) throw new VocabAttemptConflict();
    const next = { ...attempt, revision: (expected?.revision ?? 0) + 1, savedAt: Date.now() };
    await db.settings.put({ key: vocabAttemptKey(attempt.language, attempt.lessonId), value: JSON.stringify(next) });
    return next;
  });
}

/** Restart is the only intentional replacement, guarded by the exact read bytes. */
export async function restartVocabAttempt(
  attempt: VocabLessonAttempt, expectedRaw: string | null,
): Promise<VocabLessonAttempt> {
  if (!isVocabAttempt(attempt) || attempt.revision !== 0) throw new Error('Invalid new lesson attempt');
  return db.transaction('rw', db.settings, async () => {
    const key = vocabAttemptKey(attempt.language, attempt.lessonId);
    const old = await db.settings.get(key);
    if ((old?.value ?? null) !== expectedRaw) throw new VocabAttemptConflict();
    if (old) {
      // A deliberately replaced checkpoint remains exportable in full backups.
      await db.settings.put({ key: `vocab-attempt-recovery:v1:${crypto.randomUUID()}`, value: old.value });
    }
    const next = { ...attempt, revision: 1, savedAt: Date.now() };
    await db.settings.put({ key, value: JSON.stringify(next) });
    return next;
  });
}

export function vocabAttemptScore(attempt: VocabLessonAttempt) {
  const correct = attempt.states.reduce((sum, state) => sum + vocabExerciseCorrect(state), 0);
  const total = attempt.exercises.reduce((sum, exercise) => sum + vocabExerciseSize(exercise), 0);
  return {
    correct, total, score: total > 0 ? Math.round(correct / total * 100) : 100,
    xp: XP_PER_VOCAB_LESSON + correct * XP_PER_EXERCISE_CORRECT,
  };
}

function parseReceipt(raw: string): VocabCompletionReceipt {
  const receipt = JSON.parse(raw) as VocabCompletionReceipt;
  if (receipt.version !== 1 || typeof receipt.attemptId !== 'string' ||
    typeof receipt.language !== 'string' || typeof receipt.lessonId !== 'string' ||
    !Number.isInteger(receipt.xp) || receipt.xp < XP_PER_VOCAB_LESSON ||
    !Number.isInteger(receipt.score) || receipt.score < 0 || receipt.score > 100 ||
    !Number.isFinite(Date.parse(receipt.completedAt)) ||
    !['pending', 'credited'].includes(receipt.status)) throw new Error('The lesson reward receipt needs recovery.');
  return receipt;
}

export async function completeVocabAttempt(attempt: VocabLessonAttempt): Promise<VocabLessonAttempt> {
  if (!isVocabAttempt(attempt) || attempt.step !== 'summary') throw new Error('The lesson is not finished.');
  await db.transaction('rw', db.settings, db.lessonProgress, async () => {
    const current = await readVocabAttempt(attempt.language, attempt.lessonId);
    if (current.kind !== 'saved' || current.attempt.attemptId !== attempt.attemptId ||
      current.attempt.step !== 'summary') throw new VocabAttemptConflict();
    const receiptRow = await db.settings.get(vocabReceiptKey(attempt.attemptId));
    if (receiptRow) {
      const receipt = parseReceipt(receiptRow.value);
      const score = vocabAttemptScore(current.attempt);
      if (receipt.attemptId !== attempt.attemptId || receipt.language !== attempt.language ||
        receipt.lessonId !== attempt.lessonId || receipt.xp !== score.xp ||
        receipt.score !== score.score) throw new Error('The lesson reward identity or result needs recovery.');
      return;
    }
    assertCursor(current, attempt);
    const { xp, score } = vocabAttemptScore(current.attempt);
    const receipt: VocabCompletionReceipt = {
      version: 1, attemptId: attempt.attemptId, language: attempt.language,
      lessonId: attempt.lessonId, xp, score, status: 'pending', completedAt: new Date().toISOString(),
    };
    await markLessonComplete(attempt.language, `vocab/${attempt.lessonId}`, score);
    await db.settings.put({ key: vocabReceiptKey(attempt.attemptId), value: JSON.stringify(receipt) });
    await db.settings.put({
      key: vocabAttemptKey(attempt.language, attempt.lessonId),
      value: JSON.stringify({ ...current.attempt, completion: 'pending', revision: current.attempt.revision + 1 }),
    });
  });
  // Separate stores, deliberately NOT an atomic transaction. If XP succeeds
  // and finalizing the receipt fails, the durable XP token makes retry safe.
  return db.transaction('rw', db.settings, async () => {
    const receiptRow = await db.settings.get(vocabReceiptKey(attempt.attemptId));
    if (!receiptRow) throw new Error('The lesson reward receipt is missing.');
    const receipt = parseReceipt(receiptRow.value);
    const current = await readVocabAttempt(attempt.language, attempt.lessonId);
    if (current.kind !== 'saved' || current.attempt.attemptId !== attempt.attemptId ||
      current.attempt.step !== 'summary') throw new VocabAttemptConflict();
    const result = vocabAttemptScore(current.attempt);
    if (receipt.attemptId !== attempt.attemptId || receipt.language !== attempt.language ||
      receipt.lessonId !== attempt.lessonId || receipt.xp !== result.xp ||
      receipt.score !== result.score) throw new Error('The lesson reward identity or result needs recovery.');
    if (receipt.status === 'credited' && current.attempt.completion === 'credited') return current.attempt;
    if (receipt.status !== 'credited') useXPStore.getState().creditVocabAttempt(attempt.attemptId, receipt.xp);
    await db.settings.put({ key: receiptRow.key, value: JSON.stringify({ ...receipt, status: 'credited' }) });
    const next: VocabLessonAttempt = {
      ...current.attempt, completion: 'credited', revision: current.attempt.revision + 1,
    };
    await db.settings.put({ key: vocabAttemptKey(attempt.language, attempt.lessonId), value: JSON.stringify(next) });
    return next;
  });
}

export interface VocabAttemptSummary {
  language: string;
  lessonId: string;
  attemptId: string;
  title: string;
  stage: string;
  position: number;
  itemCount: number;
  updatedAt: number;
  route: string;
}

export function summarizeVocabAttempt(attempt: VocabLessonAttempt): VocabAttemptSummary {
  const exercise = attempt.exercises[attempt.exerciseIndex];
  const state = attempt.states[attempt.exerciseIndex];
  const stageNames = {
    match: 'Matching', 'fill-blank': 'Fill in the blank', 'multiple-choice': 'Quiz',
    typing: 'Typing', listening: 'Listening',
  };
  return {
    language: attempt.language, lessonId: attempt.lessonId, attemptId: attempt.attemptId,
    title: attempt.title, updatedAt: attempt.savedAt, route: vocabLessonRoute(attempt.lessonId),
    stage: attempt.step === 'words' ? 'Words' : attempt.step === 'summary' ? 'Finishing lesson' : stageNames[exercise.type],
    position: attempt.step === 'words' ? attempt.wordIndex + 1 : attempt.step === 'summary' ? 1 :
      state.kind === 'items' ? state.index + 1 : Math.min(state.matched.length + 1, vocabExerciseSize(exercise)),
    itemCount: attempt.step === 'words' ? attempt.lesson.words.length : attempt.step === 'summary' ? 1 : vocabExerciseSize(exercise),
  };
}

/** No expiry/cap. Malformed or future-format records stay untouched. Read errors propagate. */
export async function loadLatestVocabAttemptSummary(language: string): Promise<VocabAttemptSummary | null> {
  await waitForVocabCheckpoints(language);
  const rows = await db.settings.toArray();
  const attempts = rows.filter((row) => row.key.startsWith(ATTEMPT_PREFIX)).flatMap((row) => {
    try {
      const value: unknown = JSON.parse(row.value);
      return isVocabAttempt(value) && value.language === language && value.completion !== 'credited' &&
        row.key === vocabAttemptKey(value.language, value.lessonId) ? [value] : [];
    } catch { return []; }
  }).sort((a, b) => b.savedAt - a.savedAt);
  return attempts[0] ? summarizeVocabAttempt(attempts[0]) : null;
}

export class VocabLessonLoadError extends Error {
  readonly kind: 'missing' | 'unavailable' | 'invalid';
  constructor(kind: VocabLessonLoadError['kind']) {
    super(kind === 'missing' ? 'This lesson is no longer available at this address.' :
      kind === 'invalid' ? 'This lesson has unsupported or incomplete content.' :
        'The lesson could not be loaded. Check your connection and try again.');
    this.kind = kind;
  }
}

export async function fetchVocabLesson(language: string, lessonId: string): Promise<VocabLesson> {
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.BASE_URL}content/vocab/${language}/${lessonId}.json`);
  } catch { throw new VocabLessonLoadError('unavailable'); }
  if (!response.ok) throw new VocabLessonLoadError(response.status === 404 ? 'missing' : 'unavailable');
  let lesson: unknown;
  try { lesson = await response.json(); } catch { throw new VocabLessonLoadError('invalid'); }
  const normalized = normalizeVocabLesson(lesson);
  if (!normalized) throw new VocabLessonLoadError('invalid');
  return normalized;
}
