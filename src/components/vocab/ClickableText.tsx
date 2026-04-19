import { useState, useCallback } from 'react';
import WordLookupSheet from '../reader/WordLookupSheet';
import { addWord, wordExists } from '../../db/words';

interface Props {
  text: string;
  language: string;
  className?: string;
}

/**
 * Splits text into clickable word tokens.
 * Japanese: split on character boundaries (CJK chars vs punctuation/spaces).
 * Others: split on whitespace/punctuation while preserving delimiters.
 */
function tokenize(text: string, language: string): string[] {
  if (language === 'ja' || language === 'zh') {
    // Split CJK text into individual characters/groups, preserving punctuation and spaces
    return text.match(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]+|[^\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEF]+/g) ?? [text];
  }
  // For space-delimited languages: split on word boundaries, keep delimiters
  return text.match(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu) ?? [text];
}

function isWord(token: string, language: string): boolean {
  if (language === 'ja' || language === 'zh') {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(token);
  }
  return /[\p{L}]/u.test(token);
}

export default function ClickableText({ text, language, className = '' }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const tokens = tokenize(text, language);

  const handleAdd = useCallback(
    async (word: string, reading: string, meaning: string, contextSentence: string) => {
      const exists = await wordExists(word, language);
      if (!exists) {
        await addWord({
          language,
          word,
          reading,
          meaning,
          contextSentence,
          sourceTextId: null,
          tags: ['vocab-mining'],
        });
      }
      setSelectedWord(null);
    },
    [language],
  );

  return (
    <>
      <span className={className}>
        {tokens.map((token, i) =>
          isWord(token, language) ? (
            <span
              key={i}
              onClick={() => setSelectedWord(token)}
              className="cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded px-0.5 transition-colors"
            >
              {token}
            </span>
          ) : (
            <span key={i}>{token}</span>
          ),
        )}
      </span>

      {selectedWord && (
        <WordLookupSheet
          word={selectedWord}
          language={language}
          contextSentence={text}
          onAdd={handleAdd}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </>
  );
}
