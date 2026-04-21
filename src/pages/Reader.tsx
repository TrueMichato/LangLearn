import { useState, useEffect, useCallback } from 'react';
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
import { SkeletonCard, SkeletonList } from '../components/common/Skeleton';
import ComprehensionIndicator from '../components/reader/ComprehensionIndicator';
import { getKnownWordSet } from '../lib/text-analysis';
import { parseWithIchiMoe, getIchiMoeUrl, type IchiMoeWord } from '../lib/ichimoe';
import WordDefinitions from '../components/reader/WordDefinitions';

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
  const [ichiMoeWords, setIchiMoeWords] = useState<IchiMoeWord[]>([]);
  const [ichiMoeCorsBlocked, setIchiMoeCorsBlocked] = useState(false);
  const [ichiMoeLoading, setIchiMoeLoading] = useState(false);
  const [ichiMoeOpen, setIchiMoeOpen] = useState(false);

  // Load known words when highlighting is toggled on or text/language changes
  const refreshKnownWords = useCallback(async () => {
    if (!highlightKnown) return;
    const known = await getKnownWordSet(language);
    setKnownWordSet(known);
  }, [highlightKnown, language]);

  useEffect(() => {
    refreshKnownWords();
  }, [refreshKnownWords]);

  // Default to Library tab if texts exist
  useEffect(() => {
    getTextCount().then((count) => {
      setTab(count > 0 ? 'library' : 'import');
      setTabReady(true);
    });
  }, []);

  function resetReadingState() {
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
    setIchiMoeWords([]);
    setIchiMoeCorsBlocked(false);
    setIchiMoeLoading(false);
    setIchiMoeOpen(false);
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
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors press-feedback ${
          tab === 'import'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        Import
      </button>
      <button
        onClick={() => switchTab('library')}
        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors press-feedback ${
          tab === 'library'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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
        <TextLibrary onSelectText={openTextFromLibrary} />
      ) : (
      <div className="space-y-3">
        <input
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
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {getLanguageLabel(code)}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 resize-none bg-white dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          onClick={handleImport}
          disabled={!text.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40 press-feedback"
        >
          Start Reading
        </button>
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
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline press-feedback"
        >
          ← New text
        </button>
      </div>

      <ComprehensionIndicator
        text={text}
        language={language}
        highlightEnabled={highlightKnown}
        onToggleHighlight={() => setHighlightKnown((v) => !v)}
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 leading-relaxed text-[1.1rem] dark:text-slate-100" style={{ fontSize: 'var(--app-font-size)' }}>
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
          />
        ) : (
          tokens.map((token, i) => {
            const isKnown = highlightKnown && knownWordSet.has(token.toLowerCase());
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
                selectedWord === token ? 'bg-indigo-200 dark:bg-indigo-800' : ''
              }${isKnown ? ' bg-green-50 dark:bg-green-900/20' : ''}`}
            >
              {showStressMarks && language === 'ru' ? applyStress(token) : token}
            </span>
            );
          })
        )}
      </div>

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
                className="block mt-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Powered by ichi.moe
                </span>
                <button
                  onClick={() => setIchiMoeOpen(false)}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 press-feedback"
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
        />
      )}
    </div>
  );
}
