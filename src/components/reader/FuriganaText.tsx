import type { Token } from '../../lib/tokenizer';

interface FuriganaTextProps {
  tokens: Token[];
  selectedWord: string | null;
  onWordClick: (surface: string, reading: string, tokenIndex: number) => void;
  highlightKnown?: boolean;
  knownWords?: Set<string>;
}

export default function FuriganaText({
  tokens,
  selectedWord,
  onWordClick,
  highlightKnown = false,
  knownWords,
}: FuriganaTextProps) {
  return (
    <>
      {tokens.map((token, i) => {
        const isSelected = selectedWord === token.surface;
        const isKnown = highlightKnown && knownWords?.has(token.surface.toLowerCase());
        const baseClass =
          'cursor-pointer transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded px-0.5';
        const selectedClass = isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : '';
        const knownClass = !isSelected && isKnown ? 'bg-green-50 dark:bg-green-900/20' : '';

        if (token.isKanji && token.reading) {
          return (
            <ruby
              key={i}
              onClick={() => onWordClick(token.surface, token.reading, i)}
              className={`${baseClass} ${selectedClass} ${knownClass}`}
              style={{ fontSize: 'var(--app-font-size)' }}
            >
              {token.surface}
              <rp>(</rp>
              <rt className="text-[0.6em] text-slate-400 dark:text-slate-500">{token.reading}</rt>
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
            className={`${baseClass} ${selectedClass} ${knownClass}`}
            style={{ fontSize: 'var(--app-font-size)' }}
          >
            {token.surface}
          </span>
        );
      })}
    </>
  );
}
