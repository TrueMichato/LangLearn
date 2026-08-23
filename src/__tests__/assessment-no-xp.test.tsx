/**
 * The test-out flow must never award XP: that stays earned only by working
 * through a lesson's own content or exercises (see `LessonView.tsx` /
 * `VocabLessonView.tsx` for where that XP actually is granted). This is
 * asserted two ways: a static source scan (mirroring the route-literal scan
 * in `routes.test.ts`) that the assessment components never touch the XP
 * store or its `addXP`/`syncGrammarCards` side effects, plus a render smoke
 * test of `LessonAssessment`'s initial state.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LessonAssessment from '../components/assessment/LessonAssessment';

const SOURCES = import.meta.glob('../components/assessment/*.tsx', {
  query: '?raw',
  eager: true,
  import: 'default',
}) as Record<string, string>;

describe('test-out never awards XP', () => {
  it('no assessment component imports the XP store or syncs grammar SRS cards', () => {
    for (const [file, source] of Object.entries(SOURCES)) {
      expect(source, `${file} must not import useXPStore`).not.toMatch(/useXPStore/);
      expect(source, `${file} must not call addXP`).not.toMatch(/addXP\s*\(/);
      expect(source, `${file} must not sync grammar SRS cards`).not.toMatch(/syncGrammarCards/);
    }
  });

  it('previews the assessment before loading questions or awarding XP', () => {
    // renderToStaticMarkup never runs effects, so this captures exactly the
    // deliberate scope preview shown before question generation begins.
    const html = renderToStaticMarkup(
      <LessonAssessment
        lang="ja"
        kind="grammar"
        lessons={[{ id: 'l1', title: 'Particles' }]}
        onExit={() => {}}
      />,
    );
    expect(html).toContain('Check what you already know');
    expect(html).toContain('does not grant normal lesson XP');
    expect(html).toContain('Start the check');
    expect(html).not.toContain('skeleton');
  });

  it('uses the Learn return label and names a multi-lesson range', () => {
    const html = renderToStaticMarkup(
      <LessonAssessment
        lang="ja"
        kind="grammar"
        lessons={[
          { id: 'l1', title: 'Particles' },
          { id: 'l2', title: 'Verb Forms' },
        ]}
        onExit={() => {}}
        returnLabel="Back to path"
      />,
    );
    expect(html).toContain('Back to path');
    expect(html).toContain('from');
    expect(html).toContain('Particles');
    expect(html).toContain('through');
    expect(html).toContain('Verb Forms');
    expect(html).toContain('Score 80% or higher');
  });
});
