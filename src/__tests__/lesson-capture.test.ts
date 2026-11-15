import { describe, it, expect } from 'vitest';
import {
  captureTags,
  humanizeLessonId,
  lessonIdFromTags,
  looksLikeSentence,
  parseLessonCandidates,
  parseLessonReviewItems,
  parseListCandidates,
  parseTableCandidates,
  parseVocabularyCardSources,
  resolveColumnRoles,
  stripLessonReviewSources,
} from '../lib/lesson-capture';

describe('parseListCandidates', () => {
  it('captures a Japanese word with an inline reading', () => {
    const [candidate] = parseListCandidates('- **大きい(おおきい)** — big');
    expect(candidate).toMatchObject({ word: '大きい', reading: 'おおきい', meaning: 'big' });
  });

  it('captures a sentence with a separate reading', () => {
    const [candidate] = parseListCandidates(
      '- **Cafeaua este bună.** (kah-FEAH-wah) — The coffee is good.',
    );
    expect(candidate).toMatchObject({
      word: 'Cafeaua este bună.',
      reading: 'kah-FEAH-wah',
      meaning: 'The coffee is good.',
      isSentence: true,
    });
  });

  it('never puts the meaning in the context sentence', () => {
    // Flashcard renders contextSentence on the question side, so a dictionary
    // line here would print the answer under the prompt.
    const [candidate] = parseListCandidates('- **猫(ねこ)** — cat');
    expect(candidate.contextSentence).toBe('');
  });

  it('ignores bullets that are English explanation', () => {
    expect(
      parseListCandidates('- **Hard-stem adjectives (новый) are the most common** — learn this first'),
    ).toEqual([]);
  });

  it('ignores bullets that do not start with bold', () => {
    expect(parseListCandidates('- Other adjectives: red, blue (синий) — colours')).toEqual([]);
  });

  it('skips the sources section', () => {
    const md = ['## Sources', '', '- **Tae Kim** — grammar guide'].join('\n');
    expect(parseListCandidates(md)).toEqual([]);
  });
});

describe('resolveColumnRoles', () => {
  it('returns null for a paradigm table with no meaning column', () => {
    expect(resolveColumnRoles(['Case', 'Masculine', 'Feminine', 'Neuter'])).toBeNull();
  });

  it('prefers a named language column over the first column', () => {
    expect(resolveColumnRoles(['Pattern', 'Arabic', 'Translation'])).toMatchObject({
      target: 1,
      meaning: 2,
    });
  });

  it('maps reading and example columns', () => {
    expect(resolveColumnRoles(['Adverb', 'Pronunciation', 'Meaning', 'Example'])).toEqual({
      target: 0,
      reading: 1,
      meaning: 2,
      example: 3,
    });
  });
});

describe('parseTableCandidates', () => {
  const arabicTable = [
    '| Pattern | Arabic | Translation |',
    '|---|---|---|',
    '| no doubt | **لَا شَكَّ** (lā shakka) | there is no doubt |',
  ].join('\n');

  it('captures the target column of a table with a meaning column', () => {
    const [candidate] = parseTableCandidates(arabicTable);
    expect(candidate).toMatchObject({
      word: 'لَا شَكَّ',
      reading: 'lā shakka',
      meaning: 'there is no doubt',
      source: 'table',
    });
  });

  it('skips paradigm tables entirely', () => {
    const declension = [
      '| Case | Masculine | Feminine |',
      '|---|---|---|',
      '| Nominative | нов**ый** | нов**ая** |',
    ].join('\n');
    expect(parseTableCandidates(declension)).toEqual([]);
  });

  it('prefers a gloss carried by the cell over the row meaning', () => {
    const md = [
      '| Verb | Active participle | Meaning clue |',
      '|---|---|---|',
      '| **كَتَبَ** (kataba) — he wrote | **كَاتِبٌ** (kātibun) | the one who writes |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate.meaning).toBe('he wrote');
  });

  it('uses an example column as the context sentence', () => {
    const md = [
      '| Base | Meaning | Example |',
      '|---|---|---|',
      '| 静か | quiet | 静かになる |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate.contextSentence).toBe('静かになる');
  });

  it('drops rows whose term is a grammatical label', () => {
    const md = [
      '| Form | Meaning |',
      '|---|---|',
      '| masculine singular | good boy |',
    ].join('\n');
    expect(parseTableCandidates(md)).toEqual([]);
  });

  it('treats an English aside as an annotation, not a reading', () => {
    const md = [
      '| Long form | Meaning |',
      '|---|---|',
      '| рад (only short) | glad |',
    ].join('\n');
    const [candidate] = parseTableCandidates(md);
    expect(candidate).toMatchObject({ word: 'рад', reading: '' });
  });
});

describe('parseLessonCandidates', () => {
  it('merges list and table sources without duplicates', () => {
    const md = [
      '- **猫(ねこ)** — cat',
      '',
      '| Word | Meaning |',
      '|---|---|',
      '| **猫**(ねこ) | cat |',
      '| **犬**(いぬ) | dog |',
    ].join('\n');
    expect(parseLessonCandidates(md).map((c) => c.word)).toEqual(['猫', '犬']);
  });

  it('ignores content inside html comments', () => {
    const md = '<!-- grammar-card: {"rule":"r","example":"- **x** — y"} -->';
    expect(parseLessonCandidates(md)).toEqual([]);
  });

  it('uses explicit vocabulary instead of a duplicate formatting suggestion, retaining inline matching', () => {
    const explicit = {
      id: 'cat',
      word: '猫',
      reading: 'ねこ',
      meaning: 'a cat',
      priority: 'essential',
      sourceSection: 'Pets',
    };
    const markdown = [
      '- **猫(ねこ)** — cat',
      `<!-- vocab-card: ${JSON.stringify(explicit)} -->`,
      '| Word | Meaning |',
      '|---|---|',
      '| 猫 | feline |',
    ].join('\n');
    expect(parseLessonCandidates(markdown)).toEqual([
      expect.objectContaining({
        ...explicit,
        provenance: 'authored',
        source: 'vocab-card',
        sourceText: '猫(ねこ) — cat',
      }),
    ]);
  });
});

describe('canonical lesson review items', () => {
  const vocab = {
    id: 'book',
    word: 'кни́га',
    meaning: 'book',
    priority: 'essential',
    sourceSection: 'The seven-letter spelling rule',
  };
  const grammar = {
    id: 'seven-letter-set',
    kind: 'concept',
    format: 'qa',
    rule: 'The seven-letter set excludes Ц',
    example: 'Is Ц part of the seven-letter set?',
    answer: 'No — Ц follows separate spelling rules.',
    explanation: 'Keep the two conditions distinct.',
    priority: 'essential',
    sourceSection: 'The seven-letter spelling rule',
  };
  const block = (name: string, value: unknown) => `<!-- ${name}: ${JSON.stringify(value)} -->`;

  it('normalizes explicit lexical and conceptual material alongside optional legacy suggestions', () => {
    const markdown = [
      '## Other words',
      '- **ла́мпа** — lamp',
      block('vocab-card', vocab),
      block('grammar-card', grammar),
      block('grammar-card', {
        rule: 'Use и after г',
        example: 'книг___',
        answer: 'и — plural ending',
        explanation: 'Г is one of the seven letters.',
      }),
    ].join('\n');
    const parsed = parseLessonReviewItems(markdown);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.items).toHaveLength(4);
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'book', kind: 'vocabulary', priority: 'essential', provenance: 'authored' }),
      expect.objectContaining({ id: 'seven-letter-set', kind: 'concept', format: 'qa', answer: grammar.answer }),
      expect.objectContaining({ kind: 'vocabulary', word: 'ла́мпа', priority: 'optional', provenance: 'formatting', sourceSection: 'Other words' }),
      expect.objectContaining({ kind: 'rule', answer: 'и', explanation: 'plural ending — Г is one of the seven letters.', priority: 'optional', provenance: 'legacy' }),
    ]));
    const ids = parsed.items.map((item) => item.id);
    expect(ids.some((id) => id.startsWith('legacy:'))).toBe(true);
    expect(ids.some((id) => id.startsWith('formatting:'))).toBe(true);
  });

  it('requires IDs unique across grammar and vocabulary, retaining the first valid declaration', () => {
    const parsed = parseLessonReviewItems([
      block('grammar-card', grammar),
      block('vocab-card', { ...vocab, id: grammar.id }),
    ].join('\n'));
    expect(parsed.items.map((item) => item.kind)).toEqual(['concept']);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({ code: 'duplicate-id', block: 'vocab-card', line: 2, itemId: grammar.id }),
    ]);
  });

  it('reports duplicates within either block type without adding duplicate items', () => {
    for (const [name, source] of [['vocab-card', vocab], ['grammar-card', grammar]] as const) {
      const markdown = [block(name, source), block(name, source)].join('\n');
      expect(parseLessonReviewItems(markdown)).toMatchObject({
        items: [expect.objectContaining({ id: source.id })],
        diagnostics: [expect.objectContaining({ code: 'duplicate-id', line: 2 })],
      });
    }
  });

  it('coalesces repeated legacy blocks by their exact rule and prompt identity', () => {
    const legacy = { rule: 'A rule', example: 'A ___ prompt', answer: 'focused', explanation: 'A useful explanation.' };
    const parsed = parseLessonReviewItems([block('grammar-card', legacy), block('grammar-card', legacy)].join('\n'));
    expect(parsed.items).toHaveLength(1);
    expect(parsed.diagnostics).toEqual([]);
  });

  it('keeps valid material next to errors, even when both comments share one line', () => {
    const parsed = parseLessonReviewItems(
      `${block('vocab-card', { ...vocab, meaning: null })} ${block('vocab-card', vocab)}`,
    );
    expect(parsed.items).toEqual([expect.objectContaining({ id: vocab.id, meaning: 'book' })]);
    expect(parsed.diagnostics).toEqual([expect.objectContaining({ code: 'invalid-metadata' })]);
  });

  it('exposes lexical schema errors and does not mislabel broken metadata as an empty lesson', () => {
    const parsed = parseVocabularyCardSources(block('vocab-card', { ...vocab, reading: 4 }));
    expect(parsed.items).toEqual([]);
    expect(parsed.diagnostics).toEqual([
      expect.objectContaining({ code: 'invalid-metadata', block: 'vocab-card', itemId: 'book' }),
    ]);
    expect(parseLessonReviewItems('A genuinely unannotated prose lesson.')).toEqual({ items: [], diagnostics: [] });
  });

  it('never mines prose, paradigms, quiz answers, or distractors into suggestions', () => {
    const parsed = parseLessonReviewItems([
      'The Russian word кни́га means book. Here are the spelling rules.',
      '| Case | Masculine | Feminine |',
      '|---|---|---|',
      '| Nominative | новый | новая |',
      block('quiz', { question: 'Choose', options: ['книгы', 'книги'], answer: 1 }),
    ].join('\n'));
    expect(parsed).toEqual({ items: [], diagnostics: [] });
  });

  it('uses a reviewed inventory for lexical capture without losing authored words or rule identities', () => {
    const markdown = [
      block('vocab-inventory', { mode: 'explicit' }),
      '## Pronunciation',
      '- **casa** (kah-zah) — house',
      '- **ã** — nasal "ah": **maçã** (mah-sah) — apple',
      '- **Initial R / RR** — sounds like English "h": **rio** (hee-oo) — river',
      '- **Don\'t pronounce H** — "hotel" is (oh-TEW), not "ho-tel"',
      '| Spelling | English sound |',
      '|---|---|',
      '| **h** | pronounced, as in hotel |',
      block('vocab-card', { ...vocab, id: 'house', word: 'casa', reading: 'kah-zah', meaning: 'house' }),
      block('vocab-card', { ...vocab, id: 'grandmother', word: 'avó', meaning: 'grandmother' }),
      block('vocab-card', { ...vocab, id: 'article', word: 'a', meaning: 'the (feminine singular)' }),
      block('vocab-card', { ...vocab, id: 'one', word: 'um', meaning: 'one', priority: 'optional' }),
      block('grammar-card', grammar),
      block('grammar-card', { ...grammar, id: 'sound-rule', kind: 'rule' }),
    ].join('\n');
    const parsed = parseLessonReviewItems(markdown);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.items.map((item) => item.id)).toEqual([
      'house', 'grandmother', 'article', 'one', grammar.id, 'sound-rule',
    ]);
    expect(parsed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'article', kind: 'vocabulary', word: 'a', provenance: 'authored' }),
      expect.objectContaining({ id: 'one', kind: 'vocabulary', word: 'um', priority: 'optional' }),
      expect.objectContaining({ id: grammar.id, kind: 'concept', prompt: grammar.example, answer: grammar.answer }),
      expect.objectContaining({ id: 'sound-rule', kind: 'rule', prompt: grammar.example, answer: grammar.answer }),
    ]));
    const candidates = parseLessonCandidates(markdown);
    expect(candidates.map((item) => item.id)).toEqual(['house', 'grandmother', 'article', 'one']);
    expect(candidates[0]).toMatchObject({ sourceText: 'casa (kah-zah) — house', reading: 'kah-zah' });
  });

  it('supports an intentionally empty lexical inventory while retaining authored and legacy rules', () => {
    const legacy = { rule: 'A sound rule', example: 'A ___ prompt', answer: 'focused', explanation: 'A useful explanation.' };
    const rules = [block('grammar-card', grammar), block('grammar-card', legacy)].join('\n');
    const markdown = [
      block('vocab-inventory', { mode: 'explicit' }),
      '- **ã** — nasal "ah": **maçã** (mah-sah) — apple',
      '| Spelling | English sound |',
      '|---|---|',
      '| **h** | pronounced, as in hotel |',
      block('quiz', { question: 'Choose', options: ['casa', 'caso'], answer: 0 }),
      rules,
    ].join('\n');
    expect(parseLessonReviewItems(markdown)).toEqual(parseLessonReviewItems(rules));
    expect(parseLessonCandidates(markdown)).toEqual([]);
  });

  it('retains the legacy formatting fallback in partially authored lessons with no inventory control', () => {
    const markdown = [
      block('vocab-card', vocab),
      '- **ла́мпа** — lamp',
      '| Word | Meaning |',
      '|---|---|',
      '| a | the (feminine singular) |',
    ].join('\n');
    expect(parseLessonReviewItems(markdown)).toMatchObject({
      diagnostics: [],
      items: [
        expect.objectContaining({ id: vocab.id, provenance: 'authored' }),
        expect.objectContaining({ id: 'formatting:ла́мпа::lamp', priority: 'optional', provenance: 'formatting' }),
        expect.objectContaining({ word: 'a', priority: 'optional', provenance: 'formatting' }),
      ],
    });
    expect(parseLessonCandidates(markdown).map((item) => item.word)).toEqual(['кни́га', 'ла́мпа', 'a']);
  });

  it.each([
    ['unknown mode', '<!-- vocab-inventory: {"mode":"automatic"} -->', 'invalid-metadata'],
    ['unknown property', '<!-- vocab-inventory: {"mode":"explicit","complete":true} -->', 'invalid-metadata'],
    ['missing mode', '<!-- vocab-inventory: {} -->', 'invalid-metadata'],
    ['malformed JSON', '<!-- vocab-inventory: {bad json} -->', 'invalid-json'],
    ['non-object JSON', '<!-- vocab-inventory: null -->', 'invalid-metadata'],
    ['missing colon', '<!-- vocab-inventory {"mode":"explicit"} -->', 'invalid-metadata'],
    ['multiple lines', '<!-- vocab-inventory:\n{"mode":"explicit"}\n-->', 'invalid-metadata'],
    ['unclosed comment', '<!-- vocab-inventory: {"mode":"explicit"}', 'unterminated-block'],
  ])('reports %s instead of silently accepting a zero inventory', (_name, control, code) => {
    const markdown = `- **casa** — house\n${control}`;
    expect(parseLessonReviewItems(markdown)).toMatchObject({
      items: [expect.objectContaining({ word: 'casa', provenance: 'formatting' })],
      diagnostics: [expect.objectContaining({ block: 'vocab-inventory', code, line: 2 })],
    });
    expect(parseLessonCandidates(markdown).map((item) => item.word)).toEqual(['casa']);
  });

  it.each([
    '<!-- vocab-inventory: {"mode":"explicit"} -->',
    '<!-- vocab-inventory: {"mode":"automatic"} -->',
    '<!-- vocab-inventory: {bad json} -->',
  ])('rejects duplicate or conflicting inventory controls, including malformed duplicates: %s', (second) => {
    const markdown = [
      '- **casa** — house',
      block('vocab-inventory', { mode: 'explicit' }),
      second,
    ].join('\n');
    const parsed = parseLessonReviewItems(markdown);
    expect(parsed.items).toEqual([expect.objectContaining({ word: 'casa', provenance: 'formatting' })]);
    expect(parsed.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ block: 'vocab-inventory', line: 3, message: expect.stringMatching(/only one|duplicate/i) }),
    ]));
    expect(parseLessonCandidates(markdown).map((item) => item.word)).toEqual(['casa']);
  });

  it.each(['```html', '~~~~html'])('does not activate inventory examples inside %s fences', (fence) => {
    const markdown = [
      fence,
      block('vocab-inventory', { mode: 'explicit' }),
      fence.replace('html', ''),
      '- **casa** — house',
    ].join('\n');
    expect(parseLessonReviewItems(markdown)).toMatchObject({
      items: [expect.objectContaining({ word: 'casa', provenance: 'formatting' })],
      diagnostics: [],
    });
    expect(parseLessonCandidates(markdown).map((item) => item.word)).toEqual(['casa']);
  });

  it('reports malformed lexical cards even when an explicit inventory intentionally disables fallback', () => {
    const parsed = parseLessonReviewItems([
      block('vocab-inventory', { mode: 'explicit' }),
      block('vocab-card', { ...vocab, meaning: null }),
      '- **casa** — house',
    ].join('\n'));
    expect(parsed).toMatchObject({
      items: [],
      diagnostics: [expect.objectContaining({ block: 'vocab-card', code: 'invalid-metadata', itemId: vocab.id })],
    });
  });

  it('removes both metadata kinds before display without removing ordinary prose', () => {
    const markdown = ['# Lesson', block('vocab-card', vocab), 'An example.', block('grammar-card', grammar)].join('\n');
    expect(stripLessonReviewSources(markdown)).toBe('# Lesson\n\nAn example.\n');
  });

  it('strips valid and malformed inventory controls from display, but preserves fenced authoring examples', () => {
    const example = ['~~~html', block('vocab-inventory', { mode: 'explicit' }), '~~~'].join('\n');
    const markdown = [
      '# Lesson',
      block('vocab-inventory', { mode: 'explicit' }),
      '<!-- vocab-inventory: {bad json} -->',
      example,
      'An example.',
    ].join('\n');
    expect(stripLessonReviewSources(markdown)).toBe(`# Lesson\n\n\n${example}\nAn example.`);
  });
});

describe('looksLikeSentence', () => {
  it('recognises terminal punctuation and long phrases', () => {
    expect(looksLikeSentence('私は学生です。')).toBe(true);
    expect(looksLikeSentence('Eu gosto muito de música')).toBe(true);
  });

  it('treats short phrases as words', () => {
    expect(looksLikeSentence('băiat bun')).toBe(false);
    expect(looksLikeSentence('猫')).toBe(false);
  });
});

describe('provenance', () => {
  it('always tags the originating lesson', () => {
    expect(captureTags('particles-wa-ga', false)).toEqual(['grammar', 'lesson:particles-wa-ga']);
    expect(captureTags('particles-wa-ga', true)).toContain('sentence');
  });

  it('reads the lesson back off a saved word', () => {
    expect(lessonIdFromTags(['grammar', 'lesson:ser-estar'])).toBe('ser-estar');
    expect(lessonIdFromTags(['grammar'])).toBeNull();
    expect(lessonIdFromTags(undefined)).toBeNull();
  });

  it('renders a lesson id readably', () => {
    expect(humanizeLessonId('particles-wa-ga')).toBe('Particles wa ga');
  });
});
