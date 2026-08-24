import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
} from '../components/learn/GuidedPractice';
import {
  ACTIVITY_CAPABILITIES,
  GUIDED_ACTIVITY_KINDS,
} from '../lib/activity-capabilities';
import {
  createSeededRandom,
  guidedActivityRoute,
  parseGuidedPracticeQuery,
  selectGuidedItems,
  validateGuidedCompletion,
  type GuidedPracticeDescriptor,
} from '../lib/guided-practice';
import type { GuidedPracticeState } from '../hooks/useGuidedPractice';
import type { LearningPathActivityRef } from '../types/learning-path';

const ACTIVITY_SOURCES = import.meta.glob(
  [
    '../pages/SentenceBuilder.tsx',
    '../pages/ClozePractice.tsx',
    '../pages/Listening.tsx',
    '../pages/Conjugations.tsx',
    '../pages/TranslationPractice.tsx',
    '../pages/MinimalPairs.tsx',
    '../pages/NumberPractice.tsx',
    '../pages/Reader.tsx',
    '../pages/Lyrics.tsx',
    '../pages/Tests.tsx',
    '../components/drills/DictationDrill.tsx',
    '../hooks/useGuidedPractice.ts',
  ],
  { query: '?raw', eager: true, import: 'default' },
) as Record<string, string>;

const INTEGRATIONS = {
  sentence: ['SentenceBuilder.tsx'],
  cloze: ['ClozePractice.tsx'],
  listening: ['Listening.tsx'],
  dictation: ['Listening.tsx', 'DictationDrill.tsx'],
  conjugation: ['Conjugations.tsx'],
  translation: ['TranslationPractice.tsx'],
  'minimal-pairs': ['MinimalPairs.tsx'],
  numbers: ['NumberPractice.tsx'],
  reading: ['Reader.tsx'],
  lyrics: ['Lyrics.tsx'],
  tests: ['Tests.tsx'],
} as const;

function sourceFor(file: string): string {
  const match = Object.entries(ACTIVITY_SOURCES).find(([path]) =>
    path.endsWith(file),
  );
  if (!match) throw new Error(`Missing raw source ${file}`);
  return match[1];
}

function descriptor(
  activity: GuidedPracticeDescriptor['activity'] = 'sentence',
): GuidedPracticeDescriptor {
  return {
    activity,
    milestoneId: `${activity}:stable-step`,
    language: 'es',
    session: ACTIVITY_CAPABILITIES.es[activity].session,
    seed: `es/${activity}:stable-step`,
  };
}

describe('guided practice query and selection contract', () => {
  it('preserves standalone mode when no guided parameter is present', () => {
    expect(parseGuidedPracticeQuery('mode=dictation', 'dictation')).toEqual({
      kind: 'standalone',
    });
  });

  it.each(GUIDED_ACTIVITY_KINDS)(
    'round-trips validated %s routes without changing their existing query',
    (activity) => {
      const capability = ACTIVITY_CAPABILITIES.ar[activity];
      if (!capability.available) return;
      const milestone: LearningPathActivityRef = {
        kind: activity,
        lessonId: `${activity}:stable-step`,
        milestoneId: `${activity}:stable-step`,
        title: capability.label,
        route:
          activity === 'dictation'
            ? `${capability.route}?mode=dictation`
            : capability.route,
        session: capability.session,
      };
      const route = guidedActivityRoute(milestone, 'ar');
      const parsed = parseGuidedPracticeQuery(
        route.split('?')[1] ?? '',
        activity,
      );

      expect(parsed.kind).toBe('guided');
      if (parsed.kind === 'guided') {
        expect(parsed.descriptor).toMatchObject({
          activity,
          milestoneId: `${activity}:stable-step`,
          language: 'ar',
          session: capability.session,
        });
      }
      if (activity === 'dictation') expect(route).toContain('mode=dictation');
    },
  );

  it('rejects partial, mismatched, and stale guided links', () => {
    expect(
      parseGuidedPracticeQuery('guided=sentence%3Abad', 'sentence').kind,
    ).toBe('invalid');

    const valid = guidedActivityRoute(
      {
        kind: 'sentence',
        lessonId: 'sentence:stable-step',
        milestoneId: 'sentence:stable-step',
        title: 'Sentences',
        route: ACTIVITY_CAPABILITIES.es.sentence.route,
        session: ACTIVITY_CAPABILITIES.es.sentence.session,
      },
      'es',
    );
    expect(
      parseGuidedPracticeQuery(valid.split('?')[1] ?? '', 'cloze').kind,
    ).toBe('invalid');

    const stale = new URLSearchParams(valid.split('?')[1]);
    stale.set('guidedTarget', '999');
    expect(parseGuidedPracticeQuery(stale, 'sentence').kind).toBe('invalid');
  });

  it('selects a stable bounded session independent of source ordering', () => {
    const items = Array.from({ length: 20 }, (_, id) => ({ id }));
    const guided = descriptor();
    const selected = selectGuidedItems(items, guided, (item) => String(item.id));
    const reordered = selectGuidedItems(
      [...items].reverse(),
      guided,
      (item) => String(item.id),
    );

    expect(selected).toEqual(reordered);
    expect(selected).toHaveLength(guided.session.targetItems);
    expect(new Set(selected.map((item) => item.id)).size).toBe(selected.length);
  });

  it('provides reproducible seeded randomness for generated tests', () => {
    const first = createSeededRandom('es/tests:stable-step');
    const second = createSeededRandom('es/tests:stable-step');
    const other = createSeededRandom('es/tests:other-step');
    const sequence = Array.from({ length: 8 }, () => first());

    expect(Array.from({ length: 8 }, () => second())).toEqual(sequence);
    expect(Array.from({ length: 8 }, () => other())).not.toEqual(sequence);
  });

  it('requires real bounded effort before granting guided completion', () => {
    const guided = descriptor();
    expect(
      validateGuidedCompletion(
        guided,
        guided.session.minItems - 1,
        100,
      ),
    ).toMatch(/outside the guided range/);
    expect(
      validateGuidedCompletion(
        guided,
        guided.session.maxItems + 1,
        100,
      ),
    ).toMatch(/outside the guided range/);
    expect(
      validateGuidedCompletion(guided, guided.session.targetItems, 42),
    ).toBe('');
    expect(
      validateGuidedCompletion(guided, guided.session.targetItems, 101),
    ).toMatch(/invalid score/);
  });
});

describe('guided activity integration contract', () => {
  it.each(Object.entries(INTEGRATIONS))(
    '%s wires validated guided state, deterministic content, and real completion',
    (activity, files) => {
      const sources = files.map(sourceFor).join('\n');
      expect(sources).toContain('guided');
      expect(sources).toMatch(
        activity === 'tests'
          ? /createSeededRandom/
          : /selectGuidedItems/,
      );
      expect(sources).toMatch(
        activity === 'dictation'
          ? /guidedDescriptor/
          : /guided\.complete/,
      );
      expect(sourceFor(files[0])).toMatch(
        /GuidedPracticeError|guidedDescriptor/,
      );
      expect(sourceFor(files[0])).toMatch(
        /GuidedCompletionActions|guidedDescriptor/,
      );
    },
  );

  it('keeps XP ownership out of milestone plumbing', () => {
    const hookSource = sourceFor(
      '../hooks/useGuidedPractice.ts'.split('/').pop()!,
    );
    expect(hookSource).not.toMatch(/useXPStore|addXP\s*\(/);
  });

  it('renders consistent invalid-link and return-to-path actions', () => {
    const guided = {
      descriptor: descriptor(),
      isGuided: true,
      invalidMessage: '',
      alreadyCompleted: false,
      completedNow: true,
      completionPending: false,
      completionError: '',
      complete: async () => {},
    } satisfies GuidedPracticeState;
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GuidedPracticeError message="Invalid guided step" />
        <GuidedCompletionActions guided={guided} onPracticeAgain={() => {}} />
      </MemoryRouter>,
    );

    expect(html).toContain('Invalid guided step');
    expect(html.match(/Return to learning path/g)).toHaveLength(2);
    expect(html).toContain('Path step complete.');
    expect(html).toContain('Keep practicing');
  });
});
