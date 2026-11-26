import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
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
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { useAdaptivePractice } from '../hooks/useAdaptivePractice';
import AdaptivePracticeNotice from '../components/common/AdaptivePracticeNotice';
import PracticeWordCapture from '../components/common/PracticeWordCapture';
import SentenceComparison from '../components/sentences/SentenceComparison';
import InputActivityLink from '../components/learn/InputActivityLink';

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
const GRADE_LABELS: Record<Grade, string> = {
  correct: 'Got it',
  partial: 'Partially',
  missed: 'Missed it',
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

const TRANSLATION_LANGUAGES = ['ja', 'ru', 'pt', 'es', 'ar', 'ro'];

export default function TranslationPracticePage() {
  const current = useCurrentLanguage(TRANSLATION_LANGUAGES);
  const { search } = useLocation();
  return <TranslationPracticeSession key={`${current.requested}/${search}`} current={current} />;
}

export function TranslationPracticeSession({ current: languageState }: { current: ReturnType<typeof useCurrentLanguage> }) {
  const {
    language: currentLanguage,
    setLanguage,
    options: supportedLanguages,
    isSupported,
    requested,
  } = languageState;

  const [phase, setPhase] = useState<Phase>('setup');
  const language = currentLanguage ?? 'ja';
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sessionSentences, setSessionSentences] = useState<PracticeSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<GradedSentence[]>([]);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  const firstResult = useRef<GradedSentence | null>(null);
  const completedItems = useRef(new Set<number>());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const allSentences = useMemo(() => getSentences(language), [language]);
  const guided = useGuidedPractice('translation', language);
  const adaptive = useAdaptivePractice<PracticeSentence>(language);

  const startSession = async () => {
    if (!isSupported || adaptive.status === 'loading') return;
    let pool = allSentences;
    const level = guided.descriptor?.scope?.difficulty ?? difficulty;
    if (level !== 'all') {
      pool = pool.filter((s) => s.difficulty === level);
    }
    const scope = guided.descriptor?.scope?.itemIds;
    if (scope) pool = pool.filter((item) => scope.includes(item.id));
    const selected = await adaptive.start(pool, {
      seed: guided.descriptor?.seed ?? `${language}/translation`,
      session: guided.descriptor?.session ?? { minItems: 1, targetItems: SENTENCES_PER_SESSION, maxItems: SENTENCES_PER_SESSION },
      difficulties: level === 'all' ? undefined : [level],
    }, (item, index) => ({
      id: item.id, language, difficulty: item.difficulty, text: item.target,
      order: ({ easy: 0, medium: 1000, hard: 2000 }[item.difficulty]) + index,
    }));
    if (!selected) return;
    setSessionSentences(selected);
    setCurrentIdx(0);
    setInput('');
    setSubmitted(false);
    setResults([]);
    setCurrentGrade(null);
    setIsRetry(false);
    firstResult.current = null;
    completedItems.current.clear();
    setPhase('practice');
  };

  useEffect(() => {
    if (phase === 'practice' && !submitted) {
      textareaRef.current?.focus();
    }
  }, [phase, currentIdx, submitted]);

  useEffect(() => {
    if (currentGrade !== null) nextButtonRef.current?.focus();
  }, [currentGrade]);

  const handleCheck = () => {
    if (submitted || !input.trim()) return;
    setSubmitted(true);
  };

  const handleGrade = (grade: Grade) => {
    if (!submitted || firstResult.current || completedItems.current.has(currentIdx)) return;
    firstResult.current = {
      sentence: sessionSentences[currentIdx],
      userAnswer: input.trim(),
      grade,
    };
    setCurrentGrade(grade);
  };

  const handleRetry = () => {
    if (!submitted || !firstResult.current || completedItems.current.has(currentIdx)) return;
    setIsRetry(true);
    setInput('');
    setSubmitted(false);
  };

  const handleNext = () => {
    if (!submitted || !firstResult.current || completedItems.current.has(currentIdx)) return;
    completedItems.current.add(currentIdx);
    const newResults = [...results, firstResult.current];
    setResults(newResults);

    if (currentIdx + 1 < sessionSentences.length) {
      setCurrentIdx(currentIdx + 1);
      setInput('');
      setSubmitted(false);
      setCurrentGrade(null);
      setIsRetry(false);
      firstResult.current = null;
    } else {
      // Session complete — award XP
      const correctCount = newResults.filter((r) => r.grade === 'correct').length;
      const partialCount = newResults.filter((r) => r.grade === 'partial').length;
      const xp =
        XP_TRANSLATION_BASE +
        correctCount * XP_PER_TRANSLATION_CORRECT +
        partialCount * XP_PER_TRANSLATION_PARTIAL;
      useXPStore.getState().addXP(xp);
      void guided.complete({
        itemsCompleted: newResults.length,
        score: Math.round(
          (newResults.reduce(
            (sum, result) => sum + GRADE_POINTS[result.grade],
            0,
          ) /
            (newResults.length * 3)) *
            100,
        ),
      });
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

  const resetPractice = () => {
    adaptive.reset();
    setPhase('setup');
    setResults([]);
    setCurrentIdx(0);
    setInput('');
    setSubmitted(false);
    setCurrentGrade(null);
    setIsRetry(false);
    firstResult.current = null;
  };

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (!isSupported && phase !== 'setup') {
    return <LanguageUnavailable requested={requested} options={supportedLanguages} onChange={setLanguage} feature="Translation practice" />;
  }
  if (phase !== 'setup' && adaptive.selection?.language !== language) {
    return <p role="status">Preparing this language…</p>;
  }

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
            {getLanguageLabel(language)}. Compare with one possible answer, then rate your first answer.
          </p>
        </div>
        <GuidedPracticeNotice guided={guided} />
        <AdaptivePracticeNotice {...adaptive} />

        {!guided.descriptor && !isSupported && (
          <LanguageUnavailable
            requested={requested}
            options={supportedLanguages}
            onChange={setLanguage}
            feature="Translation practice"
          />
        )}

        {!guided.descriptor && supportedLanguages.length > 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Language
            </label>
            <LanguagePicker
              options={supportedLanguages}
              value={language}
              onChange={setLanguage}
              label="Translation language"
            />
          </div>
        )}

        {/* Difficulty */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Difficulty
          </label>
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard', 'all'] as Difficulty[]).map((d) => (
              <button
                key={d}
                disabled={!!guided.descriptor?.scope?.difficulty || adaptive.status === 'loading'}
                onClick={() => { adaptive.reset(); setDifficulty(d); }}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium capitalize transition-colors ${
                  (guided.descriptor?.scope?.difficulty ?? difficulty) === d
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
          disabled={!isSupported || adaptive.status === 'loading' || allSentences.length === 0}
          className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold min-h-[44px] hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Practice
        </button>

        <Link
          to="/learn"
          className="block min-h-[44px] text-center text-sm text-indigo-600 dark:text-indigo-400 font-medium"
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
        <GuidedPracticeNotice guided={guided} />
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-5">
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
          {current.context && !submitted && (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{current.context}</p>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4">
          {isRetry && <p role="status" className="mb-3 text-sm text-slate-500 dark:text-slate-400">Retry practice — your first rating stays unchanged. No extra completion XP or review progress.</p>}
          <label htmlFor="translation-answer" className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {isRetry ? 'Your retry' : 'Your translation'}
          </label>
          <textarea
            id="translation-answer"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Type your translation…"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 text-lg placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-70"
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
              Compare answers
            </button>
          )}
        </div>

        {/* After submission — show reference & grading */}
        <AdaptivePracticeNotice {...adaptive} />
        {submitted && (
          <div className="space-y-4">
            <SentenceComparison sentence={current} language={language} answer={input.trim()} mode="translation" />

            {/* Self-assessment */}
            {currentGrade === null ? <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                Rate your first answer
              </p>
              <p id="translation-rating-guide" className="text-sm text-slate-500 dark:text-slate-400">
                Got it: the meaning, key form, and context fit. Partially: the idea came through, but something needs work. Missed it: the meaning changed or you needed the example.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleGrade('correct')}
                  aria-describedby="translation-rating-guide"
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors"
                >
                  <span className="text-xl">✅</span>
                  <span className="text-xs">Got it</span>
                </button>
                <button
                  onClick={() => handleGrade('partial')}
                  aria-describedby="translation-rating-guide"
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                >
                  <span className="text-xl">🟡</span>
                  <span className="text-xs">Partially</span>
                </button>
                <button
                  onClick={() => handleGrade('missed')}
                  aria-describedby="translation-rating-guide"
                  className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl font-semibold min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="text-xl">🌱</span>
                  <span className="text-xs">Missed it</span>
                </button>
              </div>
            </div> : <div className="space-y-3">
              <p role="status" className="text-sm text-slate-700 dark:text-slate-200">
                First answer rated: {GRADE_LABELS[currentGrade]}. You can retry for practice; this rating and your completion XP stay unchanged.
              </p>
              <div className="flex flex-wrap gap-3">
                <button ref={nextButtonRef} onClick={handleNext} className="flex-1 min-h-[44px] bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                  {currentIdx + 1 < sessionSentences.length ? 'Next sentence' : 'Finish session'}
                </button>
                <button onClick={handleRetry} className="min-h-[44px] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Retry this sentence
                </button>
              </div>
            </div>}
            <PracticeWordCapture key={current.id} language={language} text={current.target} context={current.target} source="translation" />
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-6 text-center space-y-3">
        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">
          {totalScore}/{maxScore}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{percentage}% self-rated points from first answers</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Retries are for practice and do not change these ratings.</p>

        <div className="flex justify-center gap-6 text-sm">
          <span className="text-green-700 dark:text-green-300">
            ✅ {results.filter((r) => r.grade === 'correct').length}
          </span>
          <span className="text-amber-700 dark:text-amber-300">
            🟡 {results.filter((r) => r.grade === 'partial').length}
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            🌱 {results.filter((r) => r.grade === 'missed').length}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">XP earned</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">+{xpEarned} XP</p>
        </div>

        {percentage >= 80 && (
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Review missed sentences
          </p>
          {missedSentences.map((r) => (
            <div
              key={r.sentence.id}
              className="rounded-xl bg-slate-50 dark:bg-slate-900 px-3 py-2"
            >
              <p className="text-sm text-slate-600 dark:text-slate-400">{r.sentence.english}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">One possible answer</p>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-100 mt-1" dir={isRTL(language) ? 'rtl' : undefined}>
                {r.sentence.target}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.sentence.reading}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <GuidedCompletionActions guided={guided} onPracticeAgain={resetPractice} />
      {!guided.isGuided && (
        <div className="flex gap-3">
          <button
            onClick={resetPractice}
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
      )}
      <InputActivityLink language={language} />
    </div>
  );
}
