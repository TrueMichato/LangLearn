import { describe, expect, it } from 'vitest';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { LEARNING_PATHS } from '../data/learning-paths';
import { resolveLearningPath } from '../lib/learning-path';
import type { LessonProgress } from '../db/schema';

interface LessonMeta {
  id: string;
  title: string;
}

const GRAMMAR_INDEXES = import.meta.glob(
  '../../public/content/grammar/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, LessonMeta[]>;
const VOCAB_INDEXES = import.meta.glob(
  '../../public/content/vocab/*/index.json',
  { eager: true, import: 'default' },
) as Record<string, LessonMeta[]>;

function indexFor(
  indexes: Record<string, LessonMeta[]>,
  language: string,
): LessonMeta[] {
  const entry = Object.entries(indexes).find(([path]) =>
    path.endsWith(`/${language}/index.json`),
  );
  if (!entry) throw new Error(`Missing ${language} content index`);
  return entry[1];
}

function progress(lessonId: string): LessonProgress {
  return {
    id: `ja/${lessonId}`,
    language: 'ja',
    lessonId,
    completed: true,
    quizScore: 100,
    completedAt: '2026-08-21T00:00:00.000Z',
    attempts: 1,
  };
}

describe('learning path manifests', () => {
  it.each(Object.entries(LEARNING_PATHS))(
    '%s references real, non-duplicated lessons and alphabets',
    (language, manifest) => {
      const grammarIds = new Set(
        indexFor(GRAMMAR_INDEXES, language).map((lesson) => lesson.id),
      );
      const vocabIds = new Set(
        indexFor(VOCAB_INDEXES, language).map((lesson) => lesson.id),
      );
      const alphabetNames = new Set(
        getAlphabetsForLanguage(language).map((alphabet) => alphabet.name),
      );
      const seen = new Set<string>();

      expect(manifest.language).toBe(language);
      expect(manifest.units.length).toBeGreaterThan(0);
      for (const alphabetName of manifest.letterPrerequisites) {
        expect(alphabetNames.has(alphabetName)).toBe(true);
      }
      for (const unit of manifest.units) {
        expect(unit.lessons.length).toBeGreaterThan(0);
        for (const lesson of unit.lessons) {
          const key = `${lesson.kind}:${lesson.lessonId}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
          expect(
            lesson.kind === 'grammar'
              ? grammarIds.has(lesson.lessonId)
              : vocabIds.has(lesson.lessonId),
          ).toBe(true);
        }
      }
    },
  );

  it.each(['ja', 'ru', 'ar'])('%s starts with required script work', (language) => {
    expect(LEARNING_PATHS[language].letterPrerequisites.length).toBeGreaterThan(0);
  });

  it.each(['es', 'pt', 'ro'])('%s starts directly with lessons', (language) => {
    expect(LEARNING_PATHS[language].letterPrerequisites).toEqual([]);
  });
});

describe('resolveLearningPath', () => {
  const manifest = LEARNING_PATHS.ja;
  const content = {
    grammar: indexFor(GRAMMAR_INDEXES, 'ja'),
    vocab: indexFor(VOCAB_INDEXES, 'ja'),
  };

  it('makes the first letter prerequisite the only available node', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [],
      completedLetters: new Set(),
    });
    const nodes = path.units.flatMap((unit) => unit.nodes);

    expect(nodes[0].kind).toBe('letters');
    expect(nodes[0].state).toBe('available');
    expect(nodes.slice(1).every((node) => node.state === 'locked')).toBe(true);
  });

  it('opens the first lesson only after every letter prerequisite', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [],
      completedLetters: new Set(manifest.letterPrerequisites),
    });
    const nodes = path.units.flatMap((unit) => unit.nodes);
    const lessonNodes = nodes.filter((node) => node.kind !== 'letters');

    expect(lessonNodes[0].state).toBe('available');
    expect(lessonNodes.slice(1).every((node) => node.state === 'locked')).toBe(true);
  });

  it('advances to one next node while preserving completed history', () => {
    const firstUnit = manifest.units[0];
    const completedProgress = firstUnit.lessons.slice(0, 2).map((lesson) =>
      progress(
        lesson.kind === 'vocab'
          ? `vocab/${lesson.lessonId}`
          : lesson.lessonId,
      ),
    );
    const path = resolveLearningPath(manifest, content, {
      progress: completedProgress,
      completedLetters: new Set(manifest.letterPrerequisites),
    });
    const lessonNodes = path.units
      .flatMap((unit) => unit.nodes)
      .filter((node) => node.kind !== 'letters');

    expect(lessonNodes[0].state).toBe('completed');
    expect(lessonNodes[1].state).toBe('completed');
    expect(lessonNodes[2].state).toBe('available');
    expect(lessonNodes[3].state).toBe('locked');
  });
});
