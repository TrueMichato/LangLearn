import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import { rtlProps } from '../lib/rtl';
import { speak } from '../lib/tts';
import { XP_NUMBER_BASE, XP_PER_NUMBER_CORRECT } from '../lib/xp';
import { getNumbersForLanguage, NUMBER_LANGUAGES, type NumberEntry } from '../data/numbers';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import {
  seededShuffle,
  selectGuidedItems,
  type GuidedPracticeDescriptor,
} from '../lib/guided-practice';
import { loadSkillProgress, recordSkillAnswer } from '../db/skill-progress';
import { selectSkillItems } from '../lib/skill-adaptation';
import type { SkillProgress } from '../db/schema';

type Phase = 'setup' | 'session' | 'summary';
type Direction = 'numeral-to-word' | 'word-to-numeral';

const RANGE_LABELS: Record<NumberEntry['range'], string> = {
  ones: '0–10',
  teens: '11–19',
  tens: '20–99',
  hundreds: '100–999',
  thousands: '1000+',
};

const RANGE_ORDER: NumberEntry['range'][] = ['ones', 'teens', 'tens', 'hundreds', 'thousands'];

const SESSION_LENGTH = 12;

interface Question {
  entry: NumberEntry;
  options: NumberEntry[]; // includes the correct entry, shuffled
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestions(
  pool: NumberEntry[],
  guided?: GuidedPracticeDescriptor,
  selected?: NumberEntry[],
): Question[] {
  const order = selected ?? (guided
    ? selectGuidedItems(pool, guided, (entry) => String(entry.value))
    : shuffle(pool).slice(0, Math.min(SESSION_LENGTH, pool.length)));
  return order.map((entry) => {
    const distractorPool = pool.filter((n) => n.value !== entry.value);
    const distractors = guided
      ? seededShuffle(
          distractorPool,
          `${guided.seed}/distractors/${entry.value}`,
        ).slice(0, 3)
      : shuffle(distractorPool).slice(0, 3);
    return {
      entry,
      options: guided
        ? seededShuffle(
            [entry, ...distractors],
            `${guided.seed}/options/${entry.value}`,
          )
        : shuffle([entry, ...distractors]),
    };
  });
}

export default function NumberPracticePage() {
  const {
    language: currentLanguage,
    setLanguage,
    options: numberLanguages,
    isSupported,
    requested,
  } = useCurrentLanguage(NUMBER_LANGUAGES);
  const language = currentLanguage ?? 'ar';
  const [phase, setPhase] = useState<Phase>('setup');
  const [direction, setDirection] = useState<Direction>('numeral-to-word');
  const [selectedRanges, setSelectedRanges] = useState<Set<NumberEntry['range']>>(new Set());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null); // chosen option value
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const current = questions[index] ?? null;
  const availableRanges = useMemo(() => {
    const ranges = new Set(getNumbersForLanguage(language).map((n) => n.range));
    return RANGE_ORDER.filter((r) => ranges.has(r));
  }, [language]);

  const pool = useMemo(() => {
    const all = getNumbersForLanguage(language);
    return selectedRanges.size > 0 ? all.filter((n) => selectedRanges.has(n.range)) : all;
  }, [language, selectedRanges]);
  const guided = useGuidedPractice('numbers', language);
  const practiceDirection = guided.descriptor?.scope?.task === 'numeral-to-word' ||
    guided.descriptor?.scope?.task === 'word-to-numeral'
    ? guided.descriptor.scope.task : direction;
  const [starting, setStarting] = useState(false);
  const [skillError, setSkillError] = useState('');
  const answerLock = useRef(false);
  const advanceLock = useRef(false);
  const sessionIdentity = `${language}/${guided.descriptor?.milestoneId ?? ''}/${JSON.stringify(guided.descriptor?.scope ?? null)}`;
  const activeIdentity = useRef(sessionIdentity);
  const [loadedIdentity, setLoadedIdentity] = useState('');
  if (loadedIdentity !== sessionIdentity) {
    setLoadedIdentity(sessionIdentity);
    setPhase('setup');
    setQuestions([]);
    setStarting(false);
  }
  useEffect(() => {
    activeIdentity.current = sessionIdentity;
    answerLock.current = false;
    advanceLock.current = false;
  }, [sessionIdentity]);

  const speakEntry = useCallback(
    (entry: NumberEntry) => {
      void speak(entry.word, language);
    },
    [language],
  );

  const startSession = useCallback(async () => {
    if (starting || (!isSupported && !guided.isGuided)) return;
    const identity = sessionIdentity;
    setStarting(true);
    setSkillError('');
    const sessionPool = guided.descriptor
      ? getNumbersForLanguage(language).filter((entry) =>
          (!guided.descriptor?.scope?.ranges || guided.descriptor.scope.ranges.includes(entry.range)) &&
          (!guided.descriptor?.scope?.itemIds || guided.descriptor.scope.itemIds.includes(String(entry.value))))
      : pool;
    let history: SkillProgress[];
    try {
      history = await loadSkillProgress(language, 'numbers');
    } catch {
      history = [];
      setSkillError('Number practice history could not be loaded. Practice can continue without adaptation.');
    }
    if (activeIdentity.current !== identity) return;
    setStarting(false);
    if (sessionPool.length < Math.max(4, guided.descriptor?.session.minItems ?? 4)) {
      setSkillError('There are not enough numbers for this scope. Choose another range or return to your path.');
      return;
    }
    const selected = selectSkillItems(sessionPool, history, (entry) => `${practiceDirection}/${entry.range}`,
      guided.descriptor?.session.targetItems ?? SESSION_LENGTH,
      guided.descriptor?.seed ?? `${language}/${Date.now()}`);
    const qs = buildQuestions(
      sessionPool,
      guided.descriptor ?? undefined,
      selected,
    );
    answerLock.current = false;
    advanceLock.current = false;
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(null);
    setPhase('session');
  }, [guided.descriptor, guided.isGuided, language, pool, practiceDirection, starting, sessionIdentity, isSupported]);

  const handleAnswer = useCallback(
    (value: number) => {
      if (answered !== null || !current || answerLock.current) return;
      answerLock.current = true;
      advanceLock.current = false;
      setAnswered(value);
      const isCorrect = value === current.entry.value;
      void recordSkillAnswer(language, 'numbers', `${practiceDirection}/${current.entry.range}`, isCorrect).catch(() => {
        setSkillError('Your answer counts, but number practice history could not be saved on this device.');
      });
      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((st) => {
          const next = st + 1;
          setBestStreak((b) => (next > b ? next : b));
          return next;
        });
        if (practiceDirection === 'word-to-numeral') speakEntry(current.entry);
      } else {
        setStreak(0);
      }
    },
    [answered, current, practiceDirection, speakEntry, language],
  );

  const next = useCallback(() => {
    if (answered === null || advanceLock.current) return;
    advanceLock.current = true;
    const nextIdx = index + 1;
    if (nextIdx >= questions.length) {
      const xp = XP_NUMBER_BASE + score * XP_PER_NUMBER_CORRECT;
      useXPStore.getState().addXP(xp);
      void guided.complete({
        itemsCompleted: questions.length,
        score: Math.round((score / questions.length) * 100),
      });
      setPhase('summary');
      return;
    }
    setIndex(nextIdx);
    answerLock.current = false;
    setAnswered(null);
  }, [index, questions.length, score, guided, answered]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'session' || !current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, select, button, a, [role="dialog"], [contenteditable="true"]')) return;
      if (answered === null) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= current.options.length) {
          handleAnswer(current.options[n - 1].value);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, current, answered, handleAnswer, next]);

  const toggleRange = (range: NumberEntry['range']) => {
    setSelectedRanges((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(range)) nextSet.delete(range);
      else nextSet.add(range);
      return nextSet;
    });
  };

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }

  // No number data for any active language
  if (numberLanguages.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-5xl">🔢</div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Number Practice</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Number drills aren't available for your active languages yet. Add Arabic to practice
          reading and spelling numbers.
        </p>
      </div>
    );
  }

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div>
        <GuidedPracticeNotice guided={guided} />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">🔢 Number Practice</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Learn to read and spell numbers. Match digits to their written-out form (and back).
        </p>

        {!isSupported && (
          <LanguageUnavailable
            className="mb-4"
            requested={requested}
            options={numberLanguages}
            onChange={setLanguage}
            feature="Number practice"
          />
        )}

        {!guided.isGuided && <LanguagePicker
          className="mb-4"
          options={numberLanguages}
          value={language}
          onChange={(code) => {
            setLanguage(code);
            setSelectedRanges(new Set());
          }}
          label="Number language"
        />}

        {/* Direction toggle */}
        {!guided.isGuided && <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDirection('numeral-to-word')}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors press-feedback min-h-[44px] ${
                direction === 'numeral-to-word'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Digit → Word
            </button>
            <button
              onClick={() => setDirection('word-to-numeral')}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors press-feedback min-h-[44px] ${
                direction === 'word-to-numeral'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Word → Digit
            </button>
          </div>
        </div>}

        {/* Range filter */}
        {!guided.isGuided && <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Ranges {selectedRanges.size > 0 ? `(${selectedRanges.size} selected)` : '(all)'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableRanges.map((range) => (
              <button
                key={range}
                onClick={() => toggleRange(range)}
                className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm font-medium transition-colors press-feedback min-h-[44px] ${
                  selectedRanges.has(range)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>}
        {skillError && <p role="status" className="mb-3 text-sm text-slate-500 dark:text-slate-400">{skillError}</p>}
        <button
          onClick={startSession}
          disabled={pool.length < 4 || starting || (!isSupported && !guided.isGuided)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 press-feedback min-h-[44px]"
        >
          {starting ? 'Preparing practice…' : `Start Practice (${Math.min(guided.descriptor?.session.targetItems ?? SESSION_LENGTH, pool.length)} questions)`}
        </button>
        {pool.length < 4 && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
            Select at least one range with enough numbers.
          </p>
        )}
      </div>
    );
  }

  // SUMMARY PHASE
  if (phase === 'summary') {
    const total = questions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Session Complete!</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-3">
          <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">
            {score}/{total}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">correct answers</p>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{pct}%</span>
              <span className="text-slate-500 dark:text-slate-400 ml-1">accuracy</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{bestStreak}</span>
              <span className="text-slate-500 dark:text-slate-400 ml-1">best streak</span>
            </div>
          </div>
          <div className="pt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            +{XP_NUMBER_BASE + score * XP_PER_NUMBER_CORRECT} XP earned
          </div>
        </div>
        <GuidedCompletionActions
          guided={guided}
          onPracticeAgain={() => setPhase('setup')}
        />
        {!guided.isGuided && (
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('setup')}
              className="flex-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 py-3 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors press-feedback min-h-[44px]"
            >
              New Session
            </button>
            <button
              onClick={startSession}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors press-feedback min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // SESSION PHASE
  if (!current) return null;
  const total = questions.length;
  const isNumeralPrompt = practiceDirection === 'numeral-to-word';
  const correctValue = current.entry.value;

  return (
    <div>
      <GuidedPracticeNotice guided={guided} />
      {/* Progress + stats */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {index + 1} / {total}
        </span>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 dark:text-green-400">✓ {score}</span>
          {streak > 1 && <span className="text-amber-600 dark:text-amber-400">🔥 {streak}</span>}
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-6">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Prompt */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 mb-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {isNumeralPrompt ? 'Which word is this number?' : 'Which number is this word?'}
        </p>
        {isNumeralPrompt ? (
          <div>
            <div className="text-6xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {current.entry.numeral}
            </div>
            <div className="text-lg text-slate-500 dark:text-slate-400 mt-2">{current.entry.value}</div>
          </div>
        ) : (
          <div>
            <div
              className="text-4xl font-bold text-slate-800 dark:text-slate-100 leading-snug"
              {...rtlProps(language)}
            >
              {current.entry.word}
            </div>
            <button
              onClick={() => speakEntry(current.entry)}
              className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline press-feedback min-h-[44px]"
            >
              🔊 Listen
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {current.options.map((opt, i) => {
          const isChosen = answered === opt.value;
          const isRight = opt.value === correctValue;
          let cls =
            'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500';
          if (answered !== null) {
            if (isRight) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30';
            else if (isChosen) cls = 'border-red-500 bg-red-50 dark:bg-red-900/30';
            else cls = 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 opacity-60';
          }
          return (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              disabled={answered !== null}
              className={`flex flex-col items-center justify-center gap-1 p-4 rounded-2xl border-2 transition-all press-feedback min-h-[72px] ${cls}`}
            >
              {isNumeralPrompt ? (
                <>
                  <span
                    className="text-2xl font-bold text-slate-800 dark:text-slate-100"
                    {...rtlProps(language)}
                  >
                    {opt.word}
                  </span>
                  {answered !== null && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{opt.reading}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {opt.numeral}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{opt.value}</span>
                </>
              )}
              <span className="sr-only">Option {i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback + next */}
      {answered !== null && (
        <div className="text-center space-y-4">
          <div
            className={`text-lg font-semibold ${
              answered === correctValue
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {answered === correctValue ? '✓ Correct!' : '✗ Not quite'}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <span className="text-2xl font-bold" {...rtlProps(language)}>
              {current.entry.numeral}
            </span>
            <span className="mx-2 text-slate-400">=</span>
            <span className="text-xl font-semibold" {...rtlProps(language)}>
              {current.entry.word}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
              {current.entry.reading} · {current.entry.value}
            </span>
          </div>
          <button
            onClick={next}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors press-feedback min-h-[44px]"
          >
            {index + 1 < total ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
