import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { db, type Text as TextRecord } from '../db/schema';
import { saveWordsToVocabulary } from '../db/words';
import { getTextCount } from '../db/texts';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import TextLibrary from '../components/reader/TextLibrary';
import { loadReaderSegments, type ReaderSegment } from '../lib/reader-segments';
import FuriganaText from '../components/reader/FuriganaText';
import { splitSentences, findSentenceAt, type SentenceSpan } from '../lib/sentences';
import { isRTL } from '../lib/rtl';
import { SkeletonCard, SkeletonList } from '../components/common/Skeleton';
import ComprehensionIndicator from '../components/reader/ComprehensionIndicator';
import { useKnowledge } from '../hooks/useKnowledge';
import { buildWordStatusMap, type WordStatusMap } from '../lib/word-status';
import { parseWithIchiMoe, getIchiMoeUrl, type IchiMoeWord } from '../lib/ichimoe';
import WordDefinitions from '../components/reader/WordDefinitions';
import { parseSrt, srtToText } from '../lib/srt-parser';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { selectGuidedItems } from '../lib/guided-practice';
import type { CuratedText } from '../components/reader/TextLibrary';
import { loadReaderStory } from '../lib/reader-coverage';
import type { WordLookupDraft } from '../lib/word-lookup';

type Tab = 'import' | 'library';

export default function ReaderPage() {
  const [tab, setTab] = useState<Tab>('import');
  const [tabReady, setTabReady] = useState(false);
  const [readingError, setReadingError] = useState('');
  const openRequest = useRef(0);
  const textLanguage = useRef<string | null>(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const { language: currentLanguage, setLanguage, options: activeLanguages } = useCurrentLanguage();
  const language = currentLanguage ?? 'ja';
  const knowledge = useKnowledge(language);
  const knowledgeSnapshot = knowledge.snapshot;
  const highlightRequest = useRef(0);
  const invalidateHighlight = useCallback(() => { highlightRequest.current++; }, []);
  const [savedTextId, setSavedTextId] = useState<number | null>(null);
  const [segments, setSegments] = useState<ReaderSegment[]>([]);
  const [sentences, setSentences] = useState<SentenceSpan[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedReading, setSelectedReading] = useState('');
  const [selectedSentence, setSelectedSentence] = useState('');
  const [selectedLemma, setSelectedLemma] = useState<string | undefined>();
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const lookupDrafts = useRef(new Map<string, WordLookupDraft>());
  const readerInstructionsId = useId();
  const selectedLookupKey = `${language}/${selectedSegmentIndex ?? ''}`;
  const { isRunning, start } = useTimerStore();
  const { showStressMarks } = useSettingsStore();
  const [highlightKnown, setHighlightKnown] = useState(false);
  const [knownWordSet, setKnownWordSet] = useState<Set<string>>(new Set());
  const [wordStatusMap, setWordStatusMap] = useState<WordStatusMap | null>(null);
  const [ichiMoeWords, setIchiMoeWords] = useState<IchiMoeWord[]>([]);
  const [ichiMoeCorsBlocked, setIchiMoeCorsBlocked] = useState(false);
  const [ichiMoeLoading, setIchiMoeLoading] = useState(false);
  const [ichiMoeOpen, setIchiMoeOpen] = useState(false);
  const [translation, setTranslation] = useState('');
  const [showBilingual, setShowBilingual] = useState(false);
  const [guidedReadingFinished, setGuidedReadingFinished] = useState(false);
  const [guidedReadySeed, setGuidedReadySeed] = useState('');
  const [guidedLoadError, setGuidedLoadError] = useState<{
    seed: string;
    message: string;
  } | null>(null);
  const guided = useGuidedPractice('reading', language);

  // Reading session tracking
  const readingStartRef = useRef<number | null>(null);
  const readingMetaRef = useRef<{ language: string; wordCount: number; title: string } | null>(null);

  const logReadingSession = useCallback(async () => {
    const startTime = readingStartRef.current;
    const meta = readingMetaRef.current;
    if (!startTime || !meta) return;

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    readingStartRef.current = null;
    readingMetaRef.current = null;

    if (durationSeconds < 10) return;

    await db.studySessions.add({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds,
      activity: 'reading',
      xpEarned: 0,
      language: meta.language,
      wordCount: meta.wordCount,
      title: meta.title,
    });
  }, []);

  // Log reading session on unmount (navigating away from Reader page)
  useEffect(() => {
    return () => { logReadingSession(); };
  }, [logReadingSession]);

  // Load known words and word status map when highlighting is toggled on or text/language changes
  const refreshKnownWords = useCallback(async () => {
    const request = ++highlightRequest.current;
    if (!highlightKnown) return;
    setKnownWordSet(new Set(knowledgeSnapshot?.entries.filter((entry) => entry.familiar).map((entry) => entry.key) ?? []));
    const statusMap = await buildWordStatusMap(language);
    if (request !== highlightRequest.current) return;
    setWordStatusMap(statusMap);
  }, [highlightKnown, language, knowledgeSnapshot]);

  useEffect(() => {
    void refreshKnownWords().catch(() => { setWordStatusMap(null); });
    return invalidateHighlight;
  }, [refreshKnownWords, invalidateHighlight]);

  // Default to the Library: it holds both saved texts and the curated graded
  // readings, so a first-time reader sees real content instead of a blank
  // paste box.
  useEffect(() => {
    setTab('library');
    setTabReady(true);
  }, []);

  const resetReadingState = useCallback(() => {
    openRequest.current++;
    setIsTokenizing(false);
    setReadingError('');
    logReadingSession();
    setSegments([]);
    setSentences([]);
    setText('');
    setTitle('');
    setSavedTextId(null);
    setSelectedWord(null);
    setSelectedReading('');
    setSelectedSentence('');
    setSelectedLemma(undefined);
    setSelectedSegmentIndex(null);
    lookupDrafts.current.clear();
    setWordStatusMap(null);
    setIchiMoeWords([]);
    setIchiMoeCorsBlocked(false);
    setIchiMoeLoading(false);
    setIchiMoeOpen(false);
    setTranslation('');
    setShowBilingual(false);
    setGuidedReadingFinished(false);
  }, [logReadingSession]);

  useEffect(() => {
    if (textLanguage.current && textLanguage.current !== language) resetReadingState();
    textLanguage.current = language;
  }, [language, resetReadingState]);
  useEffect(() => () => { openRequest.current++; }, []);

  function switchTab(newTab: Tab) {
    if (newTab === tab) return;
    resetReadingState();
    setTab(newTab);
  }

  const prepareReadingText = useCallback(async (content: string, lang: string, request: number) => {
    setIsTokenizing(lang === 'ja');
    const result = await loadReaderSegments(content, lang);
    if (request !== openRequest.current) return false;
    setSegments(result);
    setIsTokenizing(false);
    return true;
  }, []);

  async function openTextFromLibrary(record: TextRecord) {
    resetReadingState();
    if (!record.content.trim()) {
      setReadingError('This saved text is empty. Choose another text or import something to read.');
      return;
    }
    const request = openRequest.current;
    textLanguage.current = record.language;
    setText(record.content);
    setTitle(record.title);
    setLanguage(record.language);
    setSavedTextId(record.id ?? null);
    setSentences(splitSentences(record.content));

    // Start tracking reading session
    const wordCount = record.content.split(/\s+/).filter(Boolean).length;
    readingStartRef.current = Date.now();
    readingMetaRef.current = { language: record.language, wordCount, title: record.title };

    await prepareReadingText(record.content, record.language, request);
  }

  const openCuratedText = useCallback(async (
    id: string,
    lang: string,
    curatedTitle: string,
  ) => {
    resetReadingState();
    const request = openRequest.current;
    textLanguage.current = lang;
    setIsTokenizing(true);
    setLanguage(lang);
    setTitle(curatedTitle);

    try {
      const content = await loadReaderStory(id, lang);
      if (request !== openRequest.current) return false;
      if (!content.trim()) {
        setReadingError('This story is empty. Please choose another text to read.');
        return false;
      }
      setText(content);
      setSentences(splitSentences(content));

      // Start tracking reading session
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      readingStartRef.current = Date.now();
      readingMetaRef.current = { language: lang, wordCount, title: curatedTitle };

      return await prepareReadingText(content, lang, request);
    } catch {
      if (request !== openRequest.current) return false;
      resetReadingState();
      setReadingError('This story could not be opened. Please choose it again when it is available.');
      return false;
    } finally {
      if (request === openRequest.current) setIsTokenizing(false);
    }
  }, [prepareReadingText, resetReadingState, setLanguage]);

  useEffect(() => {
    if (!guided.descriptor) return;
    let cancelled = false;
    const seed = guided.descriptor.seed;
    const openGuidedReading = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}content/reading/${language}/index.json`,
        );
        if (!response.ok) throw new Error('Failed to load curated reading index');
        const data = (await response.json()) as { texts?: CuratedText[] };
        const selected = selectGuidedItems(
          data.texts ?? [],
          guided.descriptor!,
          (candidate) => candidate.id,
        )[0];
        if (!selected) throw new Error('No curated guided reading is available');
        if (cancelled) return;
        const opened = await openCuratedText(
          selected.id,
          language,
          selected.title,
        );
        if (!opened) throw new Error('Failed to load guided reading');
        if (!cancelled) setGuidedReadySeed(seed);
      } catch {
        if (!cancelled) {
          setGuidedLoadError({
            seed,
            message:
              'This guided reading could not be loaded. Return to your learning path and open the step again.',
          });
        }
      }
    };
    void openGuidedReading();
    return () => {
      cancelled = true;
    };
  }, [guided.descriptor, language, openCuratedText]);

  const finishGuidedReading = useCallback(async () => {
    await logReadingSession();
    await guided.complete({ itemsCompleted: 1 });
    setGuidedReadingFinished(true);
  }, [guided, logReadingSession]);

  const restartGuidedReading = useCallback(() => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    readingStartRef.current = Date.now();
    readingMetaRef.current = { language, wordCount, title: title || 'Reading' };
    setGuidedReadingFinished(false);
  }, [language, text, title]);

  const handleImport = async () => {
    if (!text.trim()) return;
    const request = ++openRequest.current;
    textLanguage.current = language;

    const id = await db.texts.add({
      language,
      title: title || 'Untitled',
      content: text,
      createdAt: new Date().toISOString(),
    }) as number;
    if (request !== openRequest.current) return;
    setSavedTextId(id);

    setSentences(splitSentences(text));

    // Start tracking reading session
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    readingStartRef.current = Date.now();
    readingMetaRef.current = { language, wordCount, title: title || 'Untitled' };

    await prepareReadingText(text, language, request);
  };

  const handleAddWord = async (word: string, reading: string, meaning: string, contextSentence: string) => {
    if (!word || !meaning) return;

    if (!isRunning) start('reading');

    const result = await saveWordsToVocabulary([{
      language,
      word,
      reading,
      meaning,
      contextSentence,
      sourceTextId: savedTextId,
      tags: [],
    }]);

    // Refresh known word set so highlight updates after mining
    refreshKnownWords();
    return result;
  };

  const handleParseWithIchiMoe = async () => {
    if (!text.trim() || language !== 'ja') return;
    setIchiMoeLoading(true);
    setIchiMoeCorsBlocked(false);
    setIchiMoeOpen(true);
    try {
      const result = await parseWithIchiMoe(text);
      setIchiMoeWords(result.words);
      setIchiMoeCorsBlocked(result.corsBlocked);
    } finally {
      setIchiMoeLoading(false);
    }
  };

  const hasTokens = segments.length > 0;

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (
    guided.descriptor &&
    guidedLoadError?.seed === guided.descriptor.seed
  ) {
    return <GuidedPracticeError message={guidedLoadError.message} />;
  }
  if (
    guided.descriptor &&
    guidedReadySeed !== guided.descriptor.seed
  ) {
    return (
      <div className="space-y-4 py-8">
        <GuidedPracticeNotice guided={guided} />
        <p
          role="status"
          className="text-center text-sm text-slate-500 dark:text-slate-400"
        >
          Loading your guided reading…
        </p>
      </div>
    );
  }

  if (!tabReady) return null;

  // Tab toggle (shown only when not in reading view and not tokenizing)
  const tabToggle = !hasTokens && !isTokenizing ? (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-4">
      <button
        onClick={() => switchTab('import')}
        className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
          tab === 'import'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
        }`}
      >
        Import
      </button>
      <button
        onClick={() => switchTab('library')}
        className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-lg transition-colors press-feedback ${
          tab === 'library'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
        }`}
      >
        Library
      </button>
    </div>
  ) : null;

  return isTokenizing ? (
    <div className="space-y-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Parsing Japanese text…</p>
      </div>
      <SkeletonCard />
      <SkeletonList count={2} />
    </div>
  ) : !hasTokens ? (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Immersion Reader
      </h2>
      <GuidedPracticeNotice guided={guided} />
      {tabToggle}
      {readingError && <p role="status" className="mb-3 text-sm text-slate-500 dark:text-slate-400">{readingError}</p>}
      {tab === 'library' ? (
        <TextLibrary onSelectText={openTextFromLibrary} onSelectCurated={openCuratedText} />
      ) : (
      <div className="space-y-3">
        <label htmlFor="reader-title" className="sr-only">Title</label>
        <input
          id="reader-title"
          name="title"
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 bg-white dark:bg-slate-800 dark:text-slate-100"
        />
        <LanguagePicker
          options={activeLanguages}
          value={language}
          onChange={setLanguage}
          label="Language of this text"
        />
        <label htmlFor="reader-text" className="sr-only">Text to read</label>
        <textarea
          id="reader-text"
          name="text"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 resize-none bg-white dark:bg-slate-800 dark:text-slate-100"
        />
        <label htmlFor="reader-translation" className="sr-only">Translation</label>
        <textarea
          id="reader-translation"
          name="translation"
          placeholder="Translation (optional — for bilingual reading)"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 resize-none bg-white dark:bg-slate-800 dark:text-slate-100 text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 press-feedback"
          >
            Start Reading
          </button>
          <label className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer press-feedback min-h-[44px]">
            <span>📄</span>
            <span className="text-sm">.srt</span>
            <input
              type="file"
              accept=".srt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const content = ev.target?.result;
                  if (typeof content !== 'string') return;
                  const segments = parseSrt(content);
                  if (segments.length === 0) return;
                  const combined = srtToText(segments);
                  setText(combined);
                  setTitle(file.name.replace(/\.srt$/i, ''));
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
      )}
    </div>
  ) : (
    <div>
      <GuidedPracticeNotice guided={guided} />
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          {title || 'Reading'}
        </h2>
        <button
          onClick={() => {
            resetReadingState();
            getTextCount().then((count) => setTab(count > 0 ? 'library' : 'import'));
          }}
          className="inline-flex min-h-[44px] items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
        >
          ← New text
        </button>
      </div>

      <ComprehensionIndicator
        text={text}
        language={language}
        highlightEnabled={highlightKnown}
        onToggleHighlight={() => setHighlightKnown((v) => !v)}
        wordStatusMap={wordStatusMap ?? undefined}
        knowledge={knowledge}
      />

      {translation.trim() && (
        <button
          onClick={() => setShowBilingual((v) => !v)}
          className={`mb-3 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 min-h-[44px] rounded-full transition-colors press-feedback min-h-[44px] ${
            showBilingual
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <span>🔀</span> Bilingual
        </button>
      )}

      <p id={readerInstructionsId} className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        Select a word for its meaning. Keyboard: use Left/Right to move between words, then Enter or Space to open.
        {isRTL(language) ? ' Left moves to the next word in reading order.' : ''}
      </p>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 leading-relaxed whitespace-pre-wrap text-[1.1rem] dark:text-slate-100" style={{ fontSize: 'var(--app-font-size)' }} dir={isRTL(language) ? 'rtl' : undefined}>
        <FuriganaText
          segments={segments}
          selectedWord={selectedWord}
          onWordClick={(surface, reading, segmentIndex) => {
            setSelectedWord(surface);
            setSelectedReading(reading);
            setSelectedLemma(segments[segmentIndex]?.token?.lemma);
            setSelectedSegmentIndex(segmentIndex);
            const offset = segments[segmentIndex]?.start ?? 0;
            setSelectedSentence(findSentenceAt(sentences, offset));
          }}
          highlightKnown={highlightKnown}
          knownWords={knownWordSet}
          wordStatusMap={wordStatusMap ?? undefined}
          statusHighlight={highlightKnown && !!wordStatusMap}
          language={language}
          showStressMarks={showStressMarks}
          instructionsId={readerInstructionsId}
        />
      </div>

      {/* Bilingual translation panel */}
      {showBilingual && translation.trim() && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mt-3 leading-relaxed text-sm text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            <span>🌐</span> Translation
          </div>
          {translation.split('\n').map((line, i) => (
            <p key={i} className={line.trim() ? 'mb-1' : 'mb-3'}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      )}

      {/* ichi.moe parse section — Japanese only */}
      {language === 'ja' && (
        <div className="mt-3">
          {!ichiMoeOpen ? (
            <button
              onClick={handleParseWithIchiMoe}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 py-2.5 rounded-xl font-medium hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors press-feedback min-h-[44px]"
            >
              <span>📖</span>
              <span>Parse with definitions</span>
            </button>
          ) : ichiMoeLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Fetching definitions from ichi.moe…
              </span>
            </div>
          ) : ichiMoeCorsBlocked ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                Direct access to ichi.moe is blocked by the browser (CORS). You can parse this text manually:
              </p>
              <a
                href={getIchiMoeUrl(text)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px]"
              >
                Open in ichi.moe ↗
              </a>
              <button
                onClick={() => setIchiMoeOpen(false)}
                className="block mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Powered by ichi.moe
                </span>
                <button
                  onClick={() => setIchiMoeOpen(false)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 press-feedback"
                >
                  Hide
                </button>
              </div>
              <WordDefinitions
                words={ichiMoeWords}
                language={language}
                sourceTextId={savedTextId}
                onWordAdded={refreshKnownWords}
              />
            </div>
          )}
        </div>
      )}

      {guided.isGuided && (
        <div className="mt-4">
          {guidedReadingFinished ? (
            <GuidedCompletionActions
              guided={guided}
              onPracticeAgain={restartGuidedReading}
            />
          ) : (
            <button
              type="button"
              onClick={() => void finishGuidedReading()}
              className="min-h-[44px] w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              I finished reading
            </button>
          )}
        </div>
      )}

      {selectedWord && (
        <WordLookupSheet
          key={selectedLookupKey}
          word={selectedWord}
          language={language}
          initialReading={selectedReading}
          lemma={selectedLemma}
          contextSentence={selectedSentence}
          initialDraft={lookupDrafts.current.get(selectedLookupKey)}
          onDraftChange={(draft) => { lookupDrafts.current.set(selectedLookupKey, draft); }}
          onAdd={handleAddWord}
          onClose={() => setSelectedWord(null)}
          wordStatusMap={wordStatusMap ?? undefined}
        />
      )}
    </div>
  );
}
