import { useEffect, useRef, useState } from 'react';
import GrammarQuiz from '../grammar/GrammarQuiz';
import { generateLessonRangeQuestions, type Question } from '../../lib/test-questions';
import { markLessonsComplete } from '../../db/lessons';
import { passesAssessment, scorePercent } from '../../lib/lesson-assessment';
import { SkeletonList } from '../common/Skeleton';
import AssessmentResult from './AssessmentResult';
import AssessmentBlocked from './AssessmentBlocked';

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
}: Props) {
  const lessonIdsKey = lessons.map((l) => l.id).join('|');
  const [phase, setPhase] = useState<Phase>('intro');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [missing, setMissing] = useState<LessonRef[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const passRecorded = useRef(false);

  useEffect(() => {
    if (!started) return;
    let active = true;
    passRecorded.current = false;
    setPhase('loading');
    setIndex(0);
    setCorrect(0);
    setAnsweredCorrect(null);
    setConfirmLeave(false);

    generateLessonRangeQuestions(lang, kind, lessons.map((l) => l.id)).then((result) => {
      if (!active) return;
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
  }, [lang, kind, lessonIdsKey, attempt, started]);

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
    setPhase('result');
  }

  function handleAnswer(isCorrect: boolean) {
    if (answeredCorrect !== null) return;
    setAnsweredCorrect(isCorrect);
  }

  function handleNext() {
    const newCorrect = correct + (answeredCorrect ? 1 : 0);
    const nextIndex = index + 1;
    setAnsweredCorrect(null);
    if (nextIndex >= questions.length) {
      setCorrect(newCorrect);
      finish(newCorrect);
    } else {
      setCorrect(newCorrect);
      setIndex(nextIndex);
    }
  }

  function handleRetry() {
    setPhase('loading');
    setAttempt((a) => a + 1);
  }

  function requestExit() {
    const hasAnswers = index > 0 || answeredCorrect !== null;
    if (phase === 'active' && hasAnswers) {
      setConfirmLeave(true);
      return;
    }
    onExit();
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
            <li>Testing out does not grant normal lesson XP.</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setPhase('loading');
              setStarted(true);
            }}
            className="mt-5 min-h-[44px] w-full rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
          >
            Start the check
          </button>
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
        onRetry={handleRetry}
        onContinue={onPass}
        continueLabel={passActionLabel}
        onStudy={onExit}
        studyLabel={failActionLabel}
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
            onClick={handleRetry}
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
  const progressPct = questions.length > 0 ? Math.round((index / questions.length) * 100) : 0;

  return (
    <div>
      <button
        type="button"
        onClick={requestExit}
        className="mb-3 inline-flex min-h-[44px] items-center text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
      >
        ← {returnLabel}
      </button>
      {confirmLeave && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">Leave this check?</p>
          <p className="mt-1 text-sm">
            Your answers in this attempt are not saved.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmLeave(false)}
              className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={onExit}
              className="min-h-[44px] flex-1 rounded-xl bg-white px-4 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
            >
              Leave check
            </button>
          </div>
        </div>
      )}
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>{lessons.length === 1 ? lessons[0].title : `${lessons.length} lessons`}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-4">
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
          onAnswer={handleAnswer}
        />
      </div>

      {answeredCorrect !== null && (
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
