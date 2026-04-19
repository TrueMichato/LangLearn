import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateDailyChallenge, type ChallengeQuestion } from '../lib/daily-challenge';
import { db } from '../db/schema';
import { todayStr } from '../lib/streaks';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';

type ChallengeState = 'not-started' | 'in-progress' | 'complete';

export default function DailyChallengePage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const addXP = useXPStore((s) => s.addXP);

  const [state, setState] = useState<ChallengeState>('not-started');
  const [language, setLanguage] = useState(activeLanguages[0] ?? 'ja');
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [alreadyComplete, setAlreadyComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

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
    try {
      const qs = await generateDailyChallenge(language);
      if (qs.length === 0) {
        setLoading(false);
        return;
      }
      setQuestions(qs);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setIsCorrect(null);
      setState('in-progress');
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

      const delay = correct ? 1000 : 2000;
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((i) => i + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        } else {
          finishChallenge(correct ? score + 1 : score);
        }
      }, delay);
    },
    [selectedOption, questions, currentIndex, score]
  );

  const finishChallenge = useCallback(
    async (finalScore: number) => {
      const baseXP = 30;
      const bonusPerCorrect = 5;
      const multiplier = 1.5;
      const total = Math.round((baseXP + finalScore * bonusPerCorrect) * multiplier);

      addXP(total);
      setXpEarned(total);
      setState('complete');

      const today = todayStr();
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
      setAlreadyComplete(true);
    },
    [addXP]
  );

  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const langLabel: Record<string, string> = { ja: 'Japanese', ru: 'Russian' };

  // --- Not Started ---
  if (state === 'not-started') {
    return (
      <div className="max-w-md mx-auto page-enter">
        <Link
          to="/"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block"
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
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
              >
                {activeLanguages.map((l) => (
                  <option key={l} value={l}>
                    {langLabel[l] ?? l}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={startChallenge}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : alreadyComplete ? 'Retry Challenge' : 'Start Challenge'}
          </button>
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
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">
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
                  'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30';
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
                  'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500';
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
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {score} / {questions.length}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            questions correct
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            +{xpEarned} XP
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            (base 30 + {score * 5} bonus) × 1.5 multiplier
          </p>
        </div>

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
