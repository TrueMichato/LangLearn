import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AssessmentResult from '../components/assessment/AssessmentResult';
import AssessmentBlocked from '../components/assessment/AssessmentBlocked';
import GrammarQuiz from '../components/grammar/GrammarQuiz';

const oneLesson = [{ id: 'l1', title: 'Particles' }];
const threeLessons = [
  { id: 'l1', title: 'Particles' },
  { id: 'l2', title: 'Verb Forms' },
  { id: 'l3', title: 'Adjectives' },
];

const actions = {
  onRetry: () => {},
  onContinue: () => {},
  onStudy: () => {},
};

describe('AssessmentResult (pass)', () => {
  it('celebrates a pass, names the lesson count and score, singular for one lesson', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={85} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('You checked 1 lesson and scored 85%.');
    expect(html).not.toContain('1 lessons');
  });

  it('uses plural copy for a multi-lesson range', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={100} lessons={threeLessons} {...actions} />,
    );
    expect(html).toContain('You checked 3 lessons and scored 100%.');
  });

  it('explicitly states no XP is granted for checking ahead', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('No XP for checking ahead');
  });

  it('offers a single primary Continue action, not a retry option', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('Continue');
    expect(html).not.toContain('Try again');
  });

  it('supports a path-specific continuation label', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult
        passed
        score={90}
        lessons={oneLesson}
        {...actions}
        continueLabel="Continue on your path"
      />,
    );
    expect(html).toContain('Continue on your path');
  });

  it('meets the 44px touch target and ships dark-mode twins', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed score={90} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('min-h-[44px]');
    expect(html).toContain('dark:text-green-200');
    expect(html).toContain('dark:bg-green-950');
    expect(html).toContain('role="status"');
    expect(html).toContain('<h2');
  });
});

describe('AssessmentResult (fail)', () => {
  it('states the score and 80% bar without any punishing tone', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('You scored 60% — this check needs 80%.');
  });

  it('reassures the learner that nothing changed', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} {...actions} />,
    );
    expect(html).toContain('Nothing changed here');
  });

  it('never uses red styling for a fail — kind, never punishing', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} {...actions} />,
    );
    expect(html).not.toContain('red-');
  });

  it('offers both Try again and Study the lessons', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={threeLessons} {...actions} />,
    );
    expect(html).toContain('Try again');
    expect(html).toContain('Study the lessons');
  });

  it('supports returning to the path after a failed Learn-origin check', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult
        passed={false}
        score={60}
        lessons={threeLessons}
        {...actions}
        studyLabel="Back to path"
      />,
    );
    expect(html).toContain('Back to path');
    expect(html).not.toContain('Study the lessons');
  });

  it('does not mention XP on a failed attempt (nothing was granted or withheld to react to)', () => {
    const html = renderToStaticMarkup(
      <AssessmentResult passed={false} score={60} lessons={oneLesson} {...actions} />,
    );
    expect(html).not.toContain('XP');
    expect(html).toContain('aria-live="polite"');
  });
});

describe('GrammarQuiz direction and restored state', () => {
  it('keeps English framing LTR and marks Arabic answer options RTL', () => {
    const html = renderToStaticMarkup(
      <GrammarQuiz
        type="multiple-choice"
        question='Which word means "family"?'
        options={['عائلة', 'كتاب']}
        answer={0}
        selectedIndex={1}
        language="ar"
        targetOptionIndices={[0, 1]}
      />,
    );

    expect(html).toContain('dir="rtl"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('Not quite');
  });
});

describe('AssessmentBlocked', () => {
  it('names the single missing lesson by title', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked missingLessons={[{ id: 'l2', title: 'Verb Forms' }]} onBack={() => {}} />,
    );
    expect(html).toContain('&quot;Verb Forms&quot; doesn&#x27;t have enough content');
  });

  it('uses a context-specific return label', () => {
    const html = renderToStaticMarkup(
      <AssessmentBlocked
        missingLessons={[{ id: 'l2', title: 'Verb Forms' }]}
        onBack={() => {}}
        backLabel="Back to path"
      />,
    );
    expect(html).toContain('Back to path');
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
