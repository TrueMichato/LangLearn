import { describe, expect, it } from 'vitest';
import index from '../../public/content/grammar/ro/index.json';
import { reviewed } from '../lib/grammar-reviewed/ro';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { readLessonReviewBlocks, type GrammarReviewItem } from '../lib/lesson-review';
import { lessonHeadings, validateReviewItemQuality } from './helpers/grammar-retention';

// Inventories and the legacy baseline already gate every Romanian lesson in
// grammar-retention-catalog.test.ts; this file adds what "reviewed" promises.
const assets = import.meta.glob('../../public/content/grammar/ro/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;
const rawFiles = import.meta.glob([
  '../../public/content/grammar/ro/*.md',
  '../../public/content/grammar/ro/index.json',
  './fixtures/grammar-retention/ro-core-01.json',
  './fixtures/grammar-retention/ro-advanced-02.json',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const lesson = (id: string) => assets[`../../public/content/grammar/ro/${id}.md`];
const published = index.toSorted((a, b) => a.order - b.order).map(({ id }) => id);
const listed = [...reviewed];

function grammar(markdown: string) {
  return parseLessonReviewItems(markdown).items.filter((item): item is GrammarReviewItem => item.kind !== 'vocabulary');
}

const fold = (text: string, stripDiacritics = false) => {
  const lower = text.normalize('NFC').toLowerCase().replace(/\s+/gu, ' ');
  return stripDiacritics ? lower.normalize('NFD').replace(/\p{M}/gu, '') : lower;
};
const plain = (text: string, stripDiacritics = false) => fold(text, stripDiacritics).replace(/[\s.!?;:,…]+$/u, '').trim();
const tokens = (text: string): string[] => fold(text).match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu) ?? [];
const front = (card: GrammarReviewItem) => `${card.prompt}\n${card.hint}`;
const describeCard = (card: GrammarReviewItem) => `"${card.prompt}" → "${card.answer}"`;

/**
 * Whether `text` shows `answer`. Case never matters, and neither do diacritics
 * once the answer has four letters (fata gives away fată); a shorter answer keeps
 * them, or every English "in" would show în. A whole match stands alone, though a
 * hyphen separates clitics (n-am shows am) and an apostrophe doesn't (o'clock).
 */
function shows(text: string, answer: string, whole: boolean): boolean {
  const strip = plain(answer).replace(/[^\p{L}\p{N}]/gu, '').length >= 4;
  const target = plain(answer, strip);
  const shown = fold(text, strip);
  if (!target) return false;
  if (!whole && strip) return shown.includes(target);
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}]['’]?)${escaped}(?!['’]?[\\p{L}\\p{N}])`, 'u').test(shown);
}

// A longer answer also leaks inside a bigger word (citi in citim); a bare yes/no
// is a verdict, and "no" in an English question gives nothing away.
const answerOnFront = (card: GrammarReviewItem) => !/^(?:yes|no)$/.test(plain(card.answer))
  && shows(front(card), card.answer, false);

const NON_TEACHING_SECTION =
  /\b(?:summary|sources?|quiz(?:zes)?|practice|review|recap|cheat ?sheet|reference|exercises?|overview|at a glance|key (?:points|takeaways))\b/i;

function ruleCardErrors(card: GrammarReviewItem, cards: readonly GrammarReviewItem[], sections: readonly string[]): string[] {
  const errors: string[] = [];
  if (card.kind !== 'concept' || card.format !== 'qa') errors.push(`${card.id}: rule card must be concept + qa`);
  if (!plain(card.answer)) errors.push(`${card.id}: rule card has an empty answer`);
  else if (answerOnFront(card)) errors.push(`${card.id}: answer appears on the front ${describeCard(card)}`);
  if (!sections.includes(card.sourceSection)) errors.push(`${card.id}: sourceSection "${card.sourceSection}" is not a lesson heading`);
  else if (NON_TEACHING_SECTION.test(card.sourceSection)) {
    errors.push(`${card.id}: sourceSection "${card.sourceSection}" is not a section that teaches the rule`);
  }
  // English homographs (a, am, are, care) count too: on the current fronts they
  // were Romanian (Ea a citit, N-am, fata care) in 8 of 9 collisions.
  for (const other of cards) {
    const answer = tokens(other.answer);
    if (other.id !== card.id && other.format === 'cloze' && answer.length === 1 && shows(front(card), answer[0], true)) {
      errors.push(`${card.id}: front shows "${answer[0]}", the answer of cloze ${other.id} ${describeCard(card)}`);
    }
  }
  return errors;
}

// Interpretation, translation and application belong to kind "rule"; a reviewed
// concept card is labelled "Recall the rule" and spaced 2×, so its prompt must
// ask for the rule itself (trigger → rule, example → reason, or a contrast).
const APPLICATION_PROMPTS: readonly (readonly [RegExp, string])[] = [
  [/^\s*(?:translate|complete|fill|supply|insert|conjugate|decline|rewrite|transform|put|turn|change|make|form|give|write|say|choose|pick|select|use)\b/i,
    'imperative task rather than a recall question'],
  [/_{2,}/, 'blank to fill'],
  [/\btranslate\b|\btranslation of\b/i, 'translation request'],
  [/\bhow (?:do|would|can|could|should|might) (?:you|i|we|one|a learner|learners|someone) (?:say|express|translate|write|ask|tell)\b/i,
    '"how do you say" request'],
  [/\binterpret(?:s|ed|ing|ation)?\b/i, 'interpretation request'],
  [/\b(?:which|what) (?:romanian |english )?(?:words?|expressions?|phrases?|terms?) (?:means?|conveys?|names?|express(?:es)?|translates?|corresponds? to)\b/i,
    'translation request (meaning → word)'],
  [/\bwhat (?:full|longer|shorter|short|contracted|uncontracted|complete) (?:form|expression|version)\b/i,
    'asks to expand or produce a form'],
  [/\bwhat (?:is|are) the\b[^?]*?\bforms? of\b|\bwhat is the (?:correct |right |missing )?form\b/i, 'asks to produce a form'],
  [/\bwhich forms? (?:is |are )?(?:used for|completes?|fits?|goes|belongs?)\b/i, 'asks which form fits'],
  [/\bhow (?:does|do) [^?]+? (?:change|become)\b/i, 'asks to transform a form'],
  [/\b[Ww]ho (?:is|was|does|did|will)\b[^?]*\bin \p{Lu}/u, 'comprehension of an example sentence'],
  [/\bwhich (?:event|action|thing) (?:happened|happens|came|comes|occurred|took place) (?:first|earlier|last)\b/i,
    'comprehension of an example sentence'],
  [/\bhow should .+? be punctuated\b|\bwhere (?:does|do|should) (?:a|the) (?:comma|question mark|full stop|period|dash)e?s? [^?]*\bgo in\b/i,
    'asks to punctuate an example'],
];
// "What does X mean / say about …" interprets a Romanian form or sentence; a lone
// lowercase English term ("What does enclitic mean for …", "the supine") is recall.
const MEANING_OF = /\bwhat (?:does|do) (.+?) (?:mean|say about|imply|tell (?:you|us) about)\b(.*)/i;

function applicationPrompt(prompt: string): string | undefined {
  const meaning = MEANING_OF.exec(prompt);
  if (meaning && (/^\s*in\b/i.test(meaning[2]) || !/^(?:the )?[a-z-]+$/.test(meaning[1]))) return 'asks what a Romanian form or sentence means';
  return APPLICATION_PROMPTS.find(([pattern]) => pattern.test(prompt))?.[1];
}

function conceptCardErrors(card: GrammarReviewItem): string[] {
  if (card.kind !== 'concept') return [];
  const errors: string[] = [];
  if (card.format !== 'qa') errors.push(`${card.id}: concept card must be qa ${describeCard(card)}`);
  const application = applicationPrompt(card.prompt);
  if (application) errors.push(`${card.id}: not declarative recall (${application}) ${describeCard(card)}`);
  if (answerOnFront(card)) errors.push(`${card.id}: answer appears on the front ${describeCard(card)}`);
  return errors;
}

function itemErrors(markdown: string): string[] {
  const { items, diagnostics } = parseLessonReviewItems(markdown);
  const errors = diagnostics.map((diagnostic) => `${diagnostic.code} at line ${diagnostic.line}: ${diagnostic.message}`);
  const inventory = readLessonReviewBlocks(markdown, 'vocab-inventory');
  if (inventory.items.length !== 1 || inventory.diagnostics.length) errors.push('lesson must declare exactly one valid vocab-inventory');
  const sections = lessonHeadings(markdown);
  for (const item of items) {
    if (item.provenance !== 'authored') errors.push(`${item.id}: provenance is ${item.provenance}, not authored`);
    if (!sections.includes(item.sourceSection)) errors.push(`${item.id}: sourceSection "${item.sourceSection}" is not a lesson heading`);
    errors.push(...validateReviewItemQuality(item));
  }
  return errors;
}

const CEDILLA = /[\u015E\u015F\u0162\u0163]|[STst]\u0327/u;

function cedillaErrors(path: string, text: string): string[] {
  return text.split('\n').flatMap((line, i) => CEDILLA.test(line)
    ? [`${path}:${i + 1}: cedilla ş/ţ instead of comma-below ș/ț: ${line.trim().slice(0, 120)}`] : []);
}

function esteRegisterErrors(card: GrammarReviewItem | undefined): string[] {
  if (!card) return ['este-e-register is missing'];
  const back = `${card.answer}\n${card.explanation}`;
  const errors: string[] = [];
  if (!/\beste\b/i.test(back)) errors.push('este-e-register: the back must name the full form este');
  if (!/\b(?:alternative|also|both|equally|valid)\b/i.test(back)) errors.push('este-e-register: the back must present e as an alternative');
  if (!/\b(?:everyday|common|speech|spoken|informal|conversation(?:al)?)\b/i.test(back)) {
    errors.push('este-e-register: the back must say e is everyday usage');
  }
  if (/\b(?:is|it's|counts as|would be) (?:an? |always )?(?:error|mistake|wrong|incorrect)\b/i.test(back)) {
    errors.push('este-e-register: the back must not call e an error');
  }
  return errors;
}

const REGISTER_CUE = /\b(?:formal|written|writing|full form|long form|careful)\b/i;
const acceptsShortE = (text: string) => /(?<![\p{L}\p{N}])e(?![\p{L}\p{N}])/u.test(text) && /\b(?:also|too|alternative|equally|both)\b/i.test(text);

function esteClozeErrors(cards: readonly GrammarReviewItem[]): string[] {
  return cards.filter((card) => card.format === 'cloze' && plain(card.answer) === 'este'
    && !REGISTER_CUE.test(front(card)) && !acceptsShortE(card.explanation))
    .map((card) => `${card.id}: expects este with no register cue on the front and no acceptance of e ${describeCard(card)}`);
}

describe('Romanian reviewed grammar', () => {
  it('lists only published lessons, once each, in published order', () => {
    expect(listed.filter((id) => !published.includes(id))).toEqual([]);
    expect(listed.filter((id) => !lesson(id))).toEqual([]);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed).toEqual(published.filter((id) => listed.includes(id)));
  });

  it('uses comma-below ș/ț, never cedilla ş/ţ, across the catalog and its inventories', () => {
    expect(Object.keys(rawFiles)).toHaveLength(published.length + 3);
    expect(Object.entries(rawFiles).flatMap(([path, text]) => cedillaErrors(path, text))).toEqual([]);
  });

  it('present-a-fi-avea keeps este-e-register, which accepts everyday e beside este', () => {
    expect(esteRegisterErrors(grammar(lesson('present-a-fi-avea')).find((card) => card.id === 'este-e-register'))).toEqual([]);
  });

  it.skipIf(!listed.includes('present-a-fi-avea'))('present-a-fi-avea never marks everyday e wrong in a cloze expecting este', () => {
    expect(esteClozeErrors(grammar(lesson('present-a-fi-avea')))).toEqual([]);
  });

  // Vitest rejects a suite with no tests, which is what it.each([]) collects.
  describe.skipIf(!listed.length)('each listed lesson', () => {
    it.each(listed)('%s: parses cleanly with one explicit vocab inventory and every item under a real heading', (id) => {
      expect(itemErrors(lesson(id))).toEqual([]);
    });

    it.each(listed)('%s: rule-* cards are concept recall that hides its answer and sits in a teaching section', (id) => {
      const markdown = lesson(id);
      const cards = grammar(markdown);
      const sections = lessonHeadings(markdown);
      expect(cards.filter((card) => card.id.startsWith('rule-'))
        .flatMap((card) => ruleCardErrors(card, cards, sections))).toEqual([]);
    });

    it.each(listed)('%s: concept cards are declarative qa recall with the answer off the front', (id) => {
      const cards = grammar(lesson(id));
      expect([...cards.flatMap(conceptCardErrors), ...esteClozeErrors(cards)]).toEqual([]);
    });
  });

  describe('the checks fire on bad cards', () => {
    const cards = grammar(lesson('present-a-fi-avea'));
    const base = cards.find((card) => card.id === 'este-e-register')!;
    const sections = lessonHeadings(lesson('present-a-fi-avea'));
    const rule: GrammarReviewItem = {
      ...base, id: 'rule-age-verb', sourceSection: 'Age Uses a avea',
      prompt: 'Which verb states age in Romanian?', hint: '', answer: 'a avea',
    };

    it('accepts a well-formed rule card', () => {
      expect(ruleCardErrors(rule, cards, sections)).toEqual([]);
      expect(conceptCardErrors(rule)).toEqual([]);
    });

    it('rejects a rule card whose answer is planted in the hint, ignoring case and diacritics', () => {
      expect(ruleCardErrors({ ...rule, hint: 'Think of A AVEA.' }, cards, sections)).toEqual([
        expect.stringContaining('rule-age-verb: answer appears on the front'),
      ]);
      expect(conceptCardErrors({ ...rule, answer: 'Cântă.', prompt: 'Why is it cânta in El canta?' }))
        .toEqual([expect.stringContaining('answer appears on the front')]);
    });

    it('rejects a rule card that is not concept qa, under a non-teaching or missing heading, or showing a cloze answer', () => {
      expect(ruleCardErrors({ ...rule, kind: 'rule' }, cards, sections)).toEqual(['rule-age-verb: rule card must be concept + qa']);
      expect(ruleCardErrors({ ...rule, sourceSection: 'Sources' }, cards, sections))
        .toEqual(['rule-age-verb: sourceSection "Sources" is not a section that teaches the rule']);
      expect(ruleCardErrors({ ...rule, sourceSection: 'Age' }, cards, sections))
        .toEqual(['rule-age-verb: sourceSection "Age" is not a lesson heading']);
      const cloze = cards.find((card) => card.format === 'cloze' && card.answer === 'ești')!;
      expect(ruleCardErrors({ ...rule, prompt: 'Why is it Tu ești acasă with a fi?' }, cards, sections))
        .toEqual([expect.stringContaining(`front shows "ești", the answer of cloze ${cloze.id}`)]);
      expect(ruleCardErrors({ ...rule, prompt: 'Which verb is in El are o carte?' }, cards, sections))
        .toEqual([expect.stringContaining('front shows "are"')]);
    });

    it('matches short answers whole and with their diacritics, longer ones without', () => {
      expect(shows('Which case is used in this phrase?', 'în', true)).toBe(false);
      expect(shows('What full form does N-am înțeles represent?', 'am', true)).toBe(true);
      expect(shows("Which hour is one o'clock?", 'o', true)).toBe(false);
      expect(shows('Why is it fata here?', 'fată', true)).toBe(true);
      expect(shows('How does citim end?', 'citi', true)).toBe(false);
      expect(shows('How does citim end?', 'citi', false)).toBe(true);
    });

    it('flags interpretation and translation prompts in concept cards but not rule recall', () => {
      for (const prompt of [
        'Translate: Ea e acasă.', 'What does Am putea pleca acum mean?', 'What does e mean in Ea e acasă?',
        'How do you say I am tired?', 'Which form completes Tu ___ acasă?', 'What are the noi and voi forms of a citi?',
        'How should a learner interpret Dacă aveam bani?', 'Which Romanian word means shop?',
        'Who is working in Lucrând împreună, terminăm?',
      ]) expect(applicationPrompt(prompt), prompt).toBeDefined();
      for (const prompt of [
        'What does the presumptive express?', 'Why is it ești in Tu ești acasă?', 'What does enclitic mean for the article?',
        'Which verb expresses age in Romanian?', 'Must Mă numesc Ana be translated as I call myself Ana?',
        'What changes when Nu beau cafea niciodată becomes Niciodată nu beau cafea?', 'What does the supine mean for purpose?',
      ]) expect(applicationPrompt(prompt), prompt).toBeUndefined();
      expect(conceptCardErrors({ ...base, prompt: 'Translate: Ea e acasă.' }))
        .toEqual([expect.stringContaining('este-e-register: not declarative recall (imperative task')]);
      expect(conceptCardErrors({ ...base, format: 'cloze' })).toEqual([expect.stringContaining('concept card must be qa')]);
    });

    it('flags cedilla ş/ţ, precomposed or combining, but not comma-below ș/ț', () => {
      expect(cedillaErrors('x.md', 'Aici\nŞtiu că ţara e frumoasă')).toEqual([expect.stringContaining('x.md:2:')]);
      expect(cedillaErrors('x.md', 'pas\u0327i')).toHaveLength(1);
      expect(cedillaErrors('x.md', 'Știu că țara e frumoasă. Așa')).toEqual([]);
    });

    it('rejects an este-e-register that calls e an error, and an unqualified este cloze', () => {
      expect(esteRegisterErrors({ ...base, answer: 'It is an error; write este.', explanation: '' }))
        .toEqual(expect.arrayContaining(['este-e-register: the back must not call e an error']));
      expect(esteRegisterErrors(undefined)).toEqual(['este-e-register is missing']);
      const cloze: GrammarReviewItem = { ...base, id: 'ea-este', kind: 'rule', format: 'cloze', prompt: 'Ea ___ acasă.', answer: 'este', explanation: 'Third person singular.' };
      expect(esteClozeErrors([cloze])).toEqual([expect.stringContaining('ea-este: expects este')]);
      expect(esteClozeErrors([{ ...cloze, hint: 'Use the full form.' }])).toEqual([]);
      expect(esteClozeErrors([{ ...cloze, explanation: 'Este is the full form; everyday e is also correct.' }])).toEqual([]);
    });
  });
});
