import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { getLanguageLabel } from '../lib/languages';
import { jaPassages } from '../data/listening/ja-passages';
import { ruPassages } from '../data/listening/ru-passages';
import type { ListeningPassage, ListeningQuestion } from '../data/listening/ja-passages';

// ── helpers ─────────────────────────────────────────────

const LANG_PASSAGES: Record<string, ListeningPassage[]> = {
  ja: jaPassages,
  ru: ruPassages,
};

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25] as const;

function speakWithSpeed(text: string, language: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const LANG_MAP: Record<string, string> = { ja: 'ja-JP', ru: 'ru-RU' };
    utterance.lang = LANG_MAP[language] ?? language;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
type Screen = 'setup' | 'practice' | 'questions' | 'summary';

// ── component ───────────────────────────────────────────

export default function ListeningPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const supportedLanguages = activeLanguages.filter((l) => l in LANG_PASSAGES);

  const [language, setLanguage] = useState(supportedLanguages[0] ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [screen, setScreen] = useState<Screen>('setup');
  const [passage, setPassage] = useState<ListeningPassage | null>(null);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  // practice
  const [speed, setSpeed] = useState(1.0);
  const [playsLeft, setPlaysLeft] = useState(3);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // questions
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [revealed, setRevealed] = useState(false);

  // summary
  const [xpAwarded, setXpAwarded] = useState(0);

  // Cancel any ongoing speech when leaving the page
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // ── passage selection ─────────────────────────────────

  const pickPassage = useCallback(() => {
    const pool = (LANG_PASSAGES[language] ?? []).filter(
      (p) => (difficulty === 'all' || p.difficulty === difficulty) && !usedIds.has(p.id),
    );
    if (pool.length === 0) {
      // reset used ids if exhausted
      setUsedIds(new Set());
      const fullPool = (LANG_PASSAGES[language] ?? []).filter(
        (p) => difficulty === 'all' || p.difficulty === difficulty,
      );
      return fullPool[Math.floor(Math.random() * fullPool.length)] ?? null;
    }
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }, [language, difficulty, usedIds]);

  // ── handlers ──────────────────────────────────────────

  function startPractice() {
    const p = pickPassage();
    if (!p) return;
    setPassage(p);
    setUsedIds((prev) => new Set(prev).add(p.id));
    setPlaysLeft(3);
    setHasPlayed(false);
    setIsPlaying(false);
    setSpeed(1.0);
    setQIndex(0);
    setAnswers(p.questions.map(() => null));
    setRevealed(false);
    setXpAwarded(0);
    setScreen('practice');
  }

  async function handlePlay() {
    if (!passage || isPlaying) return;
    setIsPlaying(true);
    await speakWithSpeed(passage.text, language, speed);
    setIsPlaying(false);
    setHasPlayed(true);
    setPlaysLeft((n) => Math.max(0, n - 1));
  }

  function handleReplay() {
    handlePlay();
  }

  function goToQuestions() {
    setScreen('questions');
  }

  function selectAnswer(optIdx: number) {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIdx;
      return next;
    });
    setRevealed(true);
  }

  function nextQuestion() {
    if (!passage) return;
    if (qIndex + 1 < passage.questions.length) {
      setQIndex((i) => i + 1);
      setRevealed(false);
    } else {
      // calculate score
      const correct = passage.questions.reduce(
        (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
        0,
      );
      const xp = 25 + correct * 5;
      useXPStore.getState().addXP(xp);
      setXpAwarded(xp);
      setScreen('summary');
    }
  }

  function handleNextPassage() {
    startPractice();
  }

  function handleBack() {
    window.speechSynthesis?.cancel();
    setScreen('setup');
  }

  // ── no supported languages ────────────────────────────

  if (supportedLanguages.length === 0) {
    return (
      <div className="text-center py-12 page-enter">
        <p className="text-4xl mb-4">🎧</p>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Listening practice is available for Japanese and Russian.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Add one of these languages in Settings to get started.
        </p>
        <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 font-medium">
          Go to Settings →
        </Link>
      </div>
    );
  }

  // ── SETUP ─────────────────────────────────────────────

  if (screen === 'setup') {
    return (
      <div className="page-enter">
        <Link to="/learn" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6">
          🎧 Listening Practice
        </h2>

        {/* Language */}
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
          Language
        </label>
        <div className="flex gap-2 mb-6">
          {supportedLanguages.map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                language === l
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {getLanguageLabel(l)}
            </button>
          ))}
        </div>

        {/* Difficulty */}
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
          Difficulty
        </label>
        <div className="flex gap-2 mb-8">
          {(['all', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                difficulty === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={startPractice}
          disabled={!language}
          className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-lg disabled:opacity-50 hover:bg-indigo-700 press-feedback transition-colors"
        >
          Start Listening Practice
        </button>
      </div>
    );
  }

  // ── PRACTICE (audio) ──────────────────────────────────

  if (screen === 'practice' && passage) {
    return (
      <div className="page-enter">
        <button onClick={handleBack} className="text-sm text-indigo-600 dark:text-indigo-400 mb-4">
          ← Back
        </button>

        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          {passage.title}
        </h3>
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize mb-6">
          {passage.difficulty}
        </span>

        {/* Play / Pause */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg hover:bg-indigo-700 disabled:opacity-60 press-feedback transition-colors"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>

          <button
            onClick={handleReplay}
            disabled={isPlaying}
            className="text-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-40"
          >
            🔄 Replay
          </button>

          {playsLeft > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Listen {playsLeft} more {playsLeft === 1 ? 'time' : 'times'}
            </p>
          )}
        </div>

        {/* Speed */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {hasPlayed && (
          <button
            onClick={goToQuestions}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
          >
            Answer Questions →
          </button>
        )}
      </div>
    );
  }

  // ── QUESTIONS ─────────────────────────────────────────

  if (screen === 'questions' && passage) {
    const q: ListeningQuestion = passage.questions[qIndex];
    const selected = answers[qIndex];

    return (
      <div className="page-enter">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Question {qIndex + 1} / {passage.questions.length}
        </p>

        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
          {q.question}
        </p>

        <div className="space-y-3 mb-6">
          {q.options.map((opt, i) => {
            let style =
              'bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-slate-100';
            if (revealed) {
              if (i === q.correctIndex) {
                style = 'bg-green-100 dark:bg-green-900 border border-green-500 text-green-800 dark:text-green-200';
              } else if (i === selected && i !== q.correctIndex) {
                style = 'bg-red-100 dark:bg-red-900 border border-red-500 text-red-800 dark:text-red-200';
              }
            } else if (i === selected) {
              style = 'bg-indigo-100 dark:bg-indigo-900 border border-indigo-500 text-indigo-800 dark:text-indigo-200';
            }

            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={revealed}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {revealed && (
          <button
            onClick={nextQuestion}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
          >
            {qIndex + 1 < passage.questions.length ? 'Next Question →' : 'See Results'}
          </button>
        )}
      </div>
    );
  }

  // ── SUMMARY ───────────────────────────────────────────

  if (screen === 'summary' && passage) {
    const correct = passage.questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0),
      0,
    );

    return (
      <div className="text-center py-6 page-enter">
        <p className="text-4xl mb-4">🎉</p>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Practice Complete!
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-1">
          Score: {correct} / {passage.questions.length} correct
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-8">
          +{xpAwarded} XP earned
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-2xl border border-gray-300 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 press-feedback transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNextPassage}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 press-feedback transition-colors"
          >
            Next Passage
          </button>
        </div>
      </div>
    );
  }

  return null;
}
