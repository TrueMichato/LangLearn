import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { getLanguageLabel } from '../lib/languages';
import { isRTL } from '../lib/rtl';
import { jaSentences } from '../data/sentences/ja-sentences';
import { ruSentences } from '../data/sentences/ru-sentences';
import { ptSentences } from '../data/sentences/pt-sentences';
import { esSentences } from '../data/sentences/es-sentences';
import { arSentences } from '../data/sentences/ar-sentences';
import { roSentences } from '../data/sentences/ro-sentences';
import type { PracticeSentence } from '../data/sentences/ja-sentences';
import {
  XP_TRANSLATION_BASE,
  XP_PER_TRANSLATION_CORRECT,
  XP_PER_TRANSLATION_PARTIAL,
} from '../lib/xp';

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
type Phase = 'setup' | 'practice' | 'summary';
type Grade = 'correct' | 'partial' | 'missed';

interface GradedSentence {
  sentence: PracticeSentence;
  userAnswer: string;
  grade: Grade;
}

const SENTENCES_PER_SESSION = 10;

const GRADE_POINTS: Record<Grade, number> = {
  correct: 3,
  partial: 1,
  missed: 0,
};

function getSentences(lang: string): PracticeSentence[] {
  if (lang === 'ja') return jaSentences;
  if (lang === 'ru') return ruSentences;
  if (lang === 'pt') return ptSentences;
  if (lang === 'es') return esSentences;
  if (lang === 'ar') return arSentences;
  if (lang === 'ro') return roSentences;
  return [];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TranslationPracticePage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const supportedLanguages = activeLanguages.filter((l) => l === 'ja' || l === 'ru' || l === 'pt' || l === 'es' || l === 'ar' || l === 'ro');

  const [phase, setPhase] = useState<Phase>('setup');
  const [language, setLanguage] = useState(supportedLanguages[0] ?? 'ja');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sessionSentences, setSessionSentences] = useState<PracticeSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<GradedSentence[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allSentences = useMemo(() => getSentences(language), [language]);

  const startSession = () => {
    let pool = allSentences;
    if (difficulty !== 'all') {
      pool = pool.filter((s) => s.difficulty === difficulty);
    }
    const selected = shuffle(pool).slice(0, SENTENCES_PER_SESSION);
    setSessionSentences(selected);
    setCurrentIdx(0);
    setInput('');
    setSubmitted(false);
    setResults([]);
    setPhase('practice');
  };

  useEffect(() => {
    if (phase === 'practice' && !submitted) {
      textareaRef.current?.focus();
    }
  }, [phase, currentIdx, submitted]);

  const handleCheck = () => {
    if (!input.trim()) return;
    setSubmitted(true);
  };

  const handleGrade = (grade: Grade) => {
    const graded: GradedSentence = {
      sentence: sessionSentences[currentIdx],
      userAnswer: input.trim(),
      grade,
    };
    const newResults = [...results, graded];
    setResults(newResults);

    if (currentIdx + 1 < sessionSentences.length) {
      setCurrentIdx(currentIdx + 1);
      setInput('');
      setSubmitted(false);
    } else {
      // Session complete — award XP
      const correctCount = newResults.filter((r) => r.grade === 'correct').length;
      const partialCount = newResults.filter((r) => r.grade === 'partial').length;
      const xp =
        XP_TRANSLATION_BASE +
        correctCount * XP_PER_TRANSLATION_CORRECT +
        partialCount * XP_PER_TRANSLATION_PARTIAL;
      useXPStore.getState().addXP(xp);
      setPhase('summary');
    }
  };

  const totalScore = results.reduce((sum, r) => sum + GRADE_POINTS[r.grade], 0);
  const maxScore = results.length * 3;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const xpEarned =
    XP_TRANSLATION_BASE +
    results.filter((r) => r.grade === 'correct').length * XP_PER_TRANSLATION_CORRECT +
    results.filter((r) => r.grade === 'partial').length * XP_PER_TRANSLATION_PARTIAL;
  const missedSentences = results.filter((r) => r.grade === 'missed');

  /* ─── Setup ─── */
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
            ✍️ Translation Practice
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You&rsquo;ll see English sentences. Type the translation in{' '}
            {getLanguageLabel(language)}. Then grade yourself.
          </p>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Language
          </label>
          <div className="flex flex-wrap gap-2">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                  language === lang
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {getLanguageLabel(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Difficulty
          </label>
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard', 'all'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] capitalize transition-colors ${
                  difficulty === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {d === 'all' ? 'All Levels' : d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={allSentences.length === 0}
          className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold min-h-[44px] hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Practice
        </button>

        <Link
          to="/learn"
          className="block text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium"
        >
          ← Back to Learn
        </Link>
      </div>
    );
  }

  /* ─── Practice ─── */
  if (phase === 'practice') {
    const current = sessionSentences[currentIdx];
    return (
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ✍️ Translation
          </h2>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {currentIdx + 1}/{sessionSentences.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIdx + (submitted ? 1 : 0)) / sessionSentences.length) * 100}%` }}
          />
        </div>

        {/* English sentence */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Translate to {getLanguageLabel(language)}
          </p>
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
            {current.english}
          </p>
          {current.hint && !submitted && (
            <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 italic">
              💡 {current.hint}
            </p>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Type your translation…"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-3 text-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
            dir={isRTL(language) ? 'rtl' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !submitted) {
                e.preventDefault();
                handleCheck();
              }
            }}
          />

          {!submitted && (
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="mt-3 w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold min-h-[44px] hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check
            </button>
          )}
        </div>

        {/* After submission — show reference & grading */}
        {submitted && (
          <div className="space-y-4">
            {/* User answer */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Your answer
              </p>
              <p className="text-lg text-slate-800 dark:text-slate-100">{input.trim()}</p>
            </div>

            {/* Reference answer */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl shadow p-4 border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                Reference
              </p>
              <p className="text-lg font-mono text-indigo-800 dark:text-indigo-200" dir={isRTL(language) ? 'rtl' : undefined}>
                {current.target}
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                {current.reading}
              </p>
            </div>

            {/* Self-assessment */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                How did you do?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleGrade('correct')}
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors"
                >
                  <span className="text-xl">✅</span>
                  <span className="text-xs">Got it</span>
                </button>
                <button
                  onClick={() => handleGrade('partial')}
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/70 transition-colors"
                >
                  <span className="text-xl">🟡</span>
                  <span className="text-xs">Partially</span>
                </button>
                <button
                  onClick={() => handleGrade('missed')}
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                >
                  <span className="text-xl">❌</span>
                  <span className="text-xs">Missed it</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Summary ─── */
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Session Complete 🎉</h2>

      {/* Score card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center space-y-3">
        <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
          {totalScore}/{maxScore}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{percentage}% accuracy</p>

        <div className="flex justify-center gap-6 text-sm">
          <span className="text-green-600 dark:text-green-400">
            ✅ {results.filter((r) => r.grade === 'correct').length}
          </span>
          <span className="text-yellow-600 dark:text-yellow-400">
            🟡 {results.filter((r) => r.grade === 'partial').length}
          </span>
          <span className="text-red-600 dark:text-red-400">
            ❌ {results.filter((r) => r.grade === 'missed').length}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">XP earned</p>
          <p className="text-2xl font-bold text-amber-500">+{xpEarned} XP</p>
        </div>

        {percentage >= 80 && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Excellent work! Keep it up! 🌟
          </p>
        )}
        {percentage >= 50 && percentage < 80 && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            Good effort! You&rsquo;re making progress! 💪
          </p>
        )}
        {percentage < 50 && (
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Every attempt helps you learn — keep going! 🌱
          </p>
        )}
      </div>

      {/* Missed review */}
      {missedSentences.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Review missed sentences
          </p>
          {missedSentences.map((r) => (
            <div
              key={r.sentence.id}
              className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 px-3 py-2"
            >
              <p className="text-sm text-slate-600 dark:text-slate-400">{r.sentence.english}</p>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-100 mt-1" dir={isRTL(language) ? 'rtl' : undefined}>
                {r.sentence.target}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.sentence.reading}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setPhase('setup');
            setResults([]);
            setCurrentIdx(0);
            setInput('');
            setSubmitted(false);
          }}
          className="flex-1 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold min-h-[44px] hover:bg-indigo-700 transition-colors"
        >
          Practice Again
        </button>
        <Link
          to="/learn"
          className="flex-1 text-center bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl font-semibold min-h-[44px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          Back to Learn
        </Link>
      </div>
    </div>
  );
}
