import { useState } from 'react';
import { db } from '../db/schema';
import { addWord } from '../db/words';
import { useTimerStore } from '../stores/timerStore';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import { tokenizeJapanese } from '../lib/tokenizer';
import type { Token } from '../lib/tokenizer';
import FuriganaText from '../components/reader/FuriganaText';
import { splitSentences, findSentenceAt, type SentenceSpan } from '../lib/sentences';

export default function ReaderPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('ja');
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
  };

  const hasTokens = tokens.length > 0 || jaTokens.length > 0;

  return isTokenizing ? (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
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
      <p className="text-gray-500 text-sm">Parsing Japanese text…</p>
    </div>
  ) : !hasTokens ? (
    <div>
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        Immersion Reader
      </h2>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="ja">Japanese 🇯🇵</option>
          <option value="ru">Russian 🇷🇺</option>
          <option value="en">English 🇬🇧</option>
          <option value="es">Spanish 🇪🇸</option>
          <option value="fr">French 🇫🇷</option>
          <option value="de">German 🇩🇪</option>
          <option value="zh">Chinese 🇨🇳</option>
          <option value="ko">Korean 🇰🇷</option>
        </select>
        <textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
        />
        <button
          onClick={handleImport}
          disabled={!text.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          Start Reading
        </button>
      </div>
    </div>
  ) : (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {title || 'Reading'}
        </h2>
        <button
          onClick={() => {
            setTokens([]);
            setJaTokens([]);
            setText('');
            setTitle('');
            setSavedTextId(null);
          }}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← New text
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 leading-relaxed text-lg">
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
          />
        ) : (
          tokens.map((token, i) => (
            <span
              key={i}
              onClick={() => {
                if (token.trim()) setSelectedWord(token);
              }}
              className={`cursor-pointer transition-colors hover:bg-indigo-100 rounded px-0.5 ${
                selectedWord === token ? 'bg-indigo-200' : ''
              }`}
            >
              {token}
            </span>
          ))
        )}
      </div>

      {selectedWord && (
        <WordLookupSheet
          word={selectedWord}
          language={language}
          initialReading={selectedReading}
          onAdd={handleAddWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
