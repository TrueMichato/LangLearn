import { describe, it, expect } from 'vitest';
import {
  buildGrammarCardFields,
  combineExplanation,
  fillBlank,
  hasBlank,
  parseAnswer,
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

/**
 * The answer field was authored three different ways across the six languages,
 * and only one of them survived being substituted into the blank. These cases
 * are taken verbatim from the content that rendered incorrectly.
 */
describe('parseAnswer', () => {
  it('keeps a bare token untouched', () => {
    expect(parseAnswer('は', '私＿＿学生です。')).toEqual({ token: 'は', gloss: '' });
  });

  it('splits a trailing gloss off the answer', () => {
    expect(parseAnswer('دَارِسٌ (dārisun) — student / studying', 'دَرَسَ → ___')).toEqual({
      token: 'دَارِسٌ (dārisun)',
      gloss: 'student / studying',
    });
  });

  it('does not split hyphenated transliterations', () => {
    expect(parseAnswer('al-kutubu', 'الْ ___').token).toBe('al-kutubu');
  });

  it('recovers the token when the answer restates the whole sentence', () => {
    expect(parseAnswer('私は学生です。', '私＿＿学生です。').token).toBe('は');
  });

  it('recovers the token when the prompt carries a trailing hint', () => {
    expect(parseAnswer('Ela dança bem.', 'Ela dança ___. (well)').token).toBe('bem');
  });

  it('recovers the token when the hint follows the rest of the sentence', () => {
    // The answer restates everything except the parenthetical hint, so the
    // suffix only matches once the hint is discounted.
    expect(parseAnswer('Eu nunca fui ao Japão.', 'Eu ___ fui ao Japão. (never)').token).toBe(
      'nunca',
    );
  });

  it('drops a parenthetical the prompt already supplies', () => {
    expect(parseAnswer('دَارِسٌ (dārisun)', 'دَرَسَ → ___ (dārisun)').token).toBe('دَارِسٌ');
  });
});

describe('fillBlank with several blanks', () => {
  it('distributes comma-separated answers one per blank', () => {
    expect(fillBlank('Eu ___ nadar. Eu ___ a Maria.', 'sei, conheço')).toBe(
      'Eu sei nadar. Eu conheço a Maria.',
    );
  });

  it('does not split commas inside brackets', () => {
    expect(fillBlank('Eu ___ nadar. Eu ___ a Maria.', 'sei (saber), conheço (conhecer)')).toBe(
      'Eu sei (saber) nadar. Eu conheço (conhecer) a Maria.',
    );
  });

  it('honours an explicit ellipsis split', () => {
    expect(fillBlank('___ ele ___ (ser) rico, é humilde.', 'Embora ... seja')).toBe(
      'Embora ele seja (ser) rico, é humilde.',
    );
  });

  it('splits a two-word answer across two blanks', () => {
    expect(fillBlank('A música ___ ___ por Tom Jobim.', 'foi composta')).toBe(
      'A música foi composta por Tom Jobim.',
    );
  });

  it('mirrors script and transliteration into their matching blanks', () => {
    expect(fillBlank('الطَّالِبَةُ ___ (aṭ-ṭālibatu ___).', 'جَالِسَةٌ (jālisatun)')).toBe(
      'الطَّالِبَةُ جَالِسَةٌ (aṭ-ṭālibatu jālisatun).',
    );
  });

  it('mirrors multi-word answers across paired blanks', () => {
    expect(
      fillBlank('عَلِمْتُ ___ ___ (ʿalimtu ___ ___).', 'الْخَبَرَ صَحِيحًا (al-khabara ṣaḥīḥan)'),
    ).toBe('عَلِمْتُ الْخَبَرَ صَحِيحًا (ʿalimtu al-khabara ṣaḥīḥan).');
  });

  it('repeats the answer when it cannot be split confidently', () => {
    expect(fillBlank('___ a ___ b', 'xyz')).toBe('xyz a xyz b');
  });
});

describe('combineExplanation', () => {
  it('prepends the gloss to the explanation', () => {
    expect(combineExplanation('Full stop.', 'the new')).toBe('the new — Full stop.');
  });

  it('does not repeat a gloss the explanation already contains', () => {
    expect(combineExplanation('It means the new book.', 'the new')).toBe('It means the new book.');
  });

  it('falls back to either side when the other is empty', () => {
    expect(combineExplanation('', 'gloss')).toBe('gloss');
    expect(combineExplanation('explanation', '')).toBe('explanation');
  });
});
