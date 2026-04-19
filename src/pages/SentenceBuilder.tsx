import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { getLanguageLabel } from '../lib/languages';
import { jaSentences } from '../data/sentences/ja-sentences';
import { ruSentences } from '../data/sentences/ru-sentences';
import type { PracticeSentence } from '../data/sentences/ja-sentences';
import TileBuilder from '../components/sentences/TileBuilder';
import TypeBuilder from '../components/sentences/TypeBuilder';

type Mode = 'tiles' | 'type';
type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
type Phase = 'setup' | 'session' | 'summary';

const SENTENCES_PER_SESSION = 10;

function getSentences(lang: string): PracticeSentence[] {
  if (lang === 'ja') return jaSentences;
  if (lang === 'ru') return ruSentences;
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

export default function SentenceBuilderPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const supportedLanguages = activeLanguages.filter((l) => l === 'ja' || l === 'ru');

  const [phase, setPhase] = useState<Phase>('setup');
  const [language, setLanguage] = useState(supportedLanguages[0] ?? 'ja');
  const [mode, setMode] = useState<Mode>('tiles');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sessionSentences, setSessionSentences] = useState<PracticeSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);

  const allSentences = useMemo(() => getSentences(language), [language]);

  const startSession = () => {
    let pool = allSentences;
    if (difficulty !== 'all') pool = pool.filter((s) => s.difficulty === difficulty);
    const selected = shuffle(pool).slice(0, SENTENCES_PER_SESSION);
    if (selected.length === 0) return;
    setSessionSentences(selected);
    setCurrentIdx(0);
    setScore(0);
    setPhase('session');
  };

  const handleResult = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    const next = currentIdx + 1;
    if (next >= sessionSentences.length) {
      const finalScore = correct ? score + 1 : score;
      const xp = 20 + finalScore * 3;
      useXPStore.getState().addXP(xp);
      setScore(finalScore);
      setPhase('summary');
    } else {
      setCurrentIdx(next);
    }
  };

  const restart = () => {
    setPhase('setup');
    setScore(0);
    setCurrentIdx(0);
    setSessionSentences([]);
  };

  // ── Setup ──
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-6 page-enter">
        <div>
          <Link to="/learn" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
            ← Back to Learn
          </Link>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">✍️ Sentence Builder</h2>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Language</label>
          <div className="flex gap-2">
            {supportedLanguages.length > 0 ? (
              supportedLanguages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    language === l ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-white/10'
                  }`}
                >
                  {getLanguageLabel(l)}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Add Japanese or Russian in Settings to use Sentence Builder.</p>
            )}
          </div>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Mode</label>
          <div className="flex gap-2">
            {(['tiles', 'type'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  mode === m ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-white/10'
                }`}
              >
                {m === 'tiles' ? '🧩 Tiles' : '⌨️ Type'}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                  difficulty === d ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-gray-300 dark:border-white/10'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <button
          onClick={startSession}
          disabled={supportedLanguages.length === 0}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors disabled:opacity-40"
        >
          Start Practice
        </button>
      </div>
    );
  }

  // ── Summary ──
  if (phase === 'summary') {
    const xp = 20 + score * 3;
    return (
      <div className="max-w-md mx-auto text-center space-y-6 page-enter">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Session Complete!</h2>
        <p className="text-5xl">🎉</p>
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Score: <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span> / {sessionSentences.length}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">+{xp} XP earned</p>

        <div className="flex flex-col gap-3">
          <button onClick={restart} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors">
            Practice Again
          </button>
          <Link to="/learn" className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 press-feedback transition-colors inline-block">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  // ── Session ──
  const currentSentence = sessionSentences[currentIdx];
  return (
    <div className="max-w-md mx-auto space-y-4 page-enter">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Question {currentIdx + 1} / {sessionSentences.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / sessionSentences.length) * 100}%` }} />
      </div>

      {/* Builder */}
      {mode === 'tiles' ? (
        <TileBuilder key={currentSentence.id} sentence={currentSentence} language={language} allSentences={allSentences} onResult={handleResult} />
      ) : (
        <TypeBuilder key={currentSentence.id} sentence={currentSentence} language={language} onResult={handleResult} />
      )}
    </div>
  );
}
