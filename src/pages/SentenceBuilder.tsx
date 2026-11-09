import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import {
  getPracticeSentences,
  SENTENCE_LANGUAGES,
  type PracticeSentence,
} from '../data/sentences';
import TileBuilder from '../components/sentences/TileBuilder';
import TypeBuilder from '../components/sentences/TypeBuilder';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { useAdaptivePractice } from '../hooks/useAdaptivePractice';
import AdaptivePracticeNotice from '../components/common/AdaptivePracticeNotice';

type Mode = 'tiles' | 'type';
type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
type Phase = 'setup' | 'session' | 'summary';

const SENTENCES_PER_SESSION = 10;
const ACTIVE_OPTION_CLASSES = 'bg-indigo-600 text-white';
const INACTIVE_OPTION_CLASSES =
  'border border-slate-300 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-700 dark:text-slate-300';

export default function SentenceBuilderPage() {
  const current = useCurrentLanguage(SENTENCE_LANGUAGES);
  const { search } = useLocation();
  return <SentenceBuilderSession key={`${current.requested}/${search}`} current={current} />;
}

export function SentenceBuilderSession({ current: languageState }: { current: ReturnType<typeof useCurrentLanguage> }) {
  const {
    language: currentLanguage,
    setLanguage,
    options: supportedLanguages,
    isSupported,
    requested,
  } = languageState;

  const [phase, setPhase] = useState<Phase>('setup');
  const language = currentLanguage ?? 'ja';
  const [mode, setMode] = useState<Mode>('tiles');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [sessionSentences, setSessionSentences] = useState<PracticeSentence[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);

  const allSentences = useMemo(() => getPracticeSentences(language), [language]);
  const guided = useGuidedPractice('sentence', language);
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
      seed: guided.descriptor?.seed ?? `${language}/sentence`,
      session: guided.descriptor?.session ?? { minItems: 1, targetItems: SENTENCES_PER_SESSION, maxItems: SENTENCES_PER_SESSION },
      difficulties: level === 'all' ? undefined : [level],
    }, (item, index) => ({
      id: item.id, language, difficulty: item.difficulty, text: item.target,
      order: ({ easy: 0, medium: 1000, hard: 2000 }[item.difficulty]) + index,
    }));
    if (!selected) return;
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
      void guided.complete({
        itemsCompleted: sessionSentences.length,
        score: Math.round((finalScore / sessionSentences.length) * 100),
      });
      setScore(finalScore);
      setPhase('summary');
    } else {
      setCurrentIdx(next);
    }
  };

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (!isSupported && phase !== 'setup') {
    return <LanguageUnavailable requested={requested} options={supportedLanguages} onChange={setLanguage} feature="Sentence Builder" />;
  }
  if (phase !== 'setup' && adaptive.selection?.language !== language) {
    return <p role="status">Preparing this language…</p>;
  }

  const restart = () => {
    setPhase('setup');
    setScore(0);
    setCurrentIdx(0);
    setSessionSentences([]);
    adaptive.reset();
  };

  // ── Setup ──
  if (phase === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-6 page-enter">
        <div>
          <Link to="/learn" className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
            ← Back to Learn
          </Link>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">✍️ Sentence Builder</h2>
        </div>
        <GuidedPracticeNotice guided={guided} />
        <AdaptivePracticeNotice {...adaptive} />

        {!guided.descriptor && !isSupported && (
          <LanguageUnavailable
            requested={requested}
            options={supportedLanguages}
            onChange={setLanguage}
            feature="Sentence Builder"
          />
        )}

        {!guided.descriptor && supportedLanguages.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Language</label>
            <LanguagePicker
              options={supportedLanguages}
              value={language}
              onChange={setLanguage}
              label="Sentence language"
            />
          </div>
        )}

        {/* Mode */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Mode</label>
          <div className="flex gap-2">
            {(['tiles', 'type'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                  mode === m ? ACTIVE_OPTION_CLASSES : INACTIVE_OPTION_CLASSES
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
                disabled={!!guided.descriptor?.scope?.difficulty || adaptive.status === 'loading'}
                onClick={() => { adaptive.reset(); setDifficulty(d); }}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium capitalize transition-colors ${
                  (guided.descriptor?.scope?.difficulty ?? difficulty) === d
                    ? ACTIVE_OPTION_CLASSES
                    : INACTIVE_OPTION_CLASSES
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
          disabled={!isSupported || adaptive.status === 'loading'}
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

        <GuidedCompletionActions guided={guided} onPracticeAgain={restart} />
        {!guided.isGuided && (
          <div className="flex flex-col gap-3">
            <button onClick={restart} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 press-feedback transition-colors">
              Practice Again
            </button>
            <Link to="/learn" className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 press-feedback transition-colors inline-block">
              ← Back
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── Session ──
  const currentSentence = sessionSentences[currentIdx];
  return (
    <div className="max-w-md mx-auto space-y-4 page-enter">
      <GuidedPracticeNotice guided={guided} />
      <AdaptivePracticeNotice {...adaptive} />
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
