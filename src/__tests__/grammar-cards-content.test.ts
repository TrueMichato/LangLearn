import { describe, it, expect } from 'vitest';
import {
  buildGrammarCardFields,
  fillBlank,
  hasBlank,
  parseAnswer,
  type GrammarCardSource,
} from '../lib/grammar-cards';

/**
 * Every `grammar-card` block shipped in the repository, checked through the real
 * parser.
 *
 * These blocks are authored by hand across six languages and three answer
 * conventions, and a malformed one is invisible until a learner is shown a
 * reveal like `私私は学生です。学生です。`. Validating the content itself keeps a
 * future authoring mistake from reaching the deck.
 */

const LESSONS = import.meta.glob('../../public/content/grammar/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Block extends GrammarCardSource {
  /** `lang/file.md`, so a failure names the file to open. */
  source: string;
}

const BLOCK_RE = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

function allBlocks(): Block[] {
  const blocks: Block[] = [];
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const parts = path.split('/');
    const source = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    BLOCK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BLOCK_RE.exec(markdown))) {
      blocks.push({ ...(JSON.parse(match[1]) as Omit<Block, 'source'>), source });
    }
  }
  return blocks;
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const BLOCKS = allBlocks();

describe('shipped grammar-card blocks', () => {
  it('exist in quantity', () => {
    expect(BLOCKS.length).toBeGreaterThan(500);
  });

  it('all parse into a usable card', () => {
    const failures = BLOCKS.filter((b) => buildGrammarCardFields(b) === null).map((b) => b.source);
    expect(failures).toEqual([]);
  });

  it('never leave a gloss in the answer token', () => {
    // `دَارِسٌ (dārisun) — student` substituted verbatim printed the English
    // translation into the middle of an Arabic sentence.
    const failures = BLOCKS.filter((b) =>
      /\s[—–]\s/.test(parseAnswer(b.answer ?? '', b.example ?? '').token),
    ).map((b) => `${b.source}: ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('always change the prompt when filling it', () => {
    // A reveal identical to the prompt means the answer never reached the blank.
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (!hasBlank(prompt)) return false;
      const { token } = parseAnswer(b.answer ?? '', prompt);
      return fillBlank(prompt, token) === prompt;
    }).map((b) => `${b.source}: ${b.example} / ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('never repeat the prompt stem more often than the prompt itself does', () => {
    // This is the exact `私＿＿学生です。` + `私は学生です。` failure: naive
    // substitution repeated the stem on both sides of the blank. Prompts that
    // legitimately repeat their own stem (`O Rio de Janeiro ___ ... O Rio de
    // Janeiro ___ ...`) are compared against themselves rather than a fixed
    // count, so they are not mistaken for the bug.
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (!hasBlank(prompt)) return false;
      // No minimum stem length: the original Japanese failure had a one
      // character stem, and comparing against the prompt's own count already
      // tolerates a stem that legitimately recurs.
      const stem = prompt.split(/[_＿]{2,}/)[0].trim();
      if (!stem) return false;
      const probe = stem.slice(0, Math.min(6, stem.length));
      const { token } = parseAnswer(b.answer ?? '', prompt);
      return occurrences(fillBlank(prompt, token), probe) > occurrences(prompt, probe);
    }).map((b) => `${b.source}: ${b.example} / ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('leave no blank unfilled in the reveal', () => {
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (!hasBlank(prompt)) return false;
      const { token } = parseAnswer(b.answer ?? '', prompt);
      return hasBlank(fillBlank(prompt, token));
    }).map((b) => `${b.source}: ${b.example} / ${b.answer}`);
    expect(failures).toEqual([]);
  });
});
