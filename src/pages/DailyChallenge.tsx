import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { loadDailyChallengeAttempt, type ChallengeQuestion } from '../lib/daily-challenge';
import { db } from '../db/schema';
import { todayStr } from '../lib/streaks';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import { useXPStore } from '../stores/xpStore';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import { isRTL } from '../lib/rtl';

type ChallengeState = 'not-started' | 'in-progress' | 'complete';

export default function DailyChallengePage() {
  const current = useCurrentLanguage();
  return <DailyChallengeAttempt key={current.language ?? ''} current={current} />;
}

function DailyChallengeAttempt({ current }: { current: ReturnType<typeof useCurrentLanguage> }) {
  const { language: currentLanguage, setLanguage, options: activeLanguages } = current;
  const addXP = useXPStore((s) => s.addXP);

  const [state, setState] = useState<ChallengeState>('not-started');
  const language = currentLanguage ?? '';
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [alreadyComplete, setAlreadyComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);
  const [attemptDate, setAttemptDate] = useState(todayStr);
  const finishing = useRef(false);

  useEffect(() => {
    async function checkCompletion() {
      const today = todayStr();
      const record = await db.dailyActivity.get(today);
      if (record?.challengeComplete) {
        setAlreadyComplete(true);
      }
    }
    checkCompletion();
  }, []);

  const startChallenge = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const date = todayStr();
      const attempt = await loadDailyChallengeAttempt(language, date);
      const qs = attempt.questions;
      setNotices(attempt.notices);
      if (qs.length === 0) {
        setError('No challenge content is available yet. Complete a vocabulary or grammar lesson, then try again.');
        setLoading(false);
        return;
      }
      setQuestions(qs);
      setAttemptDate(date);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setIsCorrect(null);
      setState('in-progress');
    } catch {
      setError('Your daily challenge could not load its lesson content or be saved locally. Nothing was rerolled; reconnect to load completed lesson assets, then try again.');
    } finally {
      setLoading(false);
    }
  }, [language]);

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== null) return; // already answered

      const question = questions[currentIndex];
      const correct = optionIndex === question.correctIndex;
      setSelectedOption(optionIndex);
      setIsCorrect(correct);
      if (correct) setScore((s) => s + 1);

    },
    [selectedOption, questions, currentIndex]
  );

  const finishChallenge = useCallback(
    async (finalScore: number) => {
      if (finishing.current) return;
      finishing.current = true;
      const baseXP = 30;
      const bonusPerCorrect = 5;
      const multiplier = 1.5;
      const total = Math.round((baseXP + finalScore * bonusPerCorrect) * multiplier);

      const today = attemptDate;
      try {
        const record = await db.dailyActivity.get(today);
        if (record) {
          await db.dailyActivity.update(today, { challengeComplete: true });
        } else {
          await db.dailyActivity.put({
            date: today,
            studySeconds: 0,
            cardsReviewed: 0,
            wordsAdded: 0,
            goalMet: false,
            challengeComplete: true,
          });
        }
        addXP(total);
        setXpEarned(total);
        setState('complete');
        setAlreadyComplete(true);
      } catch {
        finishing.current = false;
        setError('Your result could not be saved locally. Keep this page open and choose See results again.');
      }
    },
    [addXP, attemptDate]
  );

  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });


  // --- Not Started ---
  if (state === 'not-started') {
    return (
      <div className="max-w-md mx-auto page-enter">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{todayDate}</p>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            🎯 Daily Challenge
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Answer 7 questions across vocabulary, grammar, and characters.
            Earn <span className="font-semibold text-indigo-600 dark:text-indigo-400">1.5× XP</span> today!
          </p>

          {alreadyComplete && (
            <div className="bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-xl p-3 mb-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✅ You already completed today's challenge!
              </p>
            </div>
          )}

          {activeLanguages.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Language
              </label>
              <LanguagePicker
                options={activeLanguages}
                value={language}
                onChange={setLanguage}
                label="Challenge language"
              />
            </div>
          )}

          <button
            onClick={startChallenge}
            disabled={loading || !language}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : alreadyComplete ? 'Retry Challenge' : 'Start Challenge'}
          </button>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Vocabulary choices use your local learning evidence; the available mix may be smaller.
            Today’s generated items stay fixed for this language, even after saving words.
          </p>
          {error && <p role="alert" className="mt-3 text-sm text-slate-700 dark:text-slate-300">{error}</p>}
        </div>
      </div>
    );
  }

  // --- In Progress ---
  if (state === 'in-progress' && questions.length > 0) {
    const question = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
      <div className="max-w-md mx-auto page-enter">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
              {question.type}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          {notices.length > 0 && (
            <details className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              <summary className="min-h-[44px] cursor-pointer py-3">Today’s content limits</summary>
              {notices.map((notice) => <p key={notice}>{notice}</p>)}
            </details>
          )}
          <h2 dir={isRTL(language) ? 'rtl' : undefined} className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let btnClass =
                'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 ';

              if (selectedOption === null) {
                // Not yet answered
                btnClass +=
                  'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200';
              } else if (idx === question.correctIndex) {
                // Correct answer (always show green)
                btnClass +=
                  'border-green-500 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
              } else if (idx === selectedOption) {
                // Wrong selected answer
                btnClass +=
                  'border-red-500 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
              } else {
                btnClass +=
                  'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedOption !== null}
                  className={btnClass}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {selectedOption !== null && (
            <div className="mt-4 text-center">
              <p
                className={`font-semibold ${
                  isCorrect
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              {question.explanation && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {question.explanation}
                </p>
              )}
              {question.word && <PracticeWordCapture key={question.id} language={language} words={[question.word]} source="daily-challenge" />}
              <button onClick={() => {
                if (currentIndex + 1 < questions.length) {
                  setCurrentIndex((index) => index + 1);
                  setSelectedOption(null);
                  setIsCorrect(null);
                } else {
                  return finishChallenge(score);
                }
              }} className="mt-3 min-h-[44px] rounded-xl bg-indigo-600 px-4 text-white">
                {currentIndex + 1 < questions.length ? 'Next question' : 'See results'}
              </button>
              {error && <p role="alert" className="text-sm text-slate-700 dark:text-slate-300">{error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Complete ---
  return (
    <div className="max-w-md mx-auto page-enter">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Daily Challenge Complete!
        </h1>

        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-4">
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {score} / {questions.length}
          </p>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
            questions correct
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            +{xpEarned} XP
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
            (base 30 + {score * 5} bonus) × 1.5 multiplier
          </p>
        </div>
        <PracticeWordCapture language={language} words={questions.flatMap((question) => question.word ? [question.word] : [])} source="daily-challenge" />

        <Link
          to="/"
          className="inline-block w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
