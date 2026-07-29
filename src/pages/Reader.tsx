import { useState, useEffect, useCallback, useRef } from 'react';
import { db, type Text as TextRecord } from '../db/schema';
import { addWord } from '../db/words';
import { getTextCount } from '../db/texts';
import { useTimerStore } from '../stores/timerStore';
import { useSettingsStore } from '../stores/settingsStore';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import TextLibrary from '../components/reader/TextLibrary';
import { tokenizeJapanese } from '../lib/tokenizer';
import type { Token } from '../lib/tokenizer';
import FuriganaText from '../components/reader/FuriganaText';
import { applyStress } from '../lib/russian-stress';
import { splitSentences, findSentenceAt, type SentenceSpan } from '../lib/sentences';
import { getLanguageLabel } from '../lib/languages';
import { isRTL } from '../lib/rtl';
import { SkeletonCard, SkeletonList } from '../components/common/Skeleton';
import ComprehensionIndicator from '../components/reader/ComprehensionIndicator';
import { getKnownWordSet } from '../lib/text-analysis';
import { buildWordStatusMap, type WordStatusMap, getStatusColor } from '../lib/word-status';
import { parseWithIchiMoe, getIchiMoeUrl, type IchiMoeWord } from '../lib/ichimoe';
import WordDefinitions from '../components/reader/WordDefinitions';
import { parseSrt, srtToText } from '../lib/srt-parser';

type Tab = 'import' | 'library';

export default function ReaderPage() {
  const [tab, setTab] = useState<Tab>('import');
  const [tabReady, setTabReady] = useState(false);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [language, setLanguage] = useState(activeLanguages[0] ?? 'ja');
  const [savedTextId, setSavedTextId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [tokenOffsets, setTokenOffsets] = useState<number[]>([]);
  const [jaTokens, setJaTokens] = useState<Token[]>([]);
  const [jaTokenOffsets, setJaTokenOffsets] = useState<number[]>([]);
  const [sentences, setSentences] = useState<SentenceSpan[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedReading, setSelectedReading] = useState('');
  const [selectedSentence, setSelectedSentence] = useState('');
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
    if (!highlightKnown) return;
    const [known, statusMap] = await Promise.all([
      getKnownWordSet(language),
      buildWordStatusMap(language),
    ]);
    setKnownWordSet(known);
    setWordStatusMap(statusMap);
  }, [highlightKnown, language]);

  useEffect(() => {
    refreshKnownWords();
  }, [refreshKnownWords]);

  // Default to the Library: it holds both saved texts and the curated graded
  // readings, so a first-time reader sees real content instead of a blank
  // paste box.
  useEffect(() => {
    setTab('library');
    setTabReady(true);
  }, []);

  function resetReadingState() {
    logReadingSession();
    setTokens([]);
    setTokenOffsets([]);
    setJaTokens([]);
    setJaTokenOffsets([]);
    setSentences([]);
    setText('');
    setTitle('');
    setSavedTextId(null);
    setSelectedWord(null);
    setSelectedReading('');
    setSelectedSentence('');
    setWordStatusMap(null);
    setIchiMoeWords([]);
    setIchiMoeCorsBlocked(false);
    setIchiMoeLoading(false);
    setIchiMoeOpen(false);
    setTranslation('');
    setShowBilingual(false);
  }

  function switchTab(newTab: Tab) {
    if (newTab === tab) return;
    resetReadingState();
    setTab(newTab);
  }

  async function openTextFromLibrary(record: TextRecord) {
    resetReadingState();
    setText(record.content);
    setTitle(record.title);
    setLanguage(record.language);
    setSavedTextId(record.id ?? null);
    setSentences(splitSentences(record.content));

    // Start tracking reading session
    const wordCount = record.content.split(/\s+/).filter(Boolean).length;
    readingStartRef.current = Date.now();
    readingMetaRef.current = { language: record.language, wordCount, title: record.title };

    if (record.language === 'ja') {
      setIsTokenizing(true);
      try {
        const result = await tokenizeJapanese(record.content);
        setJaTokens(result);
        const offsets: number[] = [];
        let pos = 0;
        for (const t of result) {
          offsets.push(pos);
          pos += t.surface.length;
        }
        setJaTokenOffsets(offsets);
      } catch {
        const chars = record.content.split('');
        setTokens(chars);
        setTokenOffsets(chars.map((_, i) => i));
      } finally {
        setIsTokenizing(false);
      }
    } else {
      const isCJK = /[\u3000-\u9fff\uf900-\ufaff]/.test(record.content);
      let rawTokens: string[];
      if (isCJK) {
        rawTokens = record.content.split('');
      } else {
        rawTokens = record.content.split(/(\s+)/).filter((t) => t.trim());
      }
      const offsets: number[] = [];
      let pos = 0;
      for (const t of rawTokens) {
        const idx = record.content.indexOf(t, pos);
        offsets.push(idx >= 0 ? idx : pos);
        pos = (idx >= 0 ? idx : pos) + t.length;
      }
      setTokens(rawTokens);
      setTokenOffsets(offsets);
    }
  }

  async function openCuratedText(id: string, lang: string, curatedTitle: string) {
    resetReadingState();
    setIsTokenizing(true);
    setLanguage(lang);
    setTitle(curatedTitle);

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}content/reading/${lang}/${id}.txt`);
      if (!res.ok) throw new Error('Failed to load text');
      const content = await res.text();
      setText(content);
      setSentences(splitSentences(content));

      // Start tracking reading session
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      readingStartRef.current = Date.now();
      readingMetaRef.current = { language: lang, wordCount, title: curatedTitle };

      if (lang === 'ja') {
        try {
          const result = await tokenizeJapanese(content);
          setJaTokens(result);
          const offsets: number[] = [];
          let pos = 0;
          for (const t of result) {
            offsets.push(pos);
            pos += t.surface.length;
          }
          setJaTokenOffsets(offsets);
        } catch {
          const chars = content.split('');
          setTokens(chars);
          setTokenOffsets(chars.map((_, i) => i));
        }
      } else {
        const isCJK = /[\u3000-\u9fff\uf900-\ufaff]/.test(content);
        let rawTokens: string[];
        if (isCJK) {
          rawTokens = content.split('');
        } else {
          rawTokens = content.split(/(\s+)/).filter((t) => t.trim());
        }
        const offsets: number[] = [];
        let pos = 0;
        for (const t of rawTokens) {
          const idx = content.indexOf(t, pos);
          offsets.push(idx >= 0 ? idx : pos);
          pos = (idx >= 0 ? idx : pos) + t.length;
        }
        setTokens(rawTokens);
        setTokenOffsets(offsets);
      }
    } catch {
      resetReadingState();
    } finally {
      setIsTokenizing(false);
    }
  }

  const handleImport = async () => {
    if (!text.trim()) return;

    const id = await db.texts.add({
      language,
      title: title || 'Untitled',
      content: text,
      createdAt: new Date().toISOString(),
    }) as number;
    setSavedTextId(id);

    setSentences(splitSentences(text));

    // Start tracking reading session
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    readingStartRef.current = Date.now();
    readingMetaRef.current = { language, wordCount, title: title || 'Untitled' };

    if (language === 'ja') {
      setIsTokenizing(true);
      try {
        const result = await tokenizeJapanese(text);
        setJaTokens(result);
        // Compute character offsets for each Japanese token
        const offsets: number[] = [];
        let pos = 0;
        for (const t of result) {
          offsets.push(pos);
          pos += t.surface.length;
        }
        setJaTokenOffsets(offsets);
      } catch {
        // Fallback to character-level split if tokenizer fails
        const chars = text.split('');
        setTokens(chars);
        setTokenOffsets(chars.map((_, i) => i));
      } finally {
        setIsTokenizing(false);
      }
    } else {
      const isCJK = /[\u3000-\u9fff\uf900-\ufaff]/.test(text);
      let rawTokens: string[];
      if (isCJK) {
        rawTokens = text.split('');
      } else {
        rawTokens = text.split(/(\s+)/).filter((t) => t.trim());
      }
      // Compute character offsets by finding each token in the text
      const offsets: number[] = [];
      let pos = 0;
      for (const t of rawTokens) {
        const idx = text.indexOf(t, pos);
        offsets.push(idx >= 0 ? idx : pos);
        pos = (idx >= 0 ? idx : pos) + t.length;
      }
      setTokens(rawTokens);
      setTokenOffsets(offsets);
    }
  };

  const handleAddWord = async (word: string, reading: string, meaning: string, contextSentence: string) => {
    if (!word || !meaning) return;

    if (!isRunning) start('reading');

    await addWord({
      language,
      word,
      reading,
      meaning,
      contextSentence,
      sourceTextId: savedTextId,
      tags: [],
    });

    setSelectedWord(null);
    setSelectedReading('');
    // Refresh known word set so highlight updates after mining
    refreshKnownWords();
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

  const hasTokens = tokens.length > 0 || jaTokens.length > 0;

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
      {tabToggle}
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
        {/* Language pill selector */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {activeLanguages.map((code) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors press-feedback ${
                language === code
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {getLanguageLabel(code)}
            </button>
          ))}
        </div>
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

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 leading-relaxed text-[1.1rem] dark:text-slate-100" style={{ fontSize: 'var(--app-font-size)' }} dir={isRTL(language) ? 'rtl' : undefined}>
        {jaTokens.length > 0 ? (
          <FuriganaText
            tokens={jaTokens}
            selectedWord={selectedWord}
            onWordClick={(surface, reading, tokenIndex) => {
              setSelectedWord(surface);
              setSelectedReading(reading);
              const offset = jaTokenOffsets[tokenIndex] ?? 0;
              setSelectedSentence(findSentenceAt(sentences, offset));
            }}
            highlightKnown={highlightKnown}
            knownWords={knownWordSet}
            wordStatusMap={wordStatusMap ?? undefined}
            statusHighlight={highlightKnown && !!wordStatusMap}
          />
        ) : (
          tokens.map((token, i) => {
            const isSelected = selectedWord === token;
            const useStatus = highlightKnown && wordStatusMap && token.trim();
            const statusClass = useStatus && !isSelected
              ? getStatusColor(wordStatusMap!.getStatus(token))
              : '';
            const isKnown = !useStatus && highlightKnown && knownWordSet.has(token.toLowerCase());
            return (
            <span
              key={i}
              onClick={() => {
                if (token.trim()) {
                  setSelectedWord(token);
                  setSelectedSentence(findSentenceAt(sentences, tokenOffsets[i] ?? 0));
                }
              }}
              className={`cursor-pointer transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded px-0.5 ${
                isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : ''
              }${isKnown ? ' bg-green-50 dark:bg-green-900/20' : ''} ${statusClass}`}
            >
              {showStressMarks && language === 'ru' ? applyStress(token) : token}
            </span>
            );
          })
        )}
      </div>

      {/* Bilingual translation panel */}
      {showBilingual && translation.trim() && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl shadow p-4 mt-3 leading-relaxed text-sm text-slate-700 dark:text-slate-300 border border-amber-200 dark:border-amber-800/50">
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

      {selectedWord && (
        <WordLookupSheet
          word={selectedWord}
          language={language}
          initialReading={selectedReading}
          contextSentence={selectedSentence}
          onAdd={handleAddWord}
          onClose={() => setSelectedWord(null)}
          wordStatusMap={wordStatusMap ?? undefined}
        />
      )}
    </div>
  );
}
