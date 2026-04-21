import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { getLanguageLabel } from '../lib/languages';
import { speak } from '../lib/tts';
import { jaMinimalPairs, ruMinimalPairs } from '../data/minimal-pairs';
import type { MinimalPair } from '../data/minimal-pairs';

type Phase = 'setup' | 'session' | 'summary';

const CATEGORIES: Record<string, string> = {
  // JA
  voicing: 'Voicing (k/g, t/d, h/b)',
  'vowel-length': 'Long vs Short Vowels',
  gemination: 'Double Consonants (っ)',
  nasal: 'Nasals (ん)',
  'similar-sounds': 'Similar Sounds',
  // RU
  'hard-soft': 'Hard vs Soft Consonants',
  sibilants: 'Sibilants (ш/щ, с/ш)',
  stress: 'Stress Patterns',
  'consonant-clusters': 'Consonant Contrasts',
};

function getPairsForLanguage(language: string): MinimalPair[] {
  switch (language) {
    case 'ja': return jaMinimalPairs;
    case 'ru': return ruMinimalPairs;
    default: return [];
  }
}

function getCategoriesForLanguage(language: string): string[] {
  const pairs = getPairsForLanguage(language);
  return [...new Set(pairs.map((p) => p.category))];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function MinimalPairsPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [language, setLanguage] = useState(activeLanguages[0] ?? 'ja');
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<MinimalPair[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState<'a' | 'b' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'a' | 'b'>('a');
  const [showingPair, setShowingPair] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const current = queue[index] ?? null;

  const playAudio = useCallback((pair: MinimalPair, which: 'a' | 'b') => {
    const word = which === 'a' ? pair.wordA : pair.wordB;
    speak(word, language);
  }, [language]);

  const startSession = () => {
    const allPairs = getPairsForLanguage(language);
    const filtered = selectedCategories.size > 0
      ? allPairs.filter((p) => selectedCategories.has(p.category))
      : allPairs;
    if (filtered.length === 0) return;
    const shuffled = shuffle(filtered);
    setQueue(shuffled);
    setIndex(0);
    setScore(0);
    setTotal(shuffled.length);
    setStreak(0);
    setBestStreak(0);
    setAnswered(null);
    setShowingPair(false);

    // randomly choose which word to play first
    const ans: 'a' | 'b' = Math.random() < 0.5 ? 'a' : 'b';
    setCorrectAnswer(ans);
    setPhase('session');

    // Play the target word after a short delay
    setTimeout(() => {
      const pair = shuffled[0];
      if (pair) playAudio(pair, ans);
    }, 400);
  };

  const handleAnswer = (choice: 'a' | 'b') => {
    if (answered !== null) return;
    setAnswered(choice);
    setShowingPair(true);

    const isCorrect = choice === correctAnswer;
    if (isCorrect) {
      const newStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setStreak(0);
    }
  };

  const nextPair = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    const nextIdx = index + 1;
    if (nextIdx >= queue.length) {
      // Session complete
      const finalScore = score + (answered === correctAnswer ? 0 : 0); // score already updated
      const xp = 15 + finalScore * 2;
      useXPStore.getState().addXP(xp);
      setPhase('summary');
      return;
    }
    setIndex(nextIdx);
    setAnswered(null);
    setShowingPair(false);

    const ans: 'a' | 'b' = Math.random() < 0.5 ? 'a' : 'b';
    setCorrectAnswer(ans);

    setTimeout(() => {
      const pair = queue[nextIdx];
      if (pair) playAudio(pair, ans);
    }, 400);
  }, [index, queue, score, answered, correctAnswer, bestStreak, playAudio]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'session') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'a') handleAnswer('a');
      else if (e.key === '2' || e.key === 'b') handleAnswer('b');
      else if ((e.key === 'Enter' || e.key === ' ') && answered !== null) nextPair();
      else if (e.key === 'r' && current) {
        playAudio(current, correctAnswer);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, answered, current, correctAnswer, nextPair, playAudio]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // SETUP PHASE
  if (phase === 'setup') {
    const categories = getCategoriesForLanguage(language);
    const allPairs = getPairsForLanguage(language);
    const filteredCount = selectedCategories.size > 0
      ? allPairs.filter((p) => selectedCategories.has(p.category)).length
      : allPairs.length;

    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          🎧 Minimal Pairs
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Train your ear to distinguish similar sounds. Listen to a word, then pick which one you heard.
        </p>

        {/* Language selector */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
          {activeLanguages.map((code) => {
            const pairs = getPairsForLanguage(code);
            return (
              <button
                key={code}
                onClick={() => { setLanguage(code); setSelectedCategories(new Set()); }}
                disabled={pairs.length === 0}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors press-feedback min-h-[44px] ${
                  language === code
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                } disabled:opacity-40`}
              >
                {getLanguageLabel(code)}
              </button>
            );
          })}
        </div>

        {/* Category filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Categories {selectedCategories.size > 0 ? `(${selectedCategories.size} selected)` : '(all)'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors press-feedback min-h-[44px] ${
                  selectedCategories.has(cat)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {CATEGORIES[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          disabled={filteredCount === 0}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 press-feedback min-h-[44px]"
        >
          Start Practice ({filteredCount} pairs)
        </button>
      </div>
    );
  }

  // SUMMARY PHASE
  if (phase === 'summary') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Session Complete!
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-3">
          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {score}/{total}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">correct answers</p>
          <div className="flex justify-center gap-6 text-sm">
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{pct}%</span>
              <span className="text-gray-400 dark:text-gray-500 ml-1">accuracy</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{bestStreak}</span>
              <span className="text-gray-400 dark:text-gray-500 ml-1">best streak</span>
            </div>
          </div>
          <div className="pt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
            +{15 + score * 2} XP earned
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('setup')}
            className="flex-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 py-3 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors press-feedback min-h-[44px]"
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
      </div>
    );
  }

  // SESSION PHASE
  if (!current) return null;

  const isCorrect = answered === correctAnswer;

  return (
    <div>
      {/* Progress bar and stats */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {index + 1} / {total}
        </span>
        <div className="flex gap-3 text-sm">
          <span className="text-green-600 dark:text-green-400">✓ {score}</span>
          {streak > 1 && (
            <span className="text-amber-600 dark:text-amber-400">🔥 {streak}</span>
          )}
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-6">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Hint */}
      <div className="text-center mb-4">
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {CATEGORIES[current.category] ?? current.category} · {current.hint}
        </span>
      </div>

      {/* Replay button */}
      <div className="text-center mb-6">
        <button
          onClick={() => playAudio(current, correctAnswer)}
          className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-6 py-3 rounded-2xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors press-feedback min-h-[44px]"
        >
          🔊 Play Again
        </button>
      </div>

      {/* Choice buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => handleAnswer('a')}
          disabled={answered !== null}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all press-feedback min-h-[44px] ${
            answered === null
              ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500'
              : answered === 'a' && isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : answered === 'a' && !isCorrect
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  : correctAnswer === 'a'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 opacity-60'
          }`}
        >
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {current.wordA}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {current.readingA}
          </span>
          {showingPair && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {current.meaningA}
            </span>
          )}
        </button>
        <button
          onClick={() => handleAnswer('b')}
          disabled={answered !== null}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all press-feedback min-h-[44px] ${
            answered === null
              ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500'
              : answered === 'b' && isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : answered === 'b' && !isCorrect
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  : correctAnswer === 'b'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-gray-800 opacity-60'
          }`}
        >
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {current.wordB}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {current.readingB}
          </span>
          {showingPair && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {current.meaningB}
            </span>
          )}
        </button>
      </div>

      {/* Feedback and next */}
      {answered !== null && (
        <div className="text-center space-y-4">
          <div className={`text-lg font-semibold ${
            isCorrect
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isCorrect ? '✓ Correct!' : `✗ It was "${correctAnswer === 'a' ? current.wordA : current.wordB}"`}
          </div>

          {/* Play both for comparison */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => playAudio(current, 'a')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline press-feedback min-h-[44px] flex items-center gap-1"
            >
              🔊 {current.wordA}
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => playAudio(current, 'b')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline press-feedback min-h-[44px] flex items-center gap-1"
            >
              🔊 {current.wordB}
            </button>
          </div>

          <button
            onClick={nextPair}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors press-feedback min-h-[44px]"
          >
            {index + 1 < total ? 'Next Pair →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
