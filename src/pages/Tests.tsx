import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import { generateTestQuestions, QUESTION_COUNTS, type Question, type TestType } from '../lib/test-questions';
import { summarizePracticeResult, PRACTICE_RESULT_MARKER, calculateXP } from '../lib/test-scoring';
import { db, type TestHistory } from '../db/schema';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { createSeededRandom } from '../lib/guided-practice';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import { assessmentVocabulary } from '../lib/assessment-vocabulary';
import { getLanguageLabel } from '../lib/languages';
import { isRTL } from '../lib/rtl';
import { grammarLessonRoute, vocabLessonRoute, ROUTES } from '../lib/routes';
import { ACTIVITY_CAPABILITIES } from '../lib/activity-capabilities';

type Phase = 'setup' | 'loading' | 'active' | 'results' | 'guided-error';
type TimeLimit = 0 | 5 | 10 | 15;

interface CompletedPractice {
  entry: TestHistory;
  itemsCompleted: number;
  xp: number;
  historySaved: boolean;
  rewardAttempted: boolean;
  pathAttempted: boolean;
}

const TEST_LABELS: Record<TestType, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  mixed: 'Mixed practice',
  full: 'Extended mixed practice',
};

const CATEGORY_LABELS = { vocabulary: 'Vocabulary', grammar: 'Grammar' };
const TEST_LANGUAGES = Object.keys(ACTIVITY_CAPABILITIES);

const TIME_OPTIONS: { value: TimeLimit; label: string }[] = [
  { value: 0, label: 'Untimed' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

export default function TestsPage() {
  const { language: currentLanguage, requested, setLanguage, options: activeLanguages } = useCurrentLanguage(TEST_LANGUAGES);
  const language = currentLanguage ?? '';
  const [testType, setTestType] = useState<TestType>('mixed');
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(10);
  const [phase, setPhase] = useState<Phase>('setup');

  // Active test state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Results
  const [result, setResult] = useState<TestHistory | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [guidedLoadError, setGuidedLoadError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [contentLimits, setContentLimits] = useState<string[]>([]);
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [xpWarning, setXPWarning] = useState('');
  const [pathSaveError, setPathSaveError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishingRef = useRef(false);
  const savingRef = useRef(false);
  const completedPracticeRef = useRef<CompletedPractice | null>(null);
  const guided = useGuidedPractice('tests', language);

  // Load history
  useEffect(() => {
    if (!language) return;
    db.testHistory
      .where('language')
      .equals(language)
      .reverse()
      .sortBy('date')
      .then((rows) => setHistory(rows.slice(0, 5)));
  }, [language, phase]);

  useEffect(() => () => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active' || timeLimit === 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLimit]);

  const saveCompletedPractice = useCallback(async () => {
    const completed = completedPracticeRef.current;
    if (!completed || savingRef.current) return;
    savingRef.current = true;
    setSavePending(true);
    setSaveError('');
    try {
      if (!completed.historySaved) {
        try {
          await db.testHistory.add(completed.entry);
          completed.historySaved = true;
        } catch {
          setSaveError('Your result could not be saved on this device. Keep this page open, free some device storage, then retry. No XP or path progress has been recorded for this check.');
          return;
        }
      }
      if (!completed.rewardAttempted) {
        // addXP can update memory before its localStorage write throws. Never
        // blindly replay an award whose persistence could not be confirmed.
        completed.rewardAttempted = true;
        try {
          useXPStore.getState().addXP(completed.xp);
          setXpEarned(completed.xp);
        } catch {
          setXPWarning('Your result is saved, but XP could not be confirmed on this device. It will not be awarded again for this check to avoid counting it twice.');
        }
      }
      if (!completed.pathAttempted) {
        completed.pathAttempted = true;
        try {
          await guided.complete({
            itemsCompleted: completed.itemsCompleted,
            score: completed.entry.score,
          });
        } catch {
          // The hook normally reports failures through completionError. An
          // unexpected rejection can follow a partial write, so do not replay it.
          setPathSaveError('Your result is saved, but path progress could not be confirmed. Return to your learning path to check this step before starting another session.');
        }
      }
    } finally {
      savingRef.current = false;
      setSavePending(false);
    }
  }, [guided]);

  const finishTest = useCallback(
    (finalAnswers: (number | null)[]) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceRef.current) clearTimeout(advanceRef.current);

      const { correctAnswers, totalQuestions, score, attemptedQuestions } =
        summarizePracticeResult(questions, finalAnswers);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const xp = calculateXP(correctAnswers);

      const entry: TestHistory = {
        language,
        type: testType,
        score,
        level: PRACTICE_RESULT_MARKER,
        totalQuestions,
        correctAnswers,
        durationSeconds,
        date: new Date().toISOString(),
      };

      completedPracticeRef.current = {
        entry, itemsCompleted: attemptedQuestions, xp,
        historySaved: false, rewardAttempted: false, pathAttempted: false,
      };
      setAnswers([...finalAnswers]);
      setResult(entry);
      setPhase('results');
      void saveCompletedPractice();
    },
    [questions, startTime, language, testType, saveCompletedPractice]
  );

  // Auto-finish when time runs out
  useEffect(() => {
    if (phase === 'active' && timeLimit > 0 && secondsLeft === 0 && startTime > 0) {
      finishTest(answers);
    }
  }, [secondsLeft, phase, timeLimit, startTime, answers, finishTest]);

  const handleStart = useCallback(async () => {
    if (!language || savingRef.current) return;
    setPhase('loading');
    setLoadError('');
    setContentLimits([]);
    setSaveError('');
    setXPWarning('');
    setPathSaveError('');
    completedPracticeRef.current = null;
    finishingRef.current = false;
    const effectiveType = guided.descriptor ? 'mixed' : testType;
    const random = guided.descriptor
      ? createSeededRandom(guided.descriptor.seed)
      : Math.random;
    const generated = await generateTestQuestions(language, effectiveType, random);
    const qs = guided.descriptor
      ? generated.slice(0, guided.descriptor.session.targetItems)
      : generated;
    if (
      guided.descriptor &&
      qs.length < guided.descriptor.session.minItems
    ) {
      setGuidedLoadError(
        'This guided practice check could not load enough lesson content. Return to your learning path and try again when the content is available.',
      );
      setPhase('guided-error');
      return;
    }
    if (qs.length === 0) {
      setLoadError(`No questions could be loaded for ${getLanguageLabel(language)} in this check. Try again when the lesson content is available, or choose another practice type.`);
      setPhase('setup');
      return;
    }
    if (!guided.descriptor) {
      const requested = QUESTION_COUNTS[effectiveType];
      setContentLimits((['vocabulary', 'grammar'] as const).flatMap((category) => {
        const target = category === 'vocabulary' ? requested.vocab : requested.grammar;
        const available = qs.filter((question) => question.category === category).length;
        return available < target ? [`${CATEGORY_LABELS[category]}: ${available} of ${target} requested`] : [];
      }));
    }
    setTestType(effectiveType);
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setGuidedLoadError('');
    setSecondsLeft(timeLimit * 60);
    setStartTime(Date.now());
    setPhase('active');
  }, [guided.descriptor, language, testType, timeLimit]);

  useEffect(() => {
    if (guided.descriptor && phase === 'setup') void handleStart();
  }, [guided.descriptor, handleStart, phase]);

  function handleAnswer(optionIndex: number) {
    if (showFeedback || finishingRef.current) return;
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    advanceRef.current = setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        finishTest(newAnswers);
      }
    }, 800);
  }

  function handleRestart() {
    if (savingRef.current) return;
    if (advanceRef.current) clearTimeout(advanceRef.current);
    setPhase('setup');
    setResult(null);
    setXpEarned(0);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setContentLimits([]);
    setLoadError('');
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (!currentLanguage) {
    return <LanguageUnavailable requested={requested} options={activeLanguages} onChange={setLanguage} feature="Practice checks" plural />;
  }
  if (phase === 'guided-error') {
    return <GuidedPracticeError message={guidedLoadError} />;
  }

  // ─── SETUP ────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="page-enter">
        <Link to={ROUTES.learn} className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback">
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Practice checks</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Revisit a sample of vocabulary and grammar from this language&apos;s lessons, including material you may not have studied yet.
          {' '}Not a language-level assessment or a lesson test-out.
        </p>
        <GuidedPracticeNotice guided={guided} />

        <div className="space-y-4">
          {/* Language selector */}
          <LanguagePicker
            options={activeLanguages}
            value={language}
            onChange={setLanguage}
            label="Practice check language"
          />

          {/* Test type */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 p-4">
            <h3 id="practice-type-label" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Practice type</h3>
            <div role="group" aria-labelledby="practice-type-label" className="grid grid-cols-2 gap-2">
              {(Object.keys(TEST_LABELS) as TestType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTestType(t)}
                  aria-pressed={testType === t}
                  className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                    testType === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {TEST_LABELS[t]}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Up to {QUESTION_COUNTS[testType].vocab + QUESTION_COUNTS[testType].grammar} questions,
              {' '}depending on available lesson content. Review missed answers after the check.
            </p>
          </div>

          {/* Time limit */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 p-4">
            <h3 id="practice-time-label" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Time limit</h3>
            <div role="group" aria-labelledby="practice-time-label" className="flex gap-2 overflow-x-auto">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeLimit(opt.value)}
                  aria-pressed={timeLimit === opt.value}
                  className={`shrink-0 px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                    timeLimit === opt.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loadError && (
            <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{loadError}</p>
          )}
          <button
            onClick={handleStart}
            className="w-full min-h-[44px] bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 font-semibold press-feedback transition-colors"
          >
            Start practice check
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 p-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Recent practice results</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Question and answer details were not saved. These records show the requested practice type and aggregate sample score, not a language level.
              </p>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {history.map((h) => (
                  <div key={h.id} className="py-3 text-sm">
                    <div className="text-slate-700 dark:text-slate-200">
                      <span>{TEST_LABELS[h.type]}</span>
                      <span className="mx-1">·</span>
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-100">
                      {h.correctAnswers}/{h.totalQuestions} correct in the sampled set · {h.score}%
                    </p>
                    {h.level !== PRACTICE_RESULT_MARKER && (
                      <p className="text-slate-500 dark:text-slate-400">
                        Legacy estimate: {h.level || 'not recorded'}. This old label was derived from a practice score, not an assessed language level.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── LOADING ──────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="page-enter space-y-6">
        <div className="skeleton h-6 w-1/3" />
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-800/90 shadow p-6 space-y-3">
            <div className="skeleton h-3 w-1/4" />
            <div className="skeleton h-5 w-3/4" />
            <div className="space-y-3 mt-4">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE TEST ──────────────────────────────────────
  if (phase === 'active' && questions.length > 0) {
    const q = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {getLanguageLabel(language)} practice check
        </h2>
        {contentLimits.length > 0 && (
          <div role="status" className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            <p>A smaller sample is available. Results will describe only the questions loaded.</p>
            <ul>{contentLimits.map((limit) => <li key={limit}>{limit}</li>)}</ul>
          </div>
        )}
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {questions.length}
          </span>
          {timeLimit > 0 && (
            <span className={`text-sm font-mono font-medium ${secondsLeft < 60 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}>
              ⏱ {formatTime(secondsLeft)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 p-4 mb-4">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 block">
            {CATEGORY_LABELS[q.category]}
          </span>
          <p dir={q.questionDirection === 'target' && isRTL(language) ? 'rtl' : 'ltr'} className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let btnClass =
                'w-full min-h-[44px] text-start px-4 py-3 rounded-xl border-2 transition-colors font-medium ';
              if (showFeedback) {
                if (i === q.correctIndex) {
                  btnClass += 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                } else if (i === selectedOption && i !== q.correctIndex) {
                  btnClass += 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
                } else {
                  btnClass += 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400';
                }
              } else {
                btnClass +=
                  'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-700';
              }

              return (
                <button key={i} dir={q.targetOptionIndices?.includes(i) && isRTL(language) ? 'rtl' : 'auto'} onClick={() => handleAnswer(i)} className={btnClass} disabled={showFeedback}>
                  {opt}
                </button>
              );
            })}
          </div>
          {showFeedback && (
            <p role="status" className="mt-3 text-sm text-slate-700 dark:text-slate-200">
              {selectedOption === q.correctIndex ? 'Correct.' : 'You can revisit this answer after the check.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────
  if (phase === 'results' && result) {
    const summary = summarizePracticeResult(questions, answers);
    const sources = [...new Map(questions.filter((question) => question.lessonId).map((question) => [
      `${question.category}/${question.lessonId}`,
      question,
    ])).values()];
    const missed = questions.flatMap((question, index) =>
      answers[index] != null && answers[index] !== question.correctIndex ? [{ question, index }] : []);
    const unattempted = questions.flatMap((question, index) =>
      answers[index] == null ? [{ question, index }] : []);
    const reviewGroups = [
      { label: 'Review missed questions', items: missed },
      { label: 'Not attempted', items: unattempted },
    ];

    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Practice check complete</h2>
        {savePending && (
          <p role="status" className="mb-4 text-sm text-slate-500 dark:text-slate-400">Saving your result…</p>
        )}
        {saveError && (
          <div role="alert" className="mb-4 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">{saveError}</p>
            <button
              onClick={saveCompletedPractice}
              disabled={savePending}
              className="min-h-[44px] rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              Retry saving result
            </button>
          </div>
        )}
        {xpWarning && (
          <p role="status" className="mb-4 text-sm text-slate-700 dark:text-slate-200">{xpWarning}</p>
        )}
        {pathSaveError && !guided.isGuided && (
          <p role="alert" className="mb-4 text-sm text-slate-700 dark:text-slate-200">{pathSaveError}</p>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 p-4 mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{getLanguageLabel(result.language)}</p>
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 my-2">
            {summary.attemptedQuestions > 0
              ? `${summary.correctAnswers}/${summary.attemptedQuestions} correct among attempted questions`
              : 'No questions answered'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {summary.attemptedQuestions} attempted · {summary.unansweredQuestions} not attempted · {summary.totalQuestions} sampled
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {result.score}% of the full sample was correct. Only these questions were checked — not your overall language level.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {timeLimit > 0 ? `${timeLimit}-minute time limit` : 'Untimed'} · {formatTime(result.durationSeconds)} spent
            {' '}· {xpWarning ? 'XP not confirmed' : savePending || saveError ? 'XP pending' : `+${xpEarned} XP`}
          </p>
        </div>

        <section className="mb-4 text-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">What this check covered</h3>
          <ul className="space-y-2 text-slate-700 dark:text-slate-200">
            {summary.categories.map((category) => (
              <li key={category.category}>
                {CATEGORY_LABELS[category.category]}: {category.attempted > 0
                  ? `${category.correct}/${category.attempted} correct`
                  : 'no questions attempted'}
                {' '}· {category.attempted} attempted · {category.sampled} sampled
              </li>
            ))}
          </ul>
          {contentLimits.length > 0 && (
            <p className="text-slate-500 dark:text-slate-400 mt-2">Content available: {contentLimits.join('; ')}.</p>
          )}
          {sources.length > 0 && (
            <details className="mt-2">
              <summary className="min-h-[44px] flex items-center cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                Sampled lessons ({sources.length})
              </summary>
              <ul>
                {sources.map((question) => (
                  <li key={`${question.category}/${question.lessonId}`}>
                    <Link
                      to={question.category === 'grammar' ? grammarLessonRoute(question.lessonId!) : vocabLessonRoute(question.lessonId!)}
                      className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {CATEGORY_LABELS[question.category]} · {question.lessonTitle || question.lessonId}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {questions.some((question) => !question.lessonId) && (
            <p className="text-slate-500 dark:text-slate-400 mt-2">Some source lessons were not recorded for this sample.</p>
          )}
        </section>

        <section className="mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">A useful next step</h3>
          <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
            {missed.length > 0
              ? 'Revisit a missed prompt, compare your choice with the reference, then open its lesson if you want more context.'
              : unattempted.length > 0
                ? 'Explore an unattempted prompt below, or try an untimed check when you have more time.'
                : 'You answered this sample correctly. Revisit a source lesson in context, or try a different sample when you are ready.'}
          </p>
          {reviewGroups.filter((group) => group.items.length > 0).map((group) => (
            <details key={group.label} className="border-t border-slate-200 dark:border-white/10">
              <summary className="min-h-[44px] flex items-center cursor-pointer font-medium text-indigo-600 dark:text-indigo-400">
                {group.label} ({group.items.length})
              </summary>
              <ol className="divide-y divide-slate-200 dark:divide-white/10">
                {group.items.map(({ question, index }) => (
                  <li key={question.id} className="py-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                    <p dir={question.questionDirection === 'target' && isRTL(result.language) ? 'rtl' : 'ltr'} className="font-medium">
                      {question.question}
                    </p>
                    {answers[index] != null && (
                      <p>Your choice: <bdi dir={question.targetOptionIndices?.includes(answers[index]!) && isRTL(result.language) ? 'rtl' : 'auto'}>{question.options[answers[index]!]}</bdi></p>
                    )}
                    <p>Reference answer: <bdi dir={question.targetOptionIndices?.includes(question.correctIndex) && isRTL(result.language) ? 'rtl' : 'auto'}>{question.options[question.correctIndex]}</bdi></p>
                    {question.lessonId && (
                      <Link
                        to={question.category === 'grammar' ? grammarLessonRoute(question.lessonId) : vocabLessonRoute(question.lessonId)}
                        className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Open lesson: {question.lessonTitle || question.lessonId}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </details>
          ))}
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            These question details are available until you leave this result. Once saved, history keeps only the aggregate sample score.
          </p>
        </section>

        {!savePending && !saveError && (guided.isGuided ? (
          <GuidedCompletionActions guided={pathSaveError ? { ...guided, completionError: pathSaveError } : guided} onPracticeAgain={handleRestart} />
        ) : (
          <button
            onClick={handleRestart}
            className="w-full min-h-[44px] bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 font-semibold press-feedback transition-colors"
          >
            Try another practice check
          </button>
        ))}
        <PracticeWordCapture language={result.language} words={assessmentVocabulary(questions)} source="practice-check-results" />
      </div>
    );
  }

  return null;
}
