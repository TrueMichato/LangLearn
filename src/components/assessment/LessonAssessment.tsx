import { useEffect, useMemo, useRef, useState } from 'react';
import GrammarQuiz from '../grammar/GrammarQuiz';
import { generateLessonRangeQuestions, type Question } from '../../lib/test-questions';
import { markLessonsComplete } from '../../db/lessons';
import { passesAssessment, scorePercent } from '../../lib/lesson-assessment';
import { SkeletonList } from '../common/Skeleton';
import AssessmentResult from './AssessmentResult';
import AssessmentBlocked from './AssessmentBlocked';
import {
  deleteAssessmentDraft,
  readAssessmentDraft,
  saveAssessmentDraft,
} from '../../lib/lesson-assessment-draft';

interface LessonRef {
  id: string;
  title: string;
}

interface Props {
  lang: string;
  kind: 'grammar' | 'vocab';
  /** The ordered, single-track range to test out of — see `computeTestOutRange`. */
  lessons: LessonRef[];
  /** Leave without changing progress. */
  onExit: () => void;
  returnLabel?: string;
  onPass?: () => void;
  passActionLabel?: string;
  failActionLabel?: string;
  nextLessonTitle?: string;
}

type Phase =
  | 'intro'
  | 'loading'
  | 'blocked'
  | 'active'
  | 'result'
  | 'error';

/**
 * Shared assessment flow for testing out of a Grammar or Vocabulary lesson
 * range. One component serves both tracks because the underlying question
 * shape (multiple choice, one correct index) is identical — only the
 * question *generation* differs, and that lives in `test-questions.ts`.
 *
 * Passing (≥80%) writes every lesson in the range complete in one atomic
 * transaction via `markLessonsComplete`, tagged `completionMethod:
 * 'tested-out'`. Failing changes nothing. Neither outcome awards XP — that
 * stays earned only by working through a lesson's own content or exercises.
 */
export default function LessonAssessment({
  lang,
  kind,
  lessons,
  onExit,
  returnLabel = 'Back to lessons',
  onPass = onExit,
  passActionLabel = 'Continue',
  failActionLabel = 'Study the lessons',
  nextLessonTitle,
}: Props) {
  const lessonIdsKey = lessons.map((lesson) => lesson.id).join('|');
  const lessonIds = useMemo(() => lessonIdsKey.split('|'), [lessonIdsKey]);
  const draftIdentity = useMemo(
    () => ({ language: lang, kind, lessonIds }),
    [kind, lang, lessonIds],
  );
  const [savedDraft, setSavedDraft] = useState(() =>
    readAssessmentDraft(draftIdentity),
  );
  const [phase, setPhase] = useState<Phase>('intro');
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [missing, setMissing] = useState<LessonRef[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [draftSaveFailed, setDraftSaveFailed] = useState(false);
  const passRecorded = useRef(false);

  useEffect(() => {
    if (!shouldGenerate) return;
    let active = true;
    passRecorded.current = false;
    setPhase('loading');
    setIndex(0);
    setCorrect(0);
    setSelectedIndex(null);
    setDraftSaveFailed(false);

    generateLessonRangeQuestions(lang, kind, lessonIds).then((result) => {
      if (!active) return;
      setShouldGenerate(false);
      if (result.missingLessonIds.length > 0 || result.questions.length === 0) {
        const missingSet = new Set(result.missingLessonIds);
        const missingRefs =
          missingSet.size > 0
            ? lessons.filter((l) => missingSet.has(l.id))
            : lessons; // no questions at all — treat every lesson as unassessable
        setMissing(missingRefs);
        setPhase('blocked');
        return;
      }
      setQuestions(result.questions);
      setPhase('active');
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, kind, lessonIdsKey, attempt, shouldGenerate]);

  useEffect(() => {
    if (phase !== 'active' || questions.length === 0) return;
    const saved = saveAssessmentDraft(draftIdentity, {
      questions,
      index,
      correctCount: correct,
      selectedIndex,
    });
    setDraftSaveFailed(!saved);
  }, [
    correct,
    draftIdentity,
    index,
    phase,
    questions,
    selectedIndex,
  ]);

  async function finish(finalCorrect: number) {
    const score = scorePercent(finalCorrect, questions.length);
    const didPass = passesAssessment(score);
    setFinalScore(score);
    setPassed(didPass);
    if (didPass && !passRecorded.current) {
      passRecorded.current = true;
      try {
        await markLessonsComplete(
          lang,
          kind,
          lessons.map((l) => l.id),
          score,
          'tested-out',
        );
      } catch (error) {
        console.error('Could not save test-out progress', error);
        passRecorded.current = false;
        setPhase('error');
        return;
      }
    }
    deleteAssessmentDraft(draftIdentity);
    setSavedDraft(null);
    setPhase('result');
  }

  function handleAnswer(answerIndex: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(answerIndex);
  }

  function handleNext() {
    const question = questions[index];
    const newCorrect =
      correct + (selectedIndex === question.correctIndex ? 1 : 0);
    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      finish(newCorrect);
    } else {
      setSelectedIndex(null);
      setCorrect(newCorrect);
      setIndex(nextIndex);
    }
  }

  function startFresh() {
    deleteAssessmentDraft(draftIdentity);
    setSavedDraft(null);
    setPhase('loading');
    setShouldGenerate(true);
    setAttempt((a) => a + 1);
  }

  function resumeSavedDraft() {
    if (!savedDraft) return;
    setQuestions(savedDraft.questions);
    setIndex(savedDraft.index);
    setCorrect(savedDraft.correctCount);
    setSelectedIndex(savedDraft.selectedIndex);
    setShouldGenerate(false);
    setPhase('active');
  }

  const kindLabel = kind === 'grammar' ? 'Grammar' : 'Vocabulary';
  const firstLesson = lessons[0];
  const lastLesson = lessons[lessons.length - 1];

  if (phase === 'intro') {
    return (
      <div>
        <button
          type="button"
          onClick={onExit}
          className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
        >
          ← {returnLabel}
        </button>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-white/10 dark:bg-slate-800">
          <p className="text-2xl" aria-hidden="true">
            🧭
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            Check what you already know
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This check covers {lessons.length}{' '}
            {kindLabel.toLowerCase()}{' '}
            {lessons.length === 1 ? 'lesson' : 'lessons'}
            {lessons.length === 1 ? (
              <>
                :{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {firstLesson.title}
                </span>
              </>
            ) : (
              <>
                , from{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {firstLesson.title}
                </span>{' '}
                through{' '}
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {lastLesson.title}
                </span>
              </>
            )}
            .
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Score 80% or higher to mark the range complete.</li>
            <li>If you do not pass, nothing changes.</li>
            <li>Checking ahead does not grant normal lesson XP.</li>
          </ul>
          {savedDraft ? (
            <div className="mt-5 rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10">
              <p className="text-sm font-medium text-indigo-950 dark:text-indigo-100">
                Your saved check is ready
              </p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800 dark:text-indigo-200">
                Continue at question {savedDraft.index + 1} of{' '}
                {savedDraft.questions.length}, or start this range again.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={resumeSavedDraft}
                  className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Resume check
                </button>
                <button
                  type="button"
                  onClick={startFresh}
                  className="min-h-[44px] flex-1 rounded-xl bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                >
                  Start over
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startFresh}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
            >
              Start the check
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
        >
          ← {returnLabel}
        </button>
        <div className="skeleton h-4 w-24" />
        <SkeletonList count={2} />
      </div>
    );
  }

  if (phase === 'blocked') {
    return (
      <AssessmentBlocked
        missingLessons={missing}
        onBack={onExit}
        backLabel={returnLabel}
      />
    );
  }

  if (phase === 'result') {
    return (
      <AssessmentResult
        passed={passed}
        score={finalScore}
        lessons={lessons}
        onRetry={startFresh}
        onContinue={onPass}
        continueLabel={passActionLabel}
        onStudy={onExit}
        studyLabel={failActionLabel}
        nextLessonTitle={nextLessonTitle}
      />
    );
  }

  if (phase === 'error') {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-800/60 dark:bg-amber-950/30"
      >
        <p className="text-2xl" aria-hidden="true">🌱</p>
        <p className="mt-2 font-semibold text-amber-900 dark:text-amber-200">
          Your result could not be saved
        </p>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
          No progress was changed. Try the assessment again when you’re ready.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={startFresh}
            className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onExit}
            className="min-h-[44px] flex-1 rounded-xl bg-white px-4 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
          >
            {returnLabel}
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const progressPct =
    questions.length > 0
      ? Math.round(((index + 1) / questions.length) * 100)
      : 0;

  return (
    <div>
      <button
        type="button"
        onClick={onExit}
        className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
      >
        ← {returnLabel}
      </button>
      {draftSaveFailed ? (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">This check cannot be saved right now</p>
          <p className="mt-1 text-sm">
            Keep this page open if you want to finish this attempt.
          </p>
        </div>
      ) : (
        <p
          role="status"
          className="mb-3 text-xs text-slate-500 dark:text-slate-400"
        >
          Saved on this device — you can leave and come back.
        </p>
      )}
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>{lessons.length === 1 ? lessons[0].title : `${lessons.length} lessons`}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Mastery check progress"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={index + 1}
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
        <GrammarQuiz
          key={`${attempt}-${index}`}
          type="multiple-choice"
          question={question.question}
          options={question.options}
          answer={question.correctIndex}
          selectedIndex={selectedIndex}
          onSelect={handleAnswer}
          language={lang}
          questionDirection={question.questionDirection}
          targetOptionIndices={question.targetOptionIndices}
        />
      </div>

      {selectedIndex !== null && (
        <button
          onClick={handleNext}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {index + 1 >= questions.length ? 'See results' : 'Next question →'}
        </button>
      )}
    </div>
  );
}
