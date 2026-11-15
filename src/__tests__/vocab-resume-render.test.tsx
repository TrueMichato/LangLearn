import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import VocabLessonProgress from '../components/vocab/VocabLessonProgress';
import MatchExercise from '../components/vocab/MatchExercise';
import FillBlankExercise from '../components/vocab/FillBlankExercise';
import TypingExercise from '../components/vocab/TypingExercise';
import ListeningExercise from '../components/vocab/ListeningExercise';
import VocabQuiz from '../components/vocab/VocabQuiz';
import { createVocabAttempt } from '../lib/vocab-lesson-attempt';
import type { VocabItemState } from '../lib/vocab-lesson-state';

const state: VocabItemState = {
  kind: 'items', index: 0, input: 'جزء من الإجابة', showHint: true, selected: null, answers: [],
};
const noop = () => {};
const word = { word: 'مرحبا', reading: 'marhaban', meaning: 'hello', example: '', exampleMeaning: '' };

describe('saved vocabulary exercise presentation', () => {
  it('renders restored typing input/hints with an associated accessible name', () => {
    const html = renderToStaticMarkup(<TypingExercise
      items={[{ prompt: 'hello', answer: 'مرحبا', hint: 'م…' }]} language="ar"
      state={state} onChange={noop} onComplete={noop}
    />);
    expect(html).toContain('value="جزء من الإجابة"');
    expect(html).toContain('Hint: م…');
    expect(html).toContain('aria-label="Your answer"');
    expect(html).toContain('name="vocab-typing-answer"');
    expect(html).toContain('dir="rtl"');
  });

  it('keeps revealed fill/typing answers visible until an explicit next action', () => {
    const answered = { ...state, answers: [false] };
    const fill = renderToStaticMarkup(<FillBlankExercise
      items={[{ sentence: '___', answer: 'مرحبا', hint: 'م…' }]} language="ar"
      state={answered} onChange={noop} onComplete={noop}
    />);
    const typing = renderToStaticMarkup(<TypingExercise
      items={[{ prompt: 'hello', answer: 'مرحبا', hint: 'م…' }]} language="ar"
      state={answered} onChange={noop} onComplete={noop}
    />);
    expect(fill).toContain('the answer is');
    expect(fill).toContain('Continue');
    expect(typing).toContain('Answer:');
    expect(typing).toContain('Continue');
    expect(typing).toContain('disabled=""');
  });

  it('renders saved quiz/listening selections without restarting auto-advance timers', () => {
    const answered = { ...state, input: '', selected: 1, answers: [false] };
    const quiz = renderToStaticMarkup(<VocabQuiz
      items={[{ question: 'Choose', options: ['مرحبا', 'شكرا'], answer: 0 }]}
      state={answered} onChange={noop} onComplete={noop}
    />);
    const listening = renderToStaticMarkup(<ListeningExercise
      items={[{ word: 'مرحبا', options: ['hello', 'thanks'], answer: 0 }]} language="ar"
      state={answered} onChange={noop} onComplete={noop}
    />);
    for (const html of [quiz, listening]) {
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('disabled=""');
      expect(html).toContain('Continue');
    }
    expect(listening).toContain('aria-label="Listen to the word"');
  });

  it('shows the frozen matching order, matched pairs and a selected tile', () => {
    const html = renderToStaticMarkup(<MatchExercise
      exercise={{
        type: 'match', pairs: 2, words: [word, { ...word, word: 'شكرا', meaning: 'thanks' }],
        wordOrder: [1, 0], meaningOrder: [0, 1],
      }}
      language="ar"
      state={{ kind: 'match', matched: [0], selectedWord: 1, wrongMeaning: null }}
      onChange={noop} onComplete={noop}
    />);
    expect(html).toContain('(1/2)');
    expect(html.indexOf('شكرا')).toBeLessThan(html.indexOf('مرحبا'));
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('lang="ar" dir="rtl"');
  });

  it('discloses the entire authored-plus-generated workload instead of implying word count is the lesson', () => {
    const attempt = createVocabAttempt('ar', 'intro', {
      id: 'legacy-id', words: Array.from({ length: 5 }, (_, i) => ({ ...word, word: `${word.word}${i}` })),
      exercises: [
        { type: 'match', pairs: 3 },
        { type: 'multiple-choice', items: [{ question: 'Choose', options: ['hello', 'thanks'], answer: 0 }] },
      ],
    });
    attempt.wordIndex = 3;
    const html = renderToStaticMarkup(<VocabLessonProgress attempt={attempt} />);
    expect(html).toContain('Words 4 of 5');
    expect(html).toContain('Stage 1 of 5');
    expect(html).toContain('Whole lesson: 5 words');
    expect(html).toContain('Matching (3 pairs)');
    expect(html).toContain('Quiz (1 question)');
    expect(html).toContain('Typing (4 questions)');
    expect(html).toContain('Listening (4 questions)');
  });
});
