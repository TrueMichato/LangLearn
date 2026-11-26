import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SentenceComparison from '../components/sentences/SentenceComparison';
import { getPracticeSentences, type PracticeSentence } from '../data/sentences';

describe('honest sentence comparison', () => {
  const greeting = getPracticeSentences('es').find((sentence) => sentence.id === 'es-e01')!;

  it('compares equivalent wording without treating the example or its hint as the only valid form', () => {
    const html = renderToStaticMarkup(<SentenceComparison sentence={greeting} language="es" answer="Hola, ¿qué tal?" mode="translation" />);
    expect(html).toContain('Hola, ¿qué tal?');
    expect(html).toContain('Hola ¿cómo estás?');
    expect(html).toContain('One possible answer');
    expect(html).toContain('Different wording can be right');
    expect(html).toContain('not an automatic translation grade');
    expect(html).toContain('Meaning:');
    expect(html).toContain('Key form:');
    expect(html).toContain('Context:');
    expect(html).toContain('A different valid construction can work');
    expect(html).toContain('Hint for the example:');
    expect(html).toContain(greeting.hint);
    expect(html).not.toMatch(/incorrect|wrong answer/i);
  });

  it('shows only supplied advice and alternatives, with Arabic direction on every compared answer', () => {
    const sentence: PracticeSentence = {
      id: 'arabic-example', english: 'Hello', target: 'مرحبًا', targetWords: ['مرحبًا'],
      reading: 'marḥaban', difficulty: 'easy', hint: 'Greeting', context: 'Greeting a friend.',
      reviewedFeedback: {
        note: 'Compare greetings in this context.',
        alternatives: [{ target: 'أهلًا', reading: 'ahlan', note: 'Another greeting.' }],
      },
    };
    const html = renderToStaticMarkup(<SentenceComparison sentence={sentence} language="ar" answer="أهلًا وسهلًا" mode="translation" />);
    expect(html).toMatch(/<dd[^>]*dir="rtl"[^>]*>أهلًا وسهلًا<\/dd>/);
    expect(html).toMatch(/<dd[^>]*dir="rtl"[^>]*>مرحبًا<\/dd>/);
    expect(html).toMatch(/<p[^>]*dir="rtl"[^>]*>أهلًا<\/p>/);
    expect(html).toContain('Greeting a friend.');
    expect(html).toContain('Compare greetings in this context.');
    expect(html).toContain('Another greeting.');
    expect(html).toContain('not a complete list');
    const constrained = renderToStaticMarkup(<SentenceComparison sentence={sentence} language="ar" answer="أهلًا" mode="constrained" />);
    expect(constrained).toContain('Practice target');
    expect(constrained).toContain('not every possible translation');
    expect(constrained).not.toContain('Other reviewed examples');
  });

  it.each(['ja', 'ru', 'pt', 'es', 'ar', 'ro'])('offers generic self-check guidance in %s without inventing notes or alternatives', (language) => {
    const sentence = { ...getPracticeSentences(language)[0], hint: undefined };
    const html = renderToStaticMarkup(<SentenceComparison sentence={sentence} language={language} answer={sentence.target} mode="translation" />);
    expect(html).toContain('If no context is given');
    expect(html).not.toContain('Practice note:');
    expect(html).not.toContain('Hint for the example:');
    expect(html).not.toContain('Other reviewed examples');
  });
});
