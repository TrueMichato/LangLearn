import { describe, it, expect } from 'vitest';
import {
  buildGrammarCardFields,
  fillBlank,
  hasBlank,
  parseGrammarCardSources,
  type GrammarCardSource,
} from '../lib/grammar-cards';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { clozeAnswerRepeatsFrame } from './helpers/grammar-retention';

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

function allBlocks(): Block[] {
  const titles = lessonTitles();
  const blocks: Block[] = [];
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const parts = path.split('/');
    const file = parts[parts.length - 1];
    const lang = parts[parts.length - 2];
    const source = `${lang}/${file}`;
    const title = titles.get(`${lang}/${file.replace(/\.md$/, '')}`) ?? '';
    for (const card of parseGrammarCardSources(markdown).items) {
      blocks.push({
        ...card,
        source,
        lang,
        title,
      });
    }
  }
  return blocks;
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

  it('validate explicit metadata rather than treating malformed blocks as missing material', () => {
    const failures = Object.entries(LESSONS).flatMap(([path, markdown]) =>
      parseLessonReviewItems(markdown).diagnostics.map((diagnostic) => ({
        source: path.split('/').slice(-2).join('/'),
        ...diagnostic,
      })),
    );
    expect(failures).toEqual([]);
  });

  it('preserve explicit question-answer prompts and answers verbatim', () => {
    for (const block of BLOCKS.filter((b) => b.format === 'qa')) {
      expect(buildGrammarCardFields(block), block.source).toMatchObject({
        contextSentence: block.example,
        word: block.answer,
      });
    }
  });

  it('never leave a gloss in the answer token', () => {
    // `دَارِسٌ (dārisun) — student` substituted verbatim printed the English
    // translation into the middle of an Arabic sentence.
    const failures = BLOCKS.filter((b) =>
      b.format !== 'qa' && /\s[—–]\s/.test(buildGrammarCardFields(b)?.word ?? ''),
    ).map((b) => `${b.source}: ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('always change the prompt when filling it', () => {
    // A reveal identical to the prompt means the answer never reached the blank.
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (b.format === 'qa' || !hasBlank(prompt)) return false;
      const token = buildGrammarCardFields(b)?.word ?? '';
      return fillBlank(prompt, token) === prompt;
    }).map((b) => `${b.source}: ${b.example} / ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('never put the complete cloze frame inside its missing-span answer', () => {
    // A filled 私は学生です。 is not the missing は in 私＿＿学生です。.
    // Shared letters alone prove nothing: a ___ → cincea and
    // student → studențesc are valid.
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (b.format === 'qa' || !hasBlank(prompt)) return false;
      const token = buildGrammarCardFields(b)?.word ?? '';
      return clozeAnswerRepeatsFrame(prompt, token);
    }).map((b) => `${b.source}: ${b.example} / ${b.answer}`);
    expect(failures).toEqual([]);
  });

  it('leave no blank unfilled in the reveal', () => {
    const failures = BLOCKS.filter((b) => {
      const prompt = b.example ?? '';
      if (b.format === 'qa' || !hasBlank(prompt)) return false;
      const token = buildGrammarCardFields(b)?.word ?? '';
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

  it('give cloze cards a blank while admitting validated explicit question-answer cards', () => {
    const counts = countByLang(BLOCKS.filter((b) => b.format !== 'qa' && !hasBlank(b.example ?? '')));
    for (const [lang, count] of Object.entries(counts)) {
      expect(
        count,
        `${lang} has ${count} blank-less cards; the allowance is ${LEGACY_BLANKLESS[lang] ?? 0}`,
      ).toBeLessThanOrEqual(LEGACY_BLANKLESS[lang] ?? 0);
    }
  });

  it('keep the gloss out of the raw answer field', () => {
    const counts = countByLang(BLOCKS.filter((b) => b.format !== 'qa' && /[—–]/.test(b.answer ?? '')));
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
