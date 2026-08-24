import { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { useXPStore } from '../stores/xpStore';
import { isRTL } from '../lib/rtl';
import { allLyrics, getSongById } from '../data/lyrics';
import { addWord, wordExists } from '../db/words';
import { XP_LYRICS_BASE, XP_PER_LYRICS_VOCAB } from '../lib/xp';
import type { Song, SongVocab } from '../data/lyrics';
import { useGuidedPractice, type GuidedPracticeState } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { selectGuidedItems } from '../lib/guided-practice';
import { ROUTES } from '../lib/routes';

const LYRIC_LANGUAGES = [...new Set(allLyrics.map((s) => s.language))];

type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  medium: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  hard: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
};

function DifficultyBadge({ difficulty }: { difficulty: Song['difficulty'] }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}>
      {difficulty}
    </span>
  );
}

/* ─── Song Browser ─── */

function SongBrowser({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { language, setLanguage, options: availableLanguages, requested, isSupported } =
    useCurrentLanguage(LYRIC_LANGUAGES);
  const selectedLang = language ?? '';
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [search, setSearch] = useState('');

  const filteredSongs = useMemo(() => {
    let songs = allLyrics.filter((s) => s.language === selectedLang);
    if (difficulty !== 'all') songs = songs.filter((s) => s.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase();
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.titleRomanized.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.context.toLowerCase().includes(q)
      );
    }
    return songs;
  }, [selectedLang, difficulty, search]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">🎵 Music</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Learn vocabulary through song lyrics
      </p>

      <LanguagePicker
        options={availableLanguages}
        value={selectedLang}
        onChange={setLanguage}
        label="Song language"
        className="mb-3"
      />

      {!isSupported && (
        <LanguageUnavailable
          requested={requested}
          options={availableLanguages}
          onChange={setLanguage}
          feature="Song lyrics"
          plural
        />
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search songs…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 mb-3 min-h-[44px]"
      />

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium min-h-[36px] transition-colors ${
              difficulty === d
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Song cards */}
      <div className="space-y-3">
        {filteredSongs.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No songs found for this filter.
          </p>
        )}
        {filteredSongs.map((song) => (
          <button
            key={song.id}
            onClick={() => onSelect(song.id)}
            className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl shadow hover:shadow-md transition-all p-4 border border-slate-100 dark:border-slate-700 min-h-[44px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎶</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {song.title}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {song.titleRomanized} · {song.artist}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {song.context} · {song.lines.length} lines
                </p>
              </div>
              <DifficultyBadge difficulty={song.difficulty} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Lyrics Viewer ─── */

function LyricsViewer({
  song,
  onBack,
  guided,
}: {
  song: Song;
  onBack: () => void;
  guided: GuidedPracticeState;
}) {
  const [showReading, setShowReading] = useState(true);
  const [showRomaji, setShowRomaji] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [vocabAddedCount, setVocabAddedCount] = useState(0);
  const completionStarted = useRef(false);

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${song.title} ${song.artist}`
  )}`;

  const handleAddVocab = useCallback(
    async (v: SongVocab) => {
      if (addedWords.has(v.word)) return;
      setAddingWord(v.word);
      try {
        const exists = await wordExists(v.word, song.language);
        if (!exists) {
          await addWord({
            language: song.language,
            word: v.word,
            reading: v.reading,
            meaning: v.meaning,
            contextSentence: '',
            sourceTextId: null,
            tags: ['lyrics', song.id],
          });
        }
        setAddedWords((prev) => new Set(prev).add(v.word));
        setVocabAddedCount((c) => c + 1);
      } finally {
        setAddingWord(null);
      }
    },
    [addedWords, song.language, song.id]
  );

  const handleComplete = useCallback(async () => {
    if (completed || completionStarted.current) return;
    completionStarted.current = true;
    const xp = XP_LYRICS_BASE + vocabAddedCount * XP_PER_LYRICS_VOCAB;
    useXPStore.getState().addXP(xp);
    setCompleted(true);
    await guided.complete({
      itemsCompleted: 1,
      score: song.vocab.length > 0
        ? Math.round((vocabAddedCount / song.vocab.length) * 100)
        : undefined,
    });
  }, [completed, guided, song.vocab.length, vocabAddedCount]);

  return (
    <div>
      <GuidedPracticeNotice guided={guided} />
      {/* Back button */}
      {guided.isGuided ? (
        <Link
          to={ROUTES.learn}
          state={{ focusCurrentPathStep: true }}
          className="mb-4 flex min-h-[44px] items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          ← Return to learning path
        </Link>
      ) : (
        <button
          onClick={onBack}
          className="mb-4 flex min-h-[44px] items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          ← Back to songs
        </button>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {song.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {song.titleRomanized} · {song.artist}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{song.context}</p>
          </div>
          <DifficultyBadge difficulty={song.difficulty} />
        </div>

        {/* YouTube link */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors min-h-[44px]"
        >
          ▶ Listen on YouTube
        </a>
      </div>

      {/* Toggle controls */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          onClick={() => setShowReading((v) => !v)}
          className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            showReading
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {showReading ? '✓ Reading' : '○ Reading'}
        </button>
        {song.lines.some((l) => l.romaji) && (
          <button
            onClick={() => setShowRomaji((v) => !v)}
            className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
              showRomaji
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {showRomaji ? '✓ Romaji' : '○ Romaji'}
          </button>
        )}
        <button
          onClick={() => setShowTranslation((v) => !v)}
          className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
            showTranslation
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          {showTranslation ? '✓ Translation' : '○ Translation'}
        </button>
      </div>

      {/* Lyrics */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4 space-y-1">
        {song.lines.map((line, i) => (
          <button
            key={i}
            onClick={() => setHighlightedLine(highlightedLine === i ? null : i)}
            className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
              highlightedLine === i
                ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed" dir={isRTL(song.language) ? 'rtl' : undefined}>
              {line.original}
            </p>
            {showReading && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {line.reading}
              </p>
            )}
            {showRomaji && line.romaji && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                {line.romaji}
              </p>
            )}
            {showTranslation && (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-0.5">
                {line.translation}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Key Vocabulary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
          📝 Key Vocabulary
        </h3>
        <div className="space-y-2">
          {song.vocab.map((v) => {
            const isAdded = addedWords.has(v.word);
            const isAdding = addingWord === v.word;
            return (
              <div
                key={v.word}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-800 dark:text-slate-100" dir={isRTL(song.language) ? 'rtl' : undefined}>{v.word}</span>
                  <span className="text-slate-500 dark:text-slate-400 mx-1.5">·</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{v.reading}</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{v.meaning}</p>
                </div>
                <button
                  onClick={() => handleAddVocab(v)}
                  disabled={isAdded || isAdding}
                  className={`px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium whitespace-nowrap min-h-[36px] transition-colors ${
                    isAdded
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800/50'
                  }`}
                >
                  {isAdded ? '✓ Added' : isAdding ? '…' : 'Add +'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete button */}
      <button
        onClick={() => void handleComplete()}
        disabled={completed}
        className={`w-full py-3 rounded-xl text-sm font-semibold min-h-[44px] transition-colors ${
          completed
            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {completed
          ? `✓ Complete! +${XP_LYRICS_BASE + vocabAddedCount * XP_PER_LYRICS_VOCAB} XP`
          : `Study Complete (+${XP_LYRICS_BASE + vocabAddedCount * XP_PER_LYRICS_VOCAB} XP)`}
      </button>
      {completed && guided.isGuided && (
        <div className="mt-4">
          <GuidedCompletionActions
            guided={guided}
            onPracticeAgain={() => {
              completionStarted.current = false;
              setCompleted(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function LyricsPage() {
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const { language: currentLanguage } = useCurrentLanguage(LYRIC_LANGUAGES);
  const language = currentLanguage ?? '';
  const guided = useGuidedPractice('lyrics', language);
  const guidedSong = useMemo(
    () => guided.descriptor
      ? selectGuidedItems(
      allLyrics.filter((song) => song.language === language),
      guided.descriptor,
      (song) => song.id,
    )[0] ?? null
      : null,
    [guided.descriptor, language],
  );
  const selectedSong = selectedSongId
    ? getSongById(selectedSongId)
    : guidedSong;

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }

  if (selectedSong) {
    return (
      <LyricsViewer
        key={selectedSong.id}
        song={selectedSong}
        onBack={() => setSelectedSongId(null)}
        guided={guided}
      />
    );
  }

  return <SongBrowser onSelect={setSelectedSongId} />;
}
