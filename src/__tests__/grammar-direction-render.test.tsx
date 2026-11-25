import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import formLesson from '../../public/content/grammar/ar/form-ii-iii.md?raw';
import LessonCaptureModal from '../components/grammar/LessonCaptureModal';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import type { GrammarReviewItem, LessonReviewItem, VocabularyReviewItem } from '../lib/lesson-review';

const parsed = parseLessonReviewItems(formLesson);
const causative = parsed.items.find((item): item is GrammarReviewItem =>
  item.kind !== 'vocabulary' && item.id === 'ii-causative')!;
const vocabulary = parsed.items.find((item): item is VocabularyReviewItem =>
  item.kind === 'vocabulary' && item.id === 'vocab-allama')!;

function picker(item: LessonReviewItem, language = 'ar') {
  return renderToStaticMarkup(
    <LessonCaptureModal items={[item]} language={language} lessonId="form-ii-iii"
      onClose={() => {}} onSaved={() => {}} />,
  );
}

function directionOf(html: string, tag: 'span' | 'p', text: string) {
  const pattern = tag === 'span' ? /<span\b([^>]*)>([^<]*)<\/span>/g : /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  const encoded = renderToStaticMarkup(<>{text}</>);
  const element = [...html.matchAll(pattern)]
    .find((match) => match[2].replace(/<[^>]*>/g, '') === encoded);
  expect(element, `rendered ${tag} containing "${text}"`).toBeDefined();
  return element![1].match(/\bdir="(\w+)"/)?.[1];
}

describe('grammar direction in the collapsed picker and GrammarFace preview', () => {
  it('renders the real Form II causative cue LTR in the collapsed label and front/back preview', () => {
    expect(parsed.diagnostics).toEqual([]);
    expect(causative).toBeDefined();
    const html = picker(causative);
    expect(directionOf(html, 'span', causative.prompt)).toBe('ltr');
    expect(directionOf(html, 'p', causative.prompt)).toBe('ltr');
    expect(directionOf(html, 'p', causative.prompt.replace('___', causative.answer))).toBe('ltr');
    expect(html).toContain('Preview front and back');
    expect(html).not.toMatch(/<details\b[^>]*\bopen(?:[ =>])/);
  });

  it.each([
    ['Arabic-leading English prose', 'كَبِيرٌ is indefinite and functions as the predicate in this sentence.', 'ltr'],
    ['Arabic sentence', 'ذَهَبَ الْوَلَدُ إِلَى الْمَدْرَسَةِ', 'rtl'],
    ['trailing transliteration', 'ذَهَبَ الْوَلَدُ إِلَى الْمَدْرَسَةِ (dhahaba al-waladu ilā al-madrasati)', 'rtl'],
    ['long trailing English gloss', 'ذَهَبَ الْوَلَدُ (The boy went to school early in the morning with his friends.)', 'rtl'],
    ['nested trailing gloss', 'ذَهَبَ الْوَلَدُ (The boy went (dhahaba al-waladu) to school early in the morning with his friends.)', 'rtl'],
    ['English lead-in before longer Arabic text', 'Complete: ___ ذَهَبَ الْوَلَدُ إِلَى الْمَدْرَسَةِ', 'ltr'],
    ['equal Latin and Arabic letter counts', 'كتاب book', 'rtl'],
    ['no letters', '___ → …', 'rtl'],
  ])('preserves %s on both surfaces', (_, prompt, expected) => {
    const html = picker({ ...causative, format: 'qa', prompt });
    expect(directionOf(html, 'span', prompt)).toBe(expected);
    expect(directionOf(html, 'p', prompt)).toBe(expected);
  });

  it.each(['ja', 'ru', 'pt', 'es', 'ro'])('leaves %s grammar picker labels auto and preview behavior unchanged', (language) => {
    const prompt = 'كَبِيرٌ is indefinite and functions as the predicate in this sentence.';
    const html = picker({ ...causative, format: 'qa', prompt }, language);
    expect(directionOf(html, 'span', prompt)).toBe('auto');
    expect(directionOf(html, 'p', prompt)).toBe('rtl');
  });
});

describe('unchanged vocabulary picker direction', () => {
  it.each([
    { language: 'ar', word: 'عَلَّمَ', expected: 'rtl' },
    { language: 'ar', word: 'Arabic transliteration: allama', expected: 'rtl' },
    { language: 'ru', word: 'عَلَّمَ', expected: undefined },
    { language: 'es', word: 'enseñar', expected: undefined },
  ])('keeps the language direction for $language vocabulary "$word"', ({ language, word, expected }) => {
    expect(vocabulary).toBeDefined();
    const html = picker({ ...vocabulary, word }, language);
    expect(directionOf(html, 'span', word)).toBe(expected);
  });
});
