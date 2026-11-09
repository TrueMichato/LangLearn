import { describe, expect, it } from 'vitest';
import targets from '../data/lesson-targets.json';
import type { LessonTargetIndex } from '../lib/knowledge';

describe('generated lesson target metadata', () => {
  it('matches every published lesson file exactly, including legacy internal-ID differences', () => {
    const generated: LessonTargetIndex = targets;
    const indexes = import.meta.glob<{ id: string }[]>('../../public/content/vocab/*/index.json', {
      eager: true, import: 'default',
    });
    const lessons = import.meta.glob<{ words: { word: string }[] }>('../../public/content/vocab/*/*.json', {
      eager: true, import: 'default',
    });
    const languages = Object.keys(indexes).map((file) => file.split('/').at(-2)!).sort();
    expect(Object.keys(generated).sort()).toEqual(languages);
    for (const language of languages) {
      const index = indexes[`../../public/content/vocab/${language}/index.json`];
      expect(Object.keys(generated[language])).toEqual(index.map(({ id }) => id));
      for (const { id } of index) {
        const lesson = lessons[`../../public/content/vocab/${language}/${id}.json`];
        expect(generated[language][id], `${language}/${id}: regenerate with node scripts/generate-lesson-targets.mjs`)
          .toEqual([...new Set(lesson.words.map((word) => word.word))]);
      }
    }
  });
});
