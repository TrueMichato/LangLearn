import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { getAlphabetsForLanguage, ALPHABET_DATA, type Character } from '../data/alphabets';
import { getCharacterProgress } from '../db/characters';
import { getLearningPathManifest } from '../data/learning-paths';
import { loadLearningPath } from '../lib/learning-path';
import { GUIDED_GROUP_QUERY_PARAM, lettersRoute } from '../lib/routes';
import { getLanguageLabel } from '../lib/languages';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
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

function GuidedGroupEntry(props: {
  characters: Character[];
  alphabetName: string;
  language: string;
  requestedGroup: string;
  onProgress: () => void;
  onShowColumns: () => void;
}) {
  const { language, alphabetName } = props;
  const prerequisites = getLearningPathManifest(language)?.letterPrerequisites ?? [];
  // The first script and standalone reference alphabets have no path gate.
  const needsPath = prerequisites.indexOf(alphabetName) > 0;
  const [retry, setRetry] = useState(0);
  const [access, setAccess] = useState<{ key: string; locked: boolean; error: string } | null>(null);
  const key = `${language}/${alphabetName}/${retry}`;

  useEffect(() => {
    if (!needsPath) return;
    let cancelled = false;
    loadLearningPath(language).then((path) => {
      if (cancelled) return;
      const node = path?.units.flatMap((unit) => unit.nodes)
        .find((item) => item.id === `letters:${alphabetName}`);
      setAccess({
        key,
        locked: node?.state === 'locked',
        error: node ? '' : 'This alphabet could not be found on your learning path.',
      });
    }).catch(() => {
      if (!cancelled) setAccess({ key, locked: false, error: 'Your learning path could not be loaded. Please retry, or browse the columns.' });
    });
    return () => { cancelled = true; };
  }, [needsPath, language, alphabetName, key]);

  if (needsPath && access?.key !== key) return <SkeletonCard />;
  if (needsPath && (access?.locked || access?.error)) {
    return (
      <div role="alert" className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>{access.error || 'This alphabet is still locked on your path. Finish the earlier script steps first.'}</p>
        {access.error && (
          <button onClick={() => setRetry((value) => value + 1)} className="min-h-[44px] rounded-xl bg-indigo-600 px-4 font-medium text-white hover:bg-indigo-700">
            Try again
          </button>
        )}
        <button onClick={props.onShowColumns} className="block min-h-[44px] text-indigo-600 dark:text-indigo-400 hover:underline">
          Browse columns instead
        </button>
      </div>
    );
  }
  return <GuidedLearning {...props} />;
}

export default function LetterPractice() {
  const { lang = '' } = useParams();
  const setCurrentLanguage = useSettingsStore((s) => s.setCurrentLanguage);
  const { options, activeLanguages } = useCurrentLanguage(LETTER_LANGUAGES);

  /* This is the only route that names a language, so arriving here is a real
     choice — adopt it rather than letting the rest of the app disagree. */
  useEffect(() => {
    if (activeLanguages.includes(lang)) setCurrentLanguage(lang);
  }, [lang, setCurrentLanguage, activeLanguages]);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const requestedGroup = searchParams.get(GUIDED_GROUP_QUERY_PARAM) ?? undefined;

  /* Chart is a reference wall — useful once you know the script, hostile as a
     first impression. The on-ramp recommends "Learn the letters", so a learner
     with no progress in this script opens the guided flow instead. An explicit
     ?mode= always wins, and once the learner picks a tab we stop overriding. */
  const [defaultMode, setMode] = useState<PracticeMode>('chart');
  const mode = isPracticeMode(requestedMode) ? requestedMode : defaultMode;
  const modeIsPinned = useRef(isPracticeMode(requestedMode));
  const [progress, setProgress] = useState<Map<string, CharacterProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState('');
  const progressRequest = useRef(0);
  const alphabets = getAlphabetsForLanguage(lang);
  const requestedAlphabet = searchParams.get('alphabet');
  const requestedAlphabetIndex = requestedAlphabet
    ? alphabets.findIndex((alphabet) => alphabet.name === requestedAlphabet)
    : -1;
  const selectedAlphabet = requestedAlphabetIndex >= 0 ? requestedAlphabetIndex : 0;

  const showColumns = () => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete(GUIDED_GROUP_QUERY_PARAM);
      return next;
    });
  };

  const chooseMode = (next: PracticeMode) => {
    modeIsPinned.current = true;
    setMode(next);
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      params.set('mode', next);
      params.delete(GUIDED_GROUP_QUERY_PARAM);
      return params;
    });
  };

  const refreshProgress = () => {
    const request = ++progressRequest.current;
    setProgressError('');
    getCharacterProgress(lang).then((items) => {
      if (request !== progressRequest.current) return;
      const map = new Map<string, CharacterProgress>();
      for (const item of items) map.set(item.id, item);
      setProgress(map);
      if (!modeIsPinned.current && !isPracticeMode(requestedMode)) {
        modeIsPinned.current = true;
        if (items.length === 0) setMode('learn');
      }
      setLoading(false);
    }).catch(() => {
      if (request !== progressRequest.current) return;
      setProgressError('Your letter progress could not be loaded. Please try again.');
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!activeLanguages.includes(lang) || !ALPHABET_DATA[lang]) return;
    setLoading(true);
    refreshProgress();
    return () => { progressRequest.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, mode, activeLanguages]);

  if (alphabets.length === 0 || !activeLanguages.includes(lang)) {
    return (
      <div className="py-8 text-center">
        {alphabets.length === 0 ? <LanguageUnavailable
          requested={lang || undefined}
          options={options}
          onChange={(next) => navigate(lettersRoute(next))}
          feature="Letter practice"
        /> : (
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <p>{getLanguageLabel(lang)} isn't one of your active languages. Add it in Settings, or choose an active language.</p>
            <LanguagePicker options={options} value={undefined} onChange={(next) => navigate(lettersRoute(next))} label="Language to practise" className="justify-center" />
            <button onClick={() => navigate('/settings')} className="min-h-[44px] text-indigo-600 dark:text-indigo-400 hover:underline">
              Language settings
            </button>
          </div>
        )}
        <button onClick={() => navigate('/learn')} className="mt-4 min-h-[44px] text-indigo-600 dark:text-indigo-400 press-feedback">
          ← Back to Learn
        </button>
      </div>
    );
  }

  const currentAlphabet = alphabets[selectedAlphabet] ?? alphabets[0];
  const invalidDirectAlphabet = mode === 'learn' && requestedGroup !== undefined && requestedAlphabet !== null && requestedAlphabetIndex < 0;

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
              onClick={() => {
                setSearchParams((previous) => {
                  const params = new URLSearchParams(previous);
                  params.set('alphabet', a.name);
                  params.delete(GUIDED_GROUP_QUERY_PARAM);
                  return params;
                });
              }}
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

      {progressError ? (
        <div role="alert" className="text-sm text-slate-700 dark:text-slate-200">
          <p>{progressError}</p>
          <button onClick={refreshProgress} className="mt-2 min-h-[44px] text-indigo-600 dark:text-indigo-400 hover:underline">
            Try again
          </button>
        </div>
      ) : invalidDirectAlphabet ? (
        <div role="alert" className="text-sm text-slate-700 dark:text-slate-200">
          <p>That alphabet could not be found. Choose an alphabet above, or browse its columns.</p>
          <button onClick={showColumns} className="mt-2 min-h-[44px] text-indigo-600 dark:text-indigo-400 hover:underline">
            Browse columns
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonList count={2} />
        </div>
      ) : (
        <>
          {mode === 'learn' && requestedGroup !== undefined ? (
            <GuidedGroupEntry
              key={`${lang}/${currentAlphabet.name}/${requestedGroup}`}
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              requestedGroup={requestedGroup}
              onProgress={refreshProgress}
              onShowColumns={showColumns}
            />
          ) : mode === 'learn' && (
            <GuidedLearning
              key={`${lang}/${currentAlphabet.name}/columns`}
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
              key={`${lang}/${currentAlphabet.name}/draw`}
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
              progress={progress}
            />
          )}
          {mode === 'quiz' && (
            <RecognitionQuiz
              key={`${lang}/${currentAlphabet.name}/quiz`}
              characters={currentAlphabet.characters}
              alphabetName={currentAlphabet.name}
              language={lang}
              onProgress={refreshProgress}
              progress={progress}
            />
          )}
        </>
      )}
    </div>
  );
}
