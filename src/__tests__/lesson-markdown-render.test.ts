import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { LESSON_REMARK_PLUGINS } from '../lib/markdown-plugins';

/**
 * Lessons used to ship markdown that renders a literal `**` to the learner.
 *
 * It is invisible at build time and easy to reintroduce, because the causes are
 * unintuitive:
 *
 *  - CommonMark's emphasis "flanking" rules assume space-delimited writing, so
 *    ordinary Japanese fails to render (this is what `remark-cjk-friendly` fixes).
 *  - A scraper emitted `** 御礼(おれい)**`, with the space *inside* the
 *    delimiters, which can never open emphasis under any spec.
 *  - Scraped tables arrived indented four spaces, turning whole rows into
 *    indented code blocks that display their markup verbatim.
 *  - `**` cannot open intra-word, so `study**ing**` never renders.
 *
 * This suite renders every lesson through the exact plugin list the lesson view
 * uses and fails if any emphasis marker survives into the output.
 */

/** Every grammar lesson in the repository, keyed by path. */
const LESSONS = import.meta.glob('../../public/content/grammar/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Mirrors LessonView: grammar-card blocks are stripped and quiz blocks are
// pulled out into their own components, so neither reaches the markdown render.
const QUIZ_REGEX = /<!--\s*quiz:(.*?)\s*-->/g;
const GRAMMAR_CARD_REGEX = /<!--\s*grammar-card:\s*(.*?)\s*-->/g;

/** Markers that must never survive into rendered output. */
const MARKERS = ['**', '~~'];

function lessonsByLanguage(): Map<string, Array<{ file: string; markdown: string }>> {
  const byLang = new Map<string, Array<{ file: string; markdown: string }>>();
  for (const [path, markdown] of Object.entries(LESSONS)) {
    const parts = path.split('/');
    const lang = parts[parts.length - 2];
    const list = byLang.get(lang) ?? [];
    list.push({ file: parts[parts.length - 1], markdown });
    byLang.set(lang, list);
  }
  return byLang;
}

function renderLesson(markdown: string): string {
  const display = markdown.replace(GRAMMAR_CARD_REGEX, '').replace(QUIZ_REGEX, '');
  return renderToStaticMarkup(
    createElement(ReactMarkdown, {
      remarkPlugins: LESSON_REMARK_PLUGINS,
      children: display,
    }),
  );
}

/**
 * Code blocks legitimately display their contents verbatim — one lesson draws an
 * ASCII timeline out of tildes — so they are not emphasis failures.
 */
function withoutCode(html: string): string {
  return html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code[\s\S]*?<\/code>/g, '');
}

describe('grammar lesson markdown rendering', () => {
  const byLang = lessonsByLanguage();

  it('finds lessons to check', () => {
    expect(byLang.size).toBeGreaterThan(0);
  });

  for (const [lang, lessons] of [...byLang].sort(([a], [b]) => a.localeCompare(b))) {
    it(`renders every ${lang} lesson without a literal emphasis marker`, () => {
      const broken: string[] = [];

      for (const { file, markdown } of lessons) {
        const html = withoutCode(renderLesson(markdown));
        for (const marker of MARKERS) {
          if (!html.includes(marker)) continue;
          // Point at the source lines so a failure is actionable.
          markdown.split('\n').forEach((line, i) => {
            if (line.includes(marker)) broken.push(`${lang}/${file}:${i + 1}  ${line.trim()}`);
          });
        }
      }

      expect(broken, `literal emphasis markers reached the learner:\n${broken.join('\n')}`).toEqual(
        [],
      );
    }, 60_000);
  }
});
