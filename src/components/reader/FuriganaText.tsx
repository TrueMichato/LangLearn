import type { Token } from '../../lib/tokenizer';

interface FuriganaTextProps {
  tokens: Token[];
  selectedWord: string | null;
  onWordClick: (surface: string, reading: string, tokenIndex: number) => void;
}

export default function FuriganaText({
  tokens,
  selectedWord,
  onWordClick,
}: FuriganaTextProps) {
  return (
    <>
      {tokens.map((token, i) => {
        const isSelected = selectedWord === token.surface;
        const baseClass =
          'cursor-pointer transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded px-0.5';
        const selectedClass = isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : '';

        if (token.isKanji && token.reading) {
          return (
            <ruby
              key={i}
              onClick={() => onWordClick(token.surface, token.reading, i)}
              className={`${baseClass} ${selectedClass}`}
              style={{ fontSize: 'var(--app-font-size)' }}
            >
              {token.surface}
              <rp>(</rp>
              <rt className="text-xs text-gray-500 dark:text-gray-400">{token.reading}</rt>
              <rp>)</rp>
            </ruby>
          );
        }

        if (!token.surface.trim()) {
          return <span key={i}>{token.surface}</span>;
        }

        return (
          <span
            key={i}
            onClick={() => onWordClick(token.surface, token.reading, i)}
            className={`${baseClass} ${selectedClass}`}
            style={{ fontSize: 'var(--app-font-size)' }}
          >
            {token.surface}
          </span>
        );
      })}
    </>
  );
}
