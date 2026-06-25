import { describe, it, expect } from 'vitest';
import {
  buildGrammarCardFields,
  fillBlank,
  hasBlank,
  type GrammarCardSource,
} from '../lib/grammar-cards';

describe('buildGrammarCardFields', () => {
  const card: GrammarCardSource = {
    rule: 'Ser = identity; Estar = location/condition',
    hint: 'SER: who/what it IS. ESTAR: where/how right now',
    example: 'La fiesta ___ en mi casa. Yo ___ cansado.',
    answer: 'es, estoy',
    explanation: 'Events use ser; temporary conditions use estar.',
  };

  it('stores the example as the prompt and the answer separately', () => {
    const fields = buildGrammarCardFields(card)!;
    expect(fields.contextSentence).toBe(card.example);
    expect(fields.word).toBe(card.answer);
    expect(fields.grammarRule).toBe(card.rule);
    expect(fields.reading).toBe(card.hint);
    expect(fields.meaning).toBe(card.explanation);
  });

  it('never leaks the answer onto the question side (the prompt keeps its blank)', () => {
    const fields = buildGrammarCardFields(card)!;
    // The prompt the learner sees must not contain the answer text.
    expect(fields.contextSentence).not.toContain(card.answer);
    expect(hasBlank(fields.contextSentence)).toBe(true);
  });

  it('never leaks the rule onto the question side', () => {
    const fields = buildGrammarCardFields(card)!;
    expect(fields.contextSentence).not.toContain(card.rule);
  });

  it('falls back to the rule as the answer when no answer is provided', () => {
    const fields = buildGrammarCardFields({
      rule: 'Some rule',
      example: 'A prompt without a blank',
      explanation: 'why',
    })!;
    expect(fields.word).toBe('Some rule');
  });

  it('returns null when there is nothing to test', () => {
    expect(buildGrammarCardFields({ rule: 'r', explanation: 'e' })).toBeNull();
  });
});

describe('fillBlank', () => {
  it('replaces a single blank with the answer', () => {
    expect(fillBlank('Yo ___ cansado', 'estoy')).toBe('Yo estoy cansado');
  });

  it('replaces full-width blanks too', () => {
    expect(fillBlank('Yo ＿＿ cansado', 'estoy')).toBe('Yo estoy cansado');
  });

  it('leaves a blank-less sentence unchanged', () => {
    expect(fillBlank('No blank here', 'x')).toBe('No blank here');
  });

  it('returns the sentence unchanged when answer is empty', () => {
    expect(fillBlank('Yo ___ cansado', '')).toBe('Yo ___ cansado');
  });
});

describe('hasBlank', () => {
  it('detects ascii and full-width blanks', () => {
    expect(hasBlank('a ___ b')).toBe(true);
    expect(hasBlank('a ＿＿ b')).toBe(true);
  });

  it('is false for plain text and empty input', () => {
    expect(hasBlank('plain question')).toBe(false);
    expect(hasBlank('')).toBe(false);
    expect(hasBlank(undefined)).toBe(false);
  });
});
