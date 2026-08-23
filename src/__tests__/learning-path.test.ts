import { describe, expect, it } from 'vitest';
import { getAlphabetsForLanguage } from '../data/alphabets';
import { LEARNING_PATHS } from '../data/learning-paths';
import {
  defineLearningPath,
  grammar,
  unitLessons,
  vocab,
} from '../data/learning-paths/shared';
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

function progress(lessonId: string, language = 'ja'): LessonProgress {
  return {
    id: `${language}/${lessonId}`,
    language,
    lessonId,
    completed: true,
    quizScore: 100,
    completedAt: '2026-08-21T00:00:00.000Z',
    attempts: 1,
  };
}

function manifestLessons(
  manifest: (typeof LEARNING_PATHS)[string],
) {
  return [
    ...(manifest.letterUnitLessons ?? []),
    ...manifest.units.flatMap(unitLessons),
  ];
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
      for (const lesson of manifest.letterUnitLessons ?? []) {
        const key = `${lesson.kind}:${lesson.lessonId}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(
          lesson.kind === 'grammar'
            ? grammarIds.has(lesson.lessonId)
            : vocabIds.has(lesson.lessonId),
        ).toBe(true);
      }
      for (const unit of manifest.units) {
        const lessons = unitLessons(unit);
        expect(lessons.length).toBeGreaterThan(0);
        for (const lesson of lessons) {
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

  it.each(Object.entries(LEARNING_PATHS))(
    '%s includes the first grammar and vocabulary lessons',
    (language, manifest) => {
      const firstGrammar = indexFor(GRAMMAR_INDEXES, language)[0].id;
      const firstVocab = indexFor(VOCAB_INDEXES, language)[0].id;
      const lessons = manifestLessons(manifest);

      expect(lessons).toContainEqual({
        kind: 'grammar',
        lessonId: firstGrammar,
      });
      expect(lessons).toContainEqual({
        kind: 'vocab',
        lessonId: firstVocab,
      });
    },
  );

  it.each(Object.entries(LEARNING_PATHS))(
    '%s keeps its selected grammar lessons in curriculum order',
    (language, manifest) => {
      const grammarIndex = indexFor(GRAMMAR_INDEXES, language);
      const orderById = new Map(
        grammarIndex.map((lesson, index) => [lesson.id, index]),
      );
      const grammarOrder = manifestLessons(manifest)
        .filter((lesson) => lesson.kind === 'grammar')
        .map((lesson) => {
          const order = orderById.get(lesson.lessonId);
          if (order === undefined) {
            throw new Error(`Missing grammar lesson ${lesson.lessonId}`);
          }
          return order;
        });

      expect(grammarOrder).toEqual(
        [...grammarOrder].sort((left, right) => left - right),
      );
    },
  );

  it('places Russian alphabet sounds in the script unit before regular lessons', () => {
    const manifest = LEARNING_PATHS.ru;
    const path = resolveLearningPath(
      manifest,
      {
        grammar: indexFor(GRAMMAR_INDEXES, 'ru'),
        vocab: indexFor(VOCAB_INDEXES, 'ru'),
      },
      {
        progress: [],
        completedLetters: new Set(manifest.letterPrerequisites),
      },
    );

    expect(path.units[0].id).toBe('letters');
    expect(path.units[0].nodes.map((node) => node.title)).toEqual([
      'Cyrillic (Uppercase)',
      'Cyrillic (Lowercase)',
      'The Russian Alphabet & Sounds',
    ]);
    expect(path.units[0].nodes[2].state).toBe('available');
    expect(path.units[0].checkpoints[0]).toMatchObject({
      kind: 'grammar',
      lessonIds: ['alphabet-sounds'],
      state: 'available',
    });
    expect(path.units[1].nodes.some((node) => node.title === 'The Russian Alphabet & Sounds')).toBe(
      false,
    );
    expect(path.units[1].nodes.every((node) => node.state === 'locked')).toBe(
      true,
    );
  });

  it('counts Russian alphabet sounds as ahead progress inside the script unit', () => {
    const manifest = LEARNING_PATHS.ru;
    const path = resolveLearningPath(
      manifest,
      {
        grammar: indexFor(GRAMMAR_INDEXES, 'ru'),
        vocab: indexFor(VOCAB_INDEXES, 'ru'),
      },
      {
        progress: [progress('alphabet-sounds', 'ru')],
        completedLetters: new Set(),
      },
    );

    expect(path.units[0].nodes[0].state).toBe('available');
    expect(path.units[0].nodes[2]).toMatchObject({
      title: 'The Russian Alphabet & Sounds',
      state: 'completed',
    });
    expect(path.completedAheadCount).toBe(1);
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
    expect(
      path.units
        .flatMap((unit) => unit.checkpoints)
        .every((checkpoint) => checkpoint.state === 'locked'),
    ).toBe(true);
    expect(path.testOutOptions.every((option) => option.state === 'locked')).toBe(
      true,
    );
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
    const firstUnit = path.units.find((unit) => unit.id === manifest.units[0].id);
    expect(firstUnit?.checkpoints.map((checkpoint) => checkpoint.route)).toEqual([
      '/vocab-lessons?testOut=numbers&from=learn&testOutLesson=greetings&testOutLesson=numbers',
      '/grammar?testOut=particles&from=learn&testOutLesson=particles',
    ]);
    expect(
      firstUnit?.checkpoints.every((checkpoint) => checkpoint.state === 'available'),
    ).toBe(true);
    expect(firstUnit?.checkpoints.map((checkpoint) => checkpoint.lessonCount)).toEqual([
      2,
      1,
    ]);
    expect(path.testOutOptions[0]).toMatchObject({
      unitTitle: firstUnit?.title,
      firstLessonTitle: 'Greetings & Introductions',
      lastLessonTitle: 'Numbers 1-100',
    });
  });

  it('advances to one next node while preserving completed history', () => {
    const firstUnit = manifest.units[0];
    if (!firstUnit.lessons) throw new Error('Expected a linear first unit');
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
    const firstVocabOption = path.testOutOptions.find(
      (option) =>
        option.unitId === firstUnit.id && option.kind === 'vocab',
    );
    expect(firstVocabOption).toMatchObject({
      lessonCount: 1,
      firstLessonTitle: 'Numbers 1-100',
      lastLessonTitle: 'Numbers 1-100',
      state: 'available',
    });
    expect(
      path.testOutOptions.find(
        (option) =>
          option.unitId === firstUnit.id && option.kind === 'grammar',
      )?.state,
    ).toBe('completed');
  });

  it('describes the same contiguous range when later lessons were completed out of order', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [progress('verb-forms')],
      completedLetters: new Set(manifest.letterPrerequisites),
    });
    const option = path.testOutOptions.find(
      (candidate) =>
        candidate.unitId === 'everyday-time' &&
        candidate.kind === 'grammar',
    );

    expect(option).toMatchObject({
      lessonCount: 2,
      firstLessonTitle: 'Basic Particles (は、が、を、に、で)',
      lastLessonTitle: 'Verb Forms (ます、て、た)',
      state: 'available',
    });
  });
});

describe('resolveLearningPath completedAheadCount', () => {
  const manifest = LEARNING_PATHS.ja;
  const content = {
    grammar: indexFor(GRAMMAR_INDEXES, 'ja'),
    vocab: indexFor(VOCAB_INDEXES, 'ja'),
  };

  it('is zero while the current step has nothing completed after it', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [],
      completedLetters: new Set(['Hiragana']),
    });

    expect(path.completedAheadCount).toBe(0);
  });

  it('is zero once every node on the path is complete', () => {
    const allLessons = manifest.units.flatMap(unitLessons);
    const completedProgress = allLessons.map((lesson) =>
      progress(
        lesson.kind === 'vocab' ? `vocab/${lesson.lessonId}` : lesson.lessonId,
      ),
    );
    const path = resolveLearningPath(manifest, content, {
      progress: completedProgress,
      completedLetters: new Set(manifest.letterPrerequisites),
    });

    expect(path.completedCount).toBe(path.totalCount);
    expect(path.completedAheadCount).toBe(0);
  });

    describe('parallel learning path units', () => {
      const manifest = LEARNING_PATHS.ru;
      const content = {
        grammar: indexFor(GRAMMAR_INDEXES, 'ru'),
        vocab: indexFor(VOCAB_INDEXES, 'ru'),
      };
      const beforeFork = [
        progress('alphabet-sounds', 'ru'),
        progress('vocab/greetings', 'ru'),
        progress('pronunciation-rules', 'ru'),
        progress('vocab/numbers', 'ru'),
      ];
      const completedLetters = new Set(manifest.letterPrerequisites);

      it('offers one lesson in each strand while recommending only the first', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: beforeFork,
          completedLetters,
        });
        const foundations = path.units.find((unit) => unit.id === 'foundations');
        const available = foundations?.nodes.filter(
          (node) => node.state === 'available',
        );

        expect(foundations?.strands.map((strand) => strand.title)).toEqual([
          'Sound and rhythm',
          'People and things',
        ]);
        expect(available?.map((node) => node.id)).toEqual([
          'vocab:days-months',
          'vocab:family',
        ]);
        expect(path.recommendedNodeId).toBe('vocab:days-months');
        expect(
          path.units
            .find((unit) => unit.id === 'food-cases')
            ?.nodes.every((node) => node.state === 'locked'),
        ).toBe(true);
        expect(path.completedAheadCount).toBe(0);
      });

      it('advances strands independently without treating current branch work as ahead', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: [
            ...beforeFork,
            progress('vocab/days-months', 'ru'),
            progress('vocab/family', 'ru'),
          ],
          completedLetters,
        });
        const foundations = path.units.find((unit) => unit.id === 'foundations');

        expect(
          foundations?.nodes
            .filter((node) => node.state === 'available')
            .map((node) => node.id),
        ).toEqual(['grammar:stress', 'grammar:spelling-rules']);
        expect(path.recommendedNodeId).toBe('grammar:stress');
        expect(path.completedAheadCount).toBe(0);
      });

      it('keeps the join locked until every strand is complete', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: [
            ...beforeFork,
            progress('vocab/days-months', 'ru'),
            progress('stress', 'ru'),
            progress('vocab/colors', 'ru'),
          ],
          completedLetters,
        });

        expect(path.recommendedNodeId).toBe('vocab:family');
        expect(
          path.units
            .find((unit) => unit.id === 'food-cases')
            ?.nodes.every((node) => node.state === 'locked'),
        ).toBe(true);
      });

      it('rejoins after every strand and unlocks one next lesson', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: [
            ...beforeFork,
            progress('vocab/days-months', 'ru'),
            progress('stress', 'ru'),
            progress('vocab/colors', 'ru'),
            progress('vocab/family', 'ru'),
            progress('spelling-rules', 'ru'),
            progress('vocab/animals', 'ru'),
          ],
          completedLetters,
        });
        const food = path.units.find((unit) => unit.id === 'food-cases');

        expect(path.recommendedNodeId).toBe('vocab:food');
        expect(food?.nodes[0].state).toBe('available');
        expect(food?.nodes.slice(1).every((node) => node.state === 'locked')).toBe(
          true,
        );
      });

      it('counts a completed locked branch lesson as ahead progress', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: [...beforeFork, progress('vocab/animals', 'ru')],
          completedLetters,
        });

        expect(path.completedAheadCount).toBe(1);
        expect(path.recommendedNodeId).toBe('vocab:days-months');
      });

      it('does not unlock past a fully completed future unit when an earlier unit is incomplete', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: [
            ...beforeFork,
            progress('vocab/food', 'ru'),
            progress('cases', 'ru'),
            progress('vocab/body', 'ru'),
          ],
          completedLetters,
        });

        expect(path.recommendedNodeId).toBe('vocab:days-months');
        expect(
          path.units
            .find((unit) => unit.id === 'actions')
            ?.nodes.every((node) => node.state === 'locked'),
        ).toBe(true);
      });

      it('builds deterministic cumulative checks across both strands', () => {
        const path = resolveLearningPath(manifest, content, {
          progress: beforeFork,
          completedLetters,
        });
        const checkpoints = path.units.find(
          (unit) => unit.id === 'foundations',
        )?.checkpoints;

        expect(checkpoints).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              kind: 'vocab',
              lessonIds: ['days-months', 'colors', 'family', 'animals'],
              state: 'available',
              route:
                '/vocab-lessons?testOut=animals&from=learn&testOutLesson=days-months&testOutLesson=colors&testOutLesson=family&testOutLesson=animals',
            }),
            expect.objectContaining({
              kind: 'grammar',
              lessonIds: ['stress', 'spelling-rules'],
              state: 'available',
            }),
          ]),
        );
      });
    });

    describe('defineLearningPath parallel-unit validation', () => {
      it('rejects a parallel unit with fewer than two strands', () => {
        expect(() =>
          defineLearningPath({
            language: 'xx',
            letterPrerequisites: [],
            units: [
              {
                id: 'fork',
                title: 'Fork',
                description: 'Invalid fork.',
                strands: [
                  {
                    id: 'only',
                    title: 'Only',
                    description: 'Only strand.',
                    lessons: [vocab('one')],
                  },
                ],
              },
            ],
          }),
        ).toThrow('must contain at least two strands');
      });

      it('rejects duplicate lessons across strands', () => {
        expect(() =>
          defineLearningPath({
            language: 'xx',
            letterPrerequisites: [],
            units: [
              {
                id: 'fork',
                title: 'Fork',
                description: 'Invalid fork.',
                strands: [
                  {
                    id: 'one',
                    title: 'One',
                    description: 'First strand.',
                    lessons: [grammar('shared')],
                  },
                  {
                    id: 'two',
                    title: 'Two',
                    description: 'Second strand.',
                    lessons: [grammar('shared')],
                  },
                ],
              },
            ],
          }),
        ).toThrow('repeats lesson grammar:shared');
      });
    });

  it('counts a single future vocab lesson finished while letters are still current, without moving the current step or unlocking anything', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [progress('vocab/greetings')],
      completedLetters: new Set(['Hiragana']),
    });
    const nodes = path.units.flatMap((unit) => unit.nodes);
    const katakana = nodes.find((node) => node.id === 'letters:Katakana');
    const greetings = nodes.find((node) => node.id === 'vocab:greetings');
    const particles = nodes.find((node) => node.id === 'grammar:particles');

    expect(path.completedAheadCount).toBe(1);
    expect(katakana?.state).toBe('available');
    expect(nodes.filter((node) => node.state === 'available')).toHaveLength(1);
    expect(greetings?.state).toBe('completed');
    expect(particles?.state).toBe('locked');
  });

  it('counts multiple lessons finished ahead of the current letters step (plural)', () => {
    const path = resolveLearningPath(manifest, content, {
      progress: [progress('vocab/greetings'), progress('particles')],
      completedLetters: new Set(['Hiragana']),
    });
    const nodes = path.units.flatMap((unit) => unit.nodes);
    const katakana = nodes.find((node) => node.id === 'letters:Katakana');
    const numbers = nodes.find((node) => node.id === 'vocab:numbers');

    expect(path.completedAheadCount).toBe(2);
    expect(katakana?.state).toBe('available');
    expect(numbers?.state).toBe('locked');
  });
});
