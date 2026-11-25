import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import GrammarCard from '../components/srs/GrammarCard';
import LessonReviewEditor, { LessonReviewPreview } from '../components/grammar/LessonReviewEditor';
import type { GrammarReviewItem, VocabularyReviewItem } from '../lib/lesson-review';
import type { Word } from '../db/schema';
import pluralsLesson from '../../public/content/grammar/ar/plurals.md?raw';
import aspectLesson from '../../public/content/grammar/ru/verb-aspects.md?raw';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import { fillBlank } from '../lib/grammar-cards';
import { lessonSourceSnapshot } from '../lib/card-identity';
import { ReviewCardDirection } from '../pages/Review';
import type { QueueItem } from '../stores/reviewStore';

const concept: GrammarReviewItem = {
  id: 'form-i', kind: 'concept', source: 'grammar-card', provenance: 'authored',
  priority: 'essential', sourceSection: 'Form I', format: 'qa',
  prompt: 'Can every Form I maṣdar be predicted from its verb?',
  answer: 'No — Form I maṣdars are learned individually, with their verbs.',
  explanation: 'دَرَسَ → دِرَاسَةٌ is one lexical pair.', rule: 'Form I is not universally predictable',
  hint: '', legacyAliases: [],
};
const word: Word = {
  language: 'ar', word: concept.answer, reading: '', meaning: concept.explanation,
  contextSentence: concept.prompt, grammarRule: concept.rule, type: 'grammar',
  grammarKind: 'concept', grammarFormat: 'qa', tags: ['grammar', 'lesson:fixture-unreviewed'],
  createdAt: '2026-11-15T10:00:00.000Z', sourceTextId: null,
};

const renderCard = (value: Word, isFlipped = false, writing = false) => renderToStaticMarkup(
  <GrammarCard word={value} isFlipped={isFlipped} onFlip={() => {}} writing={writing} onWritingChange={() => {}} />,
);
const plain = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'");

describe('lesson review previews and normal grammar review', () => {
  it('keeps conceptual answers hidden on the front and preserves English Q&A verbatim on the back', () => {
    const front = renderCard(word);
    expect(front).toContain(concept.prompt);
    expect(front).not.toContain(concept.answer);
    expect(front).not.toContain(concept.explanation);
    expect(front).toContain('dir="ltr"');
    expect(front).toMatch(/<\/p>[\s\S]*<button[^>]*>Reveal answer<\/button>/);
    expect(front).not.toContain('role="button"');
    const back = renderCard(word, true);
    expect(back).toContain(concept.prompt);
    expect(back).toContain(concept.answer);
    expect(back).toContain(concept.explanation);
    expect(back).toMatch(/<details><summary[^>]*>More about the rule/);
  });

  it('does not interpret blanks inside explicit Q&A as a cloze', () => {
    const qa = { ...word, contextSentence: 'What does ___ represent in these examples?' };
    const front = renderCard(qa);
    expect(front).toContain(qa.contextSentence);
    const back = renderCard(qa, true);
    expect(back).toContain(qa.contextSentence);
    expect(back).not.toContain('<strong');
    expect(back).not.toContain(`What does ${concept.answer}`);
    expect(back).toContain(concept.answer);
  });

  it('fills Arabic cloze examples in the target direction and leaves English explanations LTR', () => {
    const cloze = {
      ...word, grammarKind: 'rule' as const, grammarFormat: 'cloze' as const,
      contextSentence: 'دَرَسَ → ___', word: 'دِرَاسَةٌ', meaning: 'Learn the maṣdar alongside the verb.',
    };
    const front = renderCard(cloze);
    expect(front).toContain('dir="rtl"');
    expect(front).toContain(cloze.contextSentence);
    const back = renderCard(cloze, true);
    expect(back).toMatch(/dir="rtl">دَرَسَ → <strong[^>]*>دِرَاسَةٌ<\/strong>/);
    expect(back).toContain(`dir="ltr">${cloze.meaning}</p>`);
  });

  it('previews word/phrase meanings and genuine target-language context without changing their type', () => {
    const vocabulary: VocabularyReviewItem = {
      id: 'study', kind: 'vocabulary', source: 'vocab-card', priority: 'essential', provenance: 'authored',
      sourceSection: 'Form I', word: 'دِرَاسَةٌ', reading: 'dirāsatun', meaning: 'studying; study',
      contextSentence: 'أُحِبُّ الدِّرَاسَةَ.', isSentence: false, sourceText: '',
    };
    const html = renderToStaticMarkup(<LessonReviewPreview item={vocabulary} language="ar" />);
    expect(html).toContain('Front');
    expect(html).toContain('Back');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(vocabulary.meaning);
    expect(html).toContain(vocabulary.contextSentence);
  });

  it('reveals the real Arabic sound feminine plural without filling a Latin transliteration with Arabic', () => {
    const parsed = parseLessonReviewItems(pluralsLesson);
    expect(parsed.diagnostics).toEqual([]);
    const item = parsed.items.find((candidate) => candidate.id === 'sound-feminine-teachers');
    if (!item || item.kind === 'vocabulary') throw new Error('Missing sound feminine plural rule');
    expect(fillBlank(item.prompt, item.answer)).toBe('Complete “female teachers”: مُعَلِّمَاتٌ.');
    const cloze: Word = {
      ...word, word: item.answer, reading: item.hint, meaning: item.explanation,
      contextSentence: item.prompt, grammarRule: item.rule, grammarKind: item.kind,
      grammarFormat: item.format, tags: ['grammar', 'lesson:plurals'],
    };
    const front = renderCard(cloze);
    expect(front).not.toContain('muʿallim');
    expect(front).not.toContain('مُعَلِّمَاتٌ');
    const back = renderCard(cloze, true);
    expect(plain(back)).toContain('Complete “female teachers”: مُعَلِّمَاتٌ.');
    expect(back).toContain('muʿallimātun');
    expect(back).not.toContain('muʿallimَاتٌ');
  });

  it('keeps only the task label for grammar, and the remembered lexical direction on the next vocabulary card', () => {
    const render = (cardType: QueueItem['cardType'], value: Word) => renderToStaticMarkup(
      <ReviewCardDirection current={{ cardType, word: value, review: { wordId: 1, repetitions: 0, ease: 2.5, interval: 0, nextReviewDate: '', lastReviewDate: '' } }}
        mode="meaning-to-word" disabled={false} onChange={() => {}} />,
    );
    expect(plain(render('grammar', word))).toBe('Recall the concept');
    const pilotConcept = { ...word, language: 'ru', tags: ['grammar', 'lesson:spelling-rules'],
      lessonSource: { lessonId: 'spelling-rules', itemId: 'seven-letter-scope', provenance: 'authored' as const } };
    expect(plain(render('grammar', pilotConcept))).toBe('Recall the rule');
    expect(plain(render('grammar', { ...pilotConcept, grammarKind: 'rule' }))).toBe('Answer the question');
    expect(plain(render('grammar', { ...pilotConcept, lessonSource: undefined }))).toBe('Recall the concept');
    expect(plain(render('grammar', {
      ...pilotConcept, tags: ['grammar', 'lesson:fixture-unreviewed'],
      lessonSource: { ...pilotConcept.lessonSource, lessonId: 'fixture-unreviewed' },
    }))).toBe('Recall the concept');
    expect(plain(render('grammar', { ...word, grammarFormat: undefined, contextSentence: 'Eu ___ aqui.' }))).toBe('Complete the blank');
    expect(plain(render('reverse', { ...word, type: 'word' }))).toContain('Meaning → Word · Change direction');
  });

  it('presents the same finished-book prompt, highlighted model and first reason in the picker and in Review', () => {
    const item = parseLessonReviewItems(aspectLesson).items.find((candidate) => candidate.id === 'finished-book');
    if (!item || item.kind === 'vocabulary') throw new Error('Missing finished-book rule');
    const saved: Word = {
      ...word, language: 'ru', contextSentence: item.prompt, word: item.answer, reading: item.hint,
      grammarRule: item.rule, grammarFormat: item.format, grammarKind: item.kind, meaning: item.explanation,
      tags: ['grammar', 'lesson:verb-aspects'], lessonSource: { lessonId: 'verb-aspects', itemId: item.id, provenance: item.provenance },
    };
    saved.lessonSourceSnapshot = lessonSourceSnapshot(saved);
    const front = renderCard(saved), back = renderCard(saved, true);
    const preview = renderToStaticMarkup(<LessonReviewPreview item={item} language="ru" lessonId="verb-aspects" />);
    expect(plain(front)).toContain(item.prompt);
    expect(plain(front)).not.toContain(item.answer);
    for (const html of [back, preview]) {
      expect(html).toMatch(/Анна <strong[^>]*>прочитала<\/strong> всю книгу\./);
      expect(plain(html)).toContain(item.explanation);
      expect(plain(html).indexOf(item.explanation)).toBeLessThan(plain(html).indexOf('More about the rule'));
    }
    expect(plain(preview)).toContain(item.prompt);
    expect(item.hint).toBeTruthy();
    for (const html of [front, preview]) {
      expect(plain(html.match(/<details>.*?<\/details>/s)?.[0] ?? '')).toBe(`Show a hint${item.hint}`);
    }
    expect(front).toContain('Say or think');
    expect(front).not.toContain('<textarea');
  });

  it('keeps unmarked legacy cues visible after the prompt and distributes mixed-script blanks without duplicating the raw answer', () => {
    const old = {
      ...word, grammarFormat: undefined, contextSentence: 'الطَّالِبَةُ ___ (aṭ-ṭālibatu ___).', reading: 'sitting (f.)',
      word: 'جَالِسَةٌ (jālisatun)',
    };
    const front = renderCard(old, false, true), back = renderCard(old, true);
    expect(front.indexOf(old.contextSentence)).toBeLessThan(front.indexOf(old.reading));
    expect(front).toContain(old.reading);
    expect(front).not.toMatch(/<details|<textarea|Type an answer/);
    expect(back).toMatch(/الطَّالِبَةُ <strong[^>]*>جَالِسَةٌ<\/strong> \(aṭ-ṭālibatu <strong[^>]*>jālisatun<\/strong>\)\./);
    expect(back).not.toContain(old.word);
  });

  it('does not collapse the old authored spelling primer or an edited or unverifiable cue in a pilot lesson', () => {
    const old: Word = { ...word, language: 'ru', tags: ['grammar', 'lesson:spelling-rules'], contextSentence: 'Хоро́шие ___ лежа́т на по́лке.',
      lessonSource: { lessonId: 'spelling-rules', itemId: 'seven-letter-plural', provenance: 'authored' },
      grammarFormat: 'cloze', reading: 'кни́га → plural' };
    old.lessonSourceSnapshot = lessonSourceSnapshot(old);
    for (const saved of [old, { ...old, reading: 'My personal cue' }, { ...old, reading: 'Needed cue', lessonSourceSnapshot: undefined }]) {
      const front = renderCard(saved);
      expect(front).not.toContain('<details');
      expect(front).toContain(saved.reading);
    }
  });

  it('retains an old rule-as-question but never uses the model itself as both question and answer', () => {
    const personal = { ...word, contextSentence: '', tags: [], grammarRule: 'My question about هذا?', word: 'My own answer' };
    expect(renderCard(personal)).toContain(personal.grammarRule);
    expect(renderCard(personal, true)).toContain(personal.word);
    expect(renderCard({ ...personal, grammarRule: personal.word })).not.toContain(personal.word);
  });

  it('provides a small labeled offline editor and an explicit preview, not a second dialog', () => {
    const html = renderToStaticMarkup(<LessonReviewEditor item={concept} language="ar"
      onCommit={() => {}} onCancel={() => {}} />);
    expect(html).toContain('Question and answer');
    expect(html).toContain('Fill in the blank');
    expect(html).toContain('Explanation (optional)');
    expect(html).toContain('Use this item');
    expect(html).toContain('Nothing is saved until you confirm Save');
    expect(html).not.toContain('role="dialog"');
  });
});
