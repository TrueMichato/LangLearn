import { useState } from 'react';
import { db } from '../db/schema';
import { addWord } from '../db/words';
import { useTimerStore } from '../stores/timerStore';
import WordLookupSheet from '../components/reader/WordLookupSheet';
import { tokenizeJapanese } from '../lib/tokenizer';
import type { Token } from '../lib/tokenizer';
import FuriganaText from '../components/reader/FuriganaText';

export default function ReaderPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('ja');
  const [savedTextId, setSavedTextId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [jaTokens, setJaTokens] = useState<Token[]>([]);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedReading, setSelectedReading] = useState('');
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

    if (language === 'ja') {
      setIsTokenizing(true);
      try {
        const result = await tokenizeJapanese(text);
        setJaTokens(result);
      } catch {
        // Fallback to character-level split if tokenizer fails
        setTokens(text.split(''));
      } finally {
        setIsTokenizing(false);
      }
    } else {
      const isCJK = /[\u3000-\u9fff\uf900-\ufaff]/.test(text);
      if (isCJK) {
        setTokens(text.split(''));
      } else {
        setTokens(text.split(/(\s+)/).filter((t) => t.trim()));
      }
    }
  };

  const handleAddWord = async (word: string, reading: string, meaning: string) => {
    if (!word || !meaning) return;

    if (!isRunning) start('reading');

    await addWord({
      language,
      word,
      reading,
      meaning,
      contextSentence: '',
      sourceTextId: savedTextId,
      tags: [],
    });

    setSelectedWord(null);
    setSelectedReading('');
  };

  const hasTokens = tokens.length > 0 || jaTokens.length > 0;

  if (isTokenizing) {
    return (
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
    );
  }

  if (!hasTokens) {
    return (
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
    );
  }

  return (
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
            onWordClick={(surface, reading) => {
              setSelectedWord(surface);
              setSelectedReading(reading);
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
