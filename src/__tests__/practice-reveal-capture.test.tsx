import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GrammarQuiz from '../components/grammar/GrammarQuiz';
import { assessmentVocabulary } from '../lib/assessment-vocabulary';
import type { Question } from '../lib/test-questions';

describe('lesson capture reveal boundary', () => {
  const props = {
    type: 'multiple-choice' as const, question: 'Choose the cat', options: ['gato', 'perro'],
    answer: 0, language: 'es', captureAfterAnswer: true,
    captureWords: [{ word: 'gato', meaning: 'cat' }],
  };
  it('never mounts the capture affordance before answering, including controlled test-outs', () => {
    expect(renderToStaticMarkup(<GrammarQuiz {...props} selectedIndex={null} />))
      .not.toContain('Save words from this practice');
    // Test-outs do not opt in per question, even with selected answer feedback.
    expect(renderToStaticMarkup(<GrammarQuiz {...props} captureAfterAnswer={false} selectedIndex={1} />))
      .not.toContain('Save words from this practice');
  });
  it('offers offline authored metadata only once the answer is revealed, right or wrong', () => {
    for (const selectedIndex of [0, 1]) {
      expect(renderToStaticMarkup(<GrammarQuiz {...props} selectedIndex={selectedIndex} />))
        .toContain('Save words from this practice');
    }
  });
  it('does not guess English assessment prose into target-language vocabulary', () => {
    const questions: Question[] = [
      { id: 1, category: 'vocabulary', question: 'What does "gato" (ga-to) mean?', options: ['cat', 'dog'], correctIndex: 0 },
      { id: 2, category: 'vocabulary', question: 'Which word means "water"?', options: ['agua', 'gato'], correctIndex: 0 },
      { id: 3, category: 'grammar', question: 'Choose a rule', options: ['English rule', 'Other rule'], correctIndex: 0 },
      { id: 4, category: 'grammar', question: 'Choose an Arabic sentence', options: ['قطة', 'Other rule'], correctIndex: 0, targetOptionIndices: [0] },
    ];
    expect(assessmentVocabulary(questions)).toEqual([
      { word: 'gato', reading: 'ga-to', meaning: 'cat' }, { word: 'agua', meaning: 'water' }, { word: 'قطة' },
    ]);
  });
});
