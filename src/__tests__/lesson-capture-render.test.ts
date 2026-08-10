import { describe, it, expect } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { LESSON_REMARK_PLUGINS } from '../lib/markdown-plugins';
import {
  indexBySourceText,
  matchCandidate,
  nodeText,
  parseListCandidates,
} from '../lib/lesson-capture';

/**
 * The inline ➕ button is attached by matching the text of a rendered <li>
 * against the source line the candidate was parsed from. Those two strings come
 * from completely different pipelines — our `stripMarkdown` on one side,
 * remark's AST on the other — so a divergence is invisible at build time and
 * shows up only as buttons that never appear.
 *
 * These tests render real lesson markdown through the same ReactMarkdown
 * configuration the lesson view uses and assert that every parsed list
 * candidate is reachable.
 */

/** Every grammar lesson in the repository, keyed by path. */
const LESSONS = import.meta.glob('../../public/content/grammar/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function lessonsByLanguage(): Map<string, Array<{ file: string; markdown: string }>> {
  const byLang = new Map<string, Array<{ file: string; markdown: string }>>();
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const parts = path.split('/');
    const lang = parts[parts.length - 2];
    const file = parts[parts.length - 1];
    const list = byLang.get(lang) ?? [];
    list.push({ file, markdown });
    byLang.set(lang, list);
  }
  return byLang;
}

/** Render markdown exactly as LessonView does, collecting each <li>'s text. */
function renderedListItemTexts(markdown: string): string[] {
  const texts: string[] = [];
  renderToStaticMarkup(
    createElement(ReactMarkdown, {
      remarkPlugins: LESSON_REMARK_PLUGINS,
      components: {
        li: ({ children }: { children?: ReactNode }) => {
          texts.push(nodeText(children));
          return createElement('li', null, children);
        },
      },
      children: markdown,
    }),
  );
  return texts;
}

function unmatchedCandidates(markdown: string): string[] {
  const index = indexBySourceText(parseListCandidates(markdown));
  if (index.size === 0) return [];
  const matched = new Set<string>();
  for (const text of renderedListItemTexts(markdown)) {
    const candidate = matchCandidate(index, text);
    if (candidate) matched.add(candidate.id);
  }
  return [...index.values()].filter((c) => !matched.has(c.id)).map((c) => c.sourceText);
}

describe('rendered list items match parsed candidates', () => {
  it('matches a simple glossed term', () => {
    expect(unmatchedCandidates('- **猫(ねこ)** — cat')).toEqual([]);
  });

  it('matches when the meaning carries its own emphasis', () => {
    expect(unmatchedCandidates('- **быстрый** — *fast*, quick')).toEqual([]);
  });

  it('matches when the term contains inline code', () => {
    expect(unmatchedCandidates('- **`です`** — polite copula')).toEqual([]);
  });

  it('matches when the line contains a link', () => {
    expect(
      unmatchedCandidates('- **ser** — to be ([reference](https://example.com))'),
    ).toEqual([]);
  });

  it('matches across a multi-item list', () => {
    const md = ['- **猫(ねこ)** — cat', '- **犬(いぬ)** — dog', '- **鳥(とり)** — bird'].join('\n');
    expect(unmatchedCandidates(md)).toEqual([]);
  });

  it('matches a list item that has a nested sub-list', () => {
    // The parent renders its own text followed by every child's, so an exact
    // comparison would leave the parent without a button.
    const md = [
      "- **писа́ть** *(pisát')* — to write:",
      "  - **пишу́** *(pishú)* — I write",
      "  - **пи́шешь** *(píshesh')* — you write",
    ].join('\n');
    expect(unmatchedCandidates(md)).toEqual([]);
  });

  it('matches when CommonMark refuses to open emphasis before CJK punctuation', () => {
    const md =
      '- **赤ちゃんが寝ている**間**、静(しず)かにしてください。** — Please be quiet while the baby sleeps.';
    expect(unmatchedCandidates(md)).toEqual([]);
  });

  it('attaches the nested item to itself, not to its parent', () => {
    const md = ["- **писа́ть** *(pisát')* — to write:", "  - **пишу́** *(pishú)* — I write"].join(
      '\n',
    );
    const index = indexBySourceText(parseListCandidates(md));
    const matched = renderedListItemTexts(md).map((t) => matchCandidate(index, t)?.word);
    expect(matched).toContain('пишу́');
    expect(matched).toContain('писа́ть');
  });
});

describe('real lesson content', () => {
  const byLang = lessonsByLanguage();

  it('has lessons to check', () => {
    expect(byLang.size).toBeGreaterThan(0);
  });

  for (const [lang, lessons] of byLang) {
    it(`attaches a button to every list candidate in ${lang}`, () => {
      const failures: string[] = [];
      let candidateCount = 0;

      for (const { file, markdown } of lessons) {
        candidateCount += parseListCandidates(markdown).length;
        for (const source of unmatchedCandidates(markdown)) {
          failures.push(`${file}: ${source}`);
        }
      }

      expect(candidateCount).toBeGreaterThan(0);
      expect(failures).toEqual([]);
    });
  }
});
