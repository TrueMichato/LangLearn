import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { getAlphabetsForLanguage, ALPHABET_DATA } from '../data/alphabets';
import { getCharacterProgress } from '../db/characters';
import { lettersRoute } from '../lib/routes';
import LanguagePicker from '../components/common/LanguagePicker';
import CharacterChart from '../components/letters/CharacterChart';
import DrawingCanvas from '../components/letters/DrawingCanvas';
import RecognitionQuiz from '../components/letters/RecognitionQuiz';
import GuidedLearning from '../components/letters/GuidedLearning';
import { SkeletonCard, SkeletonList } from '../components/common/Skeleton';
import type { CharacterProgress } from '../db/schema';

type PracticeMode = 'chart' | 'draw' | 'quiz' | 'learn';

const PRACTICE_MODES: PracticeMode[] = ['chart', 'draw', 'quiz', 'learn'];

/** Module-level so the hook's memo doesn't churn on every render. */
const LETTER_LANGUAGES = Object.keys(ALPHABET_DATA);

function isPracticeMode(value: string | null): value is PracticeMode {
  return value !== null && (PRACTICE_MODES as string[]).includes(value);
}

export default function LetterPractice() {
  const { lang = 'ja' } = useParams();
  const setCurrentLanguage = useSettingsStore((s) => s.setCurrentLanguage);
  const { options } = useCurrentLanguage(LETTER_LANGUAGES);

  /* This is the only route that names a language, so arriving here is a real
     choice — adopt it rather than letting the rest of the app disagree. */
  useEffect(() => {
    setCurrentLanguage(lang);
  }, [lang, setCurrentLanguage]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');

  /* Chart is a reference wall — useful once you know the script, hostile as a
     first impression. The on-ramp recommends "Learn the letters", so a learner
     with no progress in this script opens the guided flow instead. An explicit
     ?mode= always wins, and once the learner picks a tab we stop overriding. */
  const [mode, setMode] = useState<PracticeMode>(
    isPracticeMode(requestedMode) ? requestedMode : 'chart',
  );
  const modeIsPinned = useRef(isPracticeMode(requestedMode));
  const [progress, setProgress] = useState<Map<string, CharacterProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const alphabets = getAlphabetsForLanguage(lang);
  const requestedAlphabet = searchParams.get('alphabet');
  const requestedAlphabetIndex = requestedAlphabet
    ? alphabets.findIndex((alphabet) => alphabet.name === requestedAlphabet)
    : -1;
  const [selectedAlphabet, setSelectedAlphabet] = useState(
    requestedAlphabetIndex >= 0 ? requestedAlphabetIndex : 0,
  );

  /* Alphabet counts differ per language (Arabic has four, Russian two), so a
     stale index would index past the end and blank the page. */
  useEffect(() => {
    setSelectedAlphabet(requestedAlphabetIndex >= 0 ? requestedAlphabetIndex : 0);
  }, [lang, requestedAlphabetIndex]);

  const chooseMode = (next: PracticeMode) => {
    modeIsPinned.current = true;
    setMode(next);
  };

  const refreshProgress = () => {
    getCharacterProgress(lang).then((items) => {
      const map = new Map<string, CharacterProgress>();
      for (const item of items) map.set(item.id, item);
      setProgress(map);
      if (!modeIsPinned.current) {
        modeIsPinned.current = true;
        if (items.length === 0) setMode('learn');
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mode]);

  if (alphabets.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">No letter systems available for this language.</p>
        <LanguagePicker
          options={options}
          value={undefined}
          onChange={(next) => navigate(lettersRoute(next))}
          label="Language to practise"
          className="mt-4 justify-center"
        />
        <button onClick={() => navigate('/learn')} className="mt-4 text-indigo-600 dark:text-indigo-400 press-feedback">
          ← Back to Learn
        </button>
      </div>
    );
  }

  const currentAlphabet = alphabets[selectedAlphabet];

  return (
    <div>
      <button
        onClick={() => navigate('/learn')}
        className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback"
      >
        ← Back to Learn
      </button>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Letter Practice</h2>

      {/* Which language's letters. Renders nothing for a single-language learner. */}
      <LanguagePicker
        options={options}
        value={lang}
        onChange={(next) => navigate(lettersRoute(next))}
        label="Language to practise"
        className="mb-3"
      />

      {/* Alphabet selector */}
      {alphabets.length > 1 && (
        <div className="flex gap-2 mb-3">
          {alphabets.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setSelectedAlphabet(i)}
              className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm font-medium transition-colors press-feedback ${
                selectedAlphabet === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        {(
          [
            ['learn', '📖 Learn'],
            ['chart', '📊 Chart'],
            ['draw', '✏️ Draw'],
            ['quiz', '🧠 Quiz'],
          ] as [PracticeMode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => chooseMode(m)}
            className={`flex-1 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors press-feedback ${
              mode === m
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonList count={2} />
        </div>
      ) : (
        <>
          {mode === 'learn' && (
            <GuidedLearning
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
          {mode === 'chart' && (
            <CharacterChart
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              progress={progress}
            />
          )}
          {mode === 'draw' && (
            <DrawingCanvas
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
          {mode === 'quiz' && (
            <RecognitionQuiz
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
            />
          )}
        </>
      )}
    </div>
  );
}
