import type { VocabLesson } from '../types/vocab';
import {
  completeVocabAttempt, createVocabAttempt, fetchVocabLesson, readVocabAttempt,
  restartVocabAttempt, saveVocabAttempt, vocabContentRevision, VocabAttemptConflict,
  VocabLessonLoadError, trackVocabCheckpoint, waitForVocabCheckpoints,
  type VocabAttemptCursor, type VocabLessonAttempt,
} from './vocab-lesson-attempt';

export interface VocabLessonSessionSnapshot {
  phase: 'loading' | 'ready' | 'recovery' | 'error';
  attempt: VocabLessonAttempt | null;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'conflict';
  message: string;
  resumed: boolean;
}

/**
 * Event-driven checkpoints: hydration never triggers a blank-state write effect.
 * The queue serializes this tab's writes; Dexie cursor checks arbitrate other tabs.
 */
export class VocabLessonSession {
  private snapshot: VocabLessonSessionSnapshot = {
    phase: 'loading', attempt: null, saveStatus: 'saved', message: '', resumed: false,
  };
  private listeners = new Set<() => void>();
  private cursor: VocabAttemptCursor | null = null;
  private raw: string | null = null;
  private replacement: VocabLesson | null = null;
  private queue: Promise<void> = Promise.resolve();
  private loading = false;
  private blocked = false;
  private contentMessage = '';
  private restarting = false;
  readonly language: string;
  readonly lessonId: string;
  private title?: string;

  constructor(language: string, lessonId: string, title?: string) {
    this.language = language;
    this.lessonId = lessonId;
    this.title = title;
  }

  getSnapshot = (): VocabLessonSessionSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setTitle = (title?: string): void => {
    if (!title || title === this.title) return;
    this.title = title;
    const attempt = this.snapshot.attempt;
    if (this.snapshot.phase !== 'ready' || !attempt || attempt.completion !== 'active' || attempt.title === title) return;
    const next = { ...attempt, title };
    this.publish({ attempt: next });
    this.persist(next);
  };

  private publish(update: Partial<VocabLessonSessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...update };
    for (const listener of this.listeners) listener();
  }

  async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.publish({ phase: 'loading', message: '' });
    try {
      await Promise.all([this.queue, waitForVocabCheckpoints(this.language, this.lessonId)]);
      if (this.snapshot.saveStatus === 'unsaved' && this.snapshot.attempt) {
        this.retrySave();
        await this.queue;
        if (this.blocked) {
          this.publish({ phase: 'ready' });
          return;
        }
      }
      const read = await readVocabAttempt(this.language, this.lessonId);
      this.raw = read.raw;
      this.cursor = read.kind === 'saved' ? read.attempt : null;
      this.replacement = null;
      if (read.kind === 'recovery') {
        this.publish({ phase: 'recovery', attempt: null, message: read.message });
        return;
      }
      if (read.kind === 'saved') {
        this.blocked = false;
        const attempt = this.title && this.title !== read.attempt.title && read.attempt.completion === 'active'
          ? { ...read.attempt, title: this.title } : read.attempt;
        this.contentMessage = 'Continuing your saved lesson copy while checking for content updates.';
        this.publish({
          phase: 'ready', attempt, resumed: true, saveStatus: 'saved', message: this.contentMessage,
        });
        if (attempt !== read.attempt || (attempt.step === 'summary' && attempt.completion !== 'credited')) this.persist(attempt);
      }
      let lesson: VocabLesson;
      try {
        lesson = await fetchVocabLesson(this.language, this.lessonId);
      } catch (error) {
        if (read.kind === 'saved' && this.snapshot.attempt?.attemptId !== read.attempt.attemptId) return;
        if (read.kind === 'saved' && error instanceof VocabLessonLoadError && error.kind === 'unavailable') {
          this.contentMessage = 'Using your saved lesson copy. The latest content could not be checked; you can retry.';
          if (!this.blocked) this.publish({ message: this.contentMessage });
          return;
        }
        await this.queue;
        this.publish({
          phase: read.kind === 'saved' ? 'recovery' : 'error',
          attempt: read.kind === 'saved' ? this.snapshot.attempt : null,
          message: error instanceof Error ? error.message : 'The lesson could not be loaded. Please retry.',
        });
        return;
      }
      if (read.kind === 'saved' && this.snapshot.attempt?.attemptId !== read.attempt.attemptId) return;
      this.replacement = lesson;
      if (read.kind === 'saved' && read.attempt.contentRevision !== vocabContentRevision(lesson)) {
        await this.queue;
        this.publish({
          phase: 'recovery',
          message: 'This lesson has changed since your saved attempt. Continue the saved copy, or restart with the updated lesson.',
        });
        return;
      }
      this.contentMessage = '';
      if (read.kind === 'saved') {
        if (!this.blocked) this.publish({ message: '' });
        return;
      }
      const attempt = createVocabAttempt(this.language, this.lessonId, lesson, this.title);
      this.blocked = false;
      this.publish({ phase: 'ready', attempt, resumed: false, saveStatus: 'saved', message: '' });
      this.persist(attempt);
    } catch (error) {
      this.publish({ phase: 'error', message: error instanceof Error ? error.message : 'Your saved place could not be read. Please retry.' });
    } finally {
      this.loading = false;
    }
  }

  continueSaved = (): void => {
    const attempt = this.snapshot.attempt;
    if (this.snapshot.phase !== 'recovery' || !attempt) return;
    this.contentMessage = 'Continuing your saved lesson copy.';
    this.publish({
      phase: 'ready', resumed: true,
      message: this.blocked ? 'Your place has not been saved. Retry saving before leaving.' : this.contentMessage,
    });
    if (!this.blocked && attempt.step === 'summary' && attempt.completion !== 'credited') this.persist(attempt);
  };

  checkpoint = (update: Partial<Pick<VocabLessonAttempt, 'wordIndex' | 'step' | 'exerciseIndex' | 'states'>>): void => {
    const attempt = this.snapshot.attempt;
    if (this.snapshot.phase !== 'ready' || !attempt || attempt.completion !== 'active' ||
      this.snapshot.saveStatus === 'conflict') return;
    const next = { ...attempt, ...update };
    this.publish({ attempt: next });
    this.persist(next);
  };

  private persist(attempt: VocabLessonAttempt): void {
    if (this.blocked) return;
    this.publish({ saveStatus: 'saving' });
    this.queue = this.queue.then(async () => {
      if (this.blocked) return;
      try {
        let saved: VocabLessonAttempt;
        // A failed reward may already have committed progress and its receipt.
        // Retrying completion must not overwrite that receipt with an active draft.
        if (attempt.step === 'summary' && this.cursor &&
          this.snapshot.attempt?.attemptId === attempt.attemptId) {
          const current = await readVocabAttempt(this.language, this.lessonId);
          if (current.kind === 'saved' && current.attempt.attemptId === attempt.attemptId &&
            current.attempt.completion !== 'active') {
            saved = current.attempt;
          } else {
            saved = await saveVocabAttempt(attempt, this.cursor);
          }
        } else {
          saved = await saveVocabAttempt(attempt, this.cursor);
        }
        this.cursor = saved;
        if (saved.step === 'summary') saved = await completeVocabAttempt(saved);
        this.cursor = saved;
        this.raw = JSON.stringify(saved);
        if (this.snapshot.attempt === attempt) {
          this.publish({ attempt: saved, saveStatus: 'saved', message: this.contentMessage });
        }
      } catch (error) {
        this.blocked = true;
        this.publish({
          saveStatus: error instanceof VocabAttemptConflict ? 'conflict' : 'unsaved',
          message: error instanceof VocabAttemptConflict ? error.message :
            attempt.step === 'summary'
              ? 'Your results are still here, but finishing the save and reward needs a retry. XP is not confirmed yet.'
              : 'Your place has not been saved. You can keep studying here, then retry saving before leaving.',
        });
      }
    });
    trackVocabCheckpoint(this.language, this.lessonId, this.queue);
  }

  retrySave = (): void => {
    if (!this.snapshot.attempt || this.snapshot.saveStatus === 'conflict') return;
    this.blocked = false;
    this.persist(this.snapshot.attempt);
  };

  async restart(): Promise<void> {
    if (this.restarting) return;
    this.restarting = true;
    await Promise.all([this.queue, waitForVocabCheckpoints(this.language, this.lessonId)]);
    const currentAttempt = this.snapshot.attempt;
    try {
      if (currentAttempt?.step === 'summary' && currentAttempt.completion !== 'credited') {
        throw new Error('Please finish saving this lesson and its reward before starting a retake.');
      }
      const read = await readVocabAttempt(this.language, this.lessonId);
      if (this.cursor && (read.kind !== 'saved' || read.attempt.attemptId !== this.cursor.attemptId ||
        read.attempt.revision !== this.cursor.revision)) throw new VocabAttemptConflict();
      if (!this.cursor && read.raw !== this.raw) throw new VocabAttemptConflict();
      const lesson = this.replacement ?? currentAttempt?.lesson ??
        await fetchVocabLesson(this.language, this.lessonId);
      const attempt = await restartVocabAttempt(
        createVocabAttempt(this.language, this.lessonId, lesson, this.title ?? currentAttempt?.title),
        read.raw,
      );
      this.cursor = attempt;
      this.raw = JSON.stringify(attempt);
      this.blocked = false;
      this.contentMessage = '';
      this.publish({ phase: 'ready', attempt, saveStatus: 'saved', resumed: false, message: '' });
    } catch (error) {
      this.publish({
        saveStatus: error instanceof VocabAttemptConflict ? 'conflict' : 'unsaved',
        message: error instanceof Error ? error.message : 'The restart could not be saved. Your old place is still here.',
      });
    } finally {
      this.restarting = false;
    }
  }

  /** Exposes the retained record for an explicit recovery download. */
  recoveryData = (): string | null => this.snapshot.attempt ? JSON.stringify(this.snapshot.attempt) : this.raw;
  settled = (): Promise<void> => this.queue;
}
