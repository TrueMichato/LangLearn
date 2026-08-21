import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AssessmentResult from '../components/assessment/AssessmentResult';
import AssessmentBlocked from '../components/assessment/AssessmentBlocked';

const oneLesson = [{ id: 'l1', title: 'Particles' }];
const threeLessons = [
  { id: 'l1', title: 'Particles' },
  { id: 'l2', title: 'Verb Forms' },
  { id: 'l3', title: 'Adjectives' },
];

describe('AssessmentResult (pass)', () => {
  it('celebrates a pass, names the lesson count and score, singular for one lesson', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={85} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('You tested out of 1 lesson! Scored 85%.');
    expect(html).not.toContain('1 lessons');
  });

  it('uses plural copy for a multi-lesson range', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={100} lessons={threeLessons} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('You tested out of 3 lessons! Scored 100%.');
  });

  it('explicitly states no XP is granted for testing out', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('No XP for testing out');
  });

  it('offers a single primary Continue action, not a retry option', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('Continue');
    expect(html).not.toContain('Try again');
  });

  it('meets the 44px touch target and ships dark-mode twins', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('dark:text-green-200');
    expect(html).toContain('dark:bg-green-950');
  });
});

describe('AssessmentResult (fail)', () => {
  it('states the score and 80% bar without any punishing tone', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('Scored 60% — testing out needs 80%.');
  });

  it('reassures the learner that nothing changed', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('Nothing changed here');
  });

  it('never uses red styling for a fail — kind, never punishing', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).not.toContain('red-');
  });

  it('offers both Try again and Study the lessons', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={threeLessons} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).toContain('Try again');
    expect(html).toContain('Study the lessons');
  });

  it('does not mention XP on a failed attempt (nothing was granted or withheld to react to)', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} onRetry={() => {}} onExit={() => {}} />,
    );
    expect(html).not.toContain('XP');
  });
});

describe('AssessmentBlocked', () => {
  it('names the single missing lesson by title', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked missingLessons={[{ id: 'l2', title: 'Verb Forms' }]} onBack={() => {}} />,
    );
    expect(html).toContain('&quot;Verb Forms&quot; doesn&#x27;t have enough content');
  });

  it('summarizes a count for multiple missing lessons instead of listing all titles', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked
        missingLessons={[
          { id: 'l2', title: 'Verb Forms' },
          { id: 'l3', title: 'Adjectives' },
        ]}
        onBack={() => {}}
      />,
    );
    expect(html).toContain('2 lessons in this range');
  });

  it('offers a single back-to-lessons action, no retry (there is nothing to retry against)', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked missingLessons={[{ id: 'l2', title: 'Verb Forms' }]} onBack={() => {}} />,
    );
    expect(html).toContain('Back to lessons');
  });

  it('meets the 44px touch target and ships dark-mode twins', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked missingLessons={[{ id: 'l2', title: 'Verb Forms' }]} onBack={() => {}} />,
    );
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('dark:text-slate-100');
  });
});
