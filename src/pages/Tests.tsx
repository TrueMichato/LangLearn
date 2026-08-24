import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import { useXPStore } from '../stores/xpStore';
import { generateTestQuestions, type Question, type TestType } from '../lib/test-questions';
import { getTestLevel, calculateXP } from '../lib/test-scoring';
import { db, type TestHistory } from '../db/schema';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { createSeededRandom } from '../lib/guided-practice';

type Phase = 'setup' | 'loading' | 'active' | 'results' | 'guided-error';
type TimeLimit = 0 | 5 | 10 | 15;

const TEST_LABELS: Record<TestType, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  mixed: 'Mixed',
  full: 'Full Proficiency',
};

const TIME_OPTIONS: { value: TimeLimit; label: string }[] = [
  { value: 0, label: 'Untimed' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
];

export default function TestsPage() {
  const { language: currentLanguage, setLanguage, options: activeLanguages } = useCurrentLanguage();
  const language = currentLanguage ?? 'ja';
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishingRef = useRef(false);
  const guided = useGuidedPractice('tests', language);

  // Load history
  useEffect(() => {
    db.testHistory
      .where('language')
      .equals(language)
      .reverse()
      .sortBy('date')
      .then((rows) => setHistory(rows.slice(0, 5)));
  }, [language, phase]);

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

  const finishTest = useCallback(
    async (finalAnswers: (number | null)[]) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);

      const correctAnswers = questions.reduce(
        (sum, q, i) => sum + (finalAnswers[i] === q.correctIndex ? 1 : 0),
        0
      );
      const totalQuestions = questions.length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const testLevel = getTestLevel(score);
      const xp = calculateXP(correctAnswers);

      const entry: TestHistory = {
        language,
        type: testType,
        score,
        level: testLevel.level,
        totalQuestions,
        correctAnswers,
        durationSeconds,
        date: new Date().toISOString(),
      };

      try {
        await db.testHistory.add(entry);
        useXPStore.getState().addXP(xp);
        await guided.complete({
          itemsCompleted: finalAnswers.filter((answer) => answer != null).length,
          score,
        });
        setResult(entry);
        setXpEarned(xp);
        setPhase('results');
      } finally {
        finishingRef.current = false;
      }
    },
    [guided, questions, startTime, language, testType]
  );

  // Auto-finish when time runs out
  useEffect(() => {
    if (phase === 'active' && timeLimit > 0 && secondsLeft === 0 && startTime > 0) {
      finishTest(answers);
    }
  }, [secondsLeft, phase, timeLimit, startTime, answers, finishTest]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
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
        'This guided test could not load enough lesson content. Return to your learning path and try again when the content is available.',
      );
      setPhase('guided-error');
      return;
    }
    if (qs.length === 0) {
      alert('No content available for this language and test type. Try another combination.');
      setPhase('setup');
      return;
    }
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
    if (showFeedback) return;
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);

    setTimeout(() => {
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
    setPhase('setup');
    setResult(null);
    setXpEarned(0);
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (phase === 'guided-error') {
    return <GuidedPracticeError message={guidedLoadError} />;
  }

  // ─── SETUP ────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="page-enter">
        <Link to="/learn" className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Proficiency Tests</h2>
        <GuidedPracticeNotice guided={guided} />

        <div className="space-y-4">
          {/* Language selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Language</label>
            <div className="flex flex-wrap gap-2">
              <LanguagePicker
                options={activeLanguages}
                value={language}
                onChange={setLanguage}
                label="Test language"
              />
            </div>
          </div>

          {/* Test type */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Test Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TEST_LABELS) as TestType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTestType(t)}
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
          </div>

          {/* Time limit */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Time Limit</label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeLimit(opt.value)}
                  className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
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

          <button
            onClick={handleStart}
            className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 font-semibold text-lg press-feedback transition-colors"
          >
            Start Test
          </button>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Recent Results</h3>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <div className="text-slate-600 dark:text-slate-400">
                      <span className="capitalize">{h.type}</span>
                      <span className="mx-1">·</span>
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{h.score}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${levelColor(h.level)}`}>
                        {h.level}
                      </span>
                    </div>
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
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentIndex + 1} / {questions.length}
          </span>
          {timeLimit > 0 && (
            <span className={`text-sm font-mono font-medium ${secondsLeft < 60 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
              ⏱ {formatTime(secondsLeft)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-4">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 block">
            {q.category}
          </span>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let btnClass =
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-colors font-medium ';
              if (showFeedback) {
                if (i === q.correctIndex) {
                  btnClass += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
                } else if (i === selectedOption && i !== q.correctIndex) {
                  btnClass += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
                } else {
                  btnClass += 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400';
                }
              } else {
                btnClass +=
                  'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-700';
              }

              return (
                <button key={i} onClick={() => handleAnswer(i)} className={btnClass} disabled={showFeedback}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS ──────────────────────────────────────────
  if (phase === 'results' && result) {
    const testLevel = getTestLevel(result.score);

    return (
      <div className="page-enter">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Test Complete!</h2>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-4 text-center">
          <div className="mb-2 text-5xl font-bold text-slate-800 dark:text-slate-100">{result.score}%</div>
          <div className={`inline-block text-sm font-semibold px-3 py-1 rounded-full capitalize mb-4 ${levelColor(testLevel.level)}`}>
            {testLevel.label}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            JLPT {testLevel.jlpt} · CEFR {testLevel.cefr}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Correct</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatTime(result.durationSeconds)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Time</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">+{xpEarned}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">XP</div>
          </div>
        </div>

        {guided.isGuided ? (
          <GuidedCompletionActions guided={guided} onPracticeAgain={handleRestart} />
        ) : (
          <button
            onClick={handleRestart}
            className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 font-semibold press-feedback transition-colors"
          >
            Take Another Test
          </button>
        )}
      </div>
    );
  }

  return null;
}

function levelColor(level: string): string {
  switch (level) {
    case 'advanced': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    case 'intermediate': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    case 'elementary': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
  }
}
