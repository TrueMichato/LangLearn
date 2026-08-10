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
  /** Two-letter language code, used to scope the legacy allowances below. */
  lang: string;
  /** The lesson's title from `index.json`, so a card cannot merely echo it. */
  title: string;
}

const INDEXES = import.meta.glob('../../public/content/grammar/*/index.json', {
  import: 'default',
  eager: true,
}) as Record<string, unknown>;

/** `lang/lessonId` -> lesson title. */
function lessonTitles(): Map<string, string> {
  const titles = new Map<string, string>();
  for (const [path, parsed] of Object.entries(INDEXES)) {
    const lang = path.split('/').at(-2) ?? '';
    const lessons = Array.isArray(parsed)
      ? parsed
      : ((parsed as { lessons?: unknown[] }).lessons ?? []);
    for (const lesson of lessons as { id?: string; title?: string }[]) {
      if (lesson.id) titles.set(`${lang}/${lesson.id}`, lesson.title ?? '');
    }
  }
  return titles;
}

const BLOCK_RE = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

function allBlocks(): Block[] {
  const titles = lessonTitles();
  const blocks: Block[] = [];
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const parts = path.split('/');
    const file = parts[parts.length - 1];
    const lang = parts[parts.length - 2];
    const source = `${lang}/${file}`;
    const title = titles.get(`${lang}/${file.replace(/\.md$/, '')}`) ?? '';
    BLOCK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BLOCK_RE.exec(markdown))) {
      blocks.push({
        ...(JSON.parse(match[1]) as Omit<Block, 'source' | 'lang' | 'title'>),
        source,
        lang,
        title,
      });
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

  // ---------------------------------------------------------------------------
  // The quality bar. These mirror `scripts/apply-grammar-cards.ts`'s `validate()`
  // so a card authored by hand, rather than through the script, cannot slip past
  // it. Two rules carry a ratchet: Arabic shipped before the bar existed, and its
  // legacy blocks are grandfathered by exact count so the debt can only shrink.
  // ---------------------------------------------------------------------------

  /** Question-style prompts with no blank. Arabic-only legacy; must not grow. */
  const LEGACY_BLANKLESS: Record<string, number> = { ar: 167 };
  /** Answers still carrying a ` — gloss`. `parseAnswer` copes; new cards should not. */
  const LEGACY_GLOSS_ANSWERS: Record<string, number> = { ar: 12 };

  function countByLang(blocks: Block[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const block of blocks) counts[block.lang] = (counts[block.lang] ?? 0) + 1;
    return counts;
  }

  it('give every new card a blank to fill', () => {
    const counts = countByLang(BLOCKS.filter((b) => !hasBlank(b.example ?? '')));
    for (const [lang, count] of Object.entries(counts)) {
      expect(
        count,
        `${lang} has ${count} blank-less cards; the allowance is ${LEGACY_BLANKLESS[lang] ?? 0}`,
      ).toBeLessThanOrEqual(LEGACY_BLANKLESS[lang] ?? 0);
    }
  });

  it('keep the gloss out of the raw answer field', () => {
    const counts = countByLang(BLOCKS.filter((b) => /[—–]/.test(b.answer ?? '')));
    for (const [lang, count] of Object.entries(counts)) {
      expect(
        count,
        `${lang} has ${count} answers with a gloss suffix; the allowance is ${LEGACY_GLOSS_ANSWERS[lang] ?? 0}`,
      ).toBeLessThanOrEqual(LEGACY_GLOSS_ANSWERS[lang] ?? 0);
    }
  });

  it('state a rule rather than echoing the lesson title', () => {
    // `rule` = lesson title was the signature of the quiz-derived cards that were
    // removed for being context-free.
    const failures = BLOCKS.filter(
      (b) => b.title && b.rule.trim().toLowerCase() === b.title.trim().toLowerCase(),
    ).map((b) => `${b.source}: ${b.rule}`);
    expect(failures).toEqual([]);
  });

  it('explain the answer instead of restating it', () => {
    const failures = BLOCKS.filter((b) => {
      const explanation = (b.explanation ?? '').trim();
      return explanation.length < 15 || /^correct answer/i.test(explanation);
    }).map((b) => `${b.source}: ${b.explanation}`);
    expect(failures).toEqual([]);
  });

  it('are never built from a counter-example', () => {
    // Tofugu marks incorrect Japanese with ❌; mining one produces a card that
    // actively teaches a wrong sentence.
    const failures = BLOCKS.filter((b) => /[❌✗]/.test(`${b.example ?? ''}${b.answer ?? ''}`)).map(
      (b) => `${b.source}: ${b.example}`,
    );
    expect(failures).toEqual([]);
  });

  it('cover every lesson that teaches a grammar point', () => {
    // Lessons without cards generate nothing for the review queue. Only the
    // Russian link list is exempt.
    const covered = new Set(BLOCKS.map((b) => b.source));
    const uncovered = Object.keys(LESSONS)
      .map((path) => path.split('/').slice(-2).join('/'))
      .filter((source) => !covered.has(source) && source !== 'ru/resources.md');
    expect(uncovered).toEqual([]);
  });
});
