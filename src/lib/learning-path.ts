import { getAlphabetsForLanguage } from '../data/alphabets';
import { getLearningPathManifest } from '../data/learning-paths';
import { getLessonProgress, markLessonComplete } from '../db/lessons';
import type { LessonProgress } from '../db/schema';
import type {
  LearningPath,
  LearningPathLessonRef,
  LearningPathManifest,
  LearningPathNode,
  LearningPathNodeState,
  LearningPathStrand,
  LearningPathUnit,
} from '../types/learning-path';
import {
  guidedLessonId,
  isGuidedAlphabetComplete,
} from './guided-learning-progress';
import {
  grammarLessonRoute,
  grammarTestOutRoute,
  guidedLettersRoute,
  vocabLessonRoute,
  vocabTestOutRoute,
} from './routes';

interface LessonMeta {
  id: string;
  title: string;
}

export interface LearningPathContent {
  grammar: LessonMeta[];
  vocab: LessonMeta[];
}

export interface LearningPathResolution {
  progress: readonly LessonProgress[];
  completedLetters: ReadonlySet<string>;
}

function contentMap(items: readonly LessonMeta[]): Map<string, LessonMeta> {
  return new Map(items.map((item) => [item.id, item]));
}

function resolveState(
  completed: boolean,
  prerequisitesComplete: boolean,
): LearningPathNodeState {
  if (completed) return 'completed';
  return prerequisitesComplete ? 'available' : 'locked';
}

export function resolveLearningPath(
  manifest: LearningPathManifest,
  content: LearningPathContent,
  resolution: LearningPathResolution,
): LearningPath {
  const grammar = contentMap(content.grammar);
  const vocab = contentMap(content.vocab);
  const progress = new Map(
    resolution.progress.map((item) => [item.lessonId, item]),
  );
  let completedAheadCount = 0;
  const encounteredLessons = {
    grammar: [] as LearningPathNode[],
    vocab: [] as LearningPathNode[],
  };

  const resolveLessonNode = (
    lesson: LearningPathLessonRef,
    unitId: string,
    prerequisitesComplete: boolean,
    strandId?: string,
  ): LearningPathNode => {
    const metadata =
      lesson.kind === 'grammar'
        ? grammar.get(lesson.lessonId)
        : vocab.get(lesson.lessonId);
    if (!metadata) {
      throw new Error(
        `Learning path ${manifest.language} references missing ${lesson.kind} lesson ${lesson.lessonId}`,
      );
    }

    const progressId =
      lesson.kind === 'vocab'
        ? `vocab/${lesson.lessonId}`
        : lesson.lessonId;
    const completed = progress.get(progressId)?.completed === true;
    const state = resolveState(completed, prerequisitesComplete);
    if (completed && !prerequisitesComplete) completedAheadCount += 1;
    return {
      id: `${lesson.kind}:${lesson.lessonId}`,
      kind: lesson.kind,
      lessonId: progressId,
      title: metadata.title,
      route:
        lesson.kind === 'grammar'
          ? grammarLessonRoute(lesson.lessonId)
          : vocabLessonRoute(lesson.lessonId),
      state,
      unitId,
      strandId,
    };
  };

  const resolveSequence = (
    lessons: readonly LearningPathLessonRef[],
    unitId: string,
    prerequisitesComplete: boolean,
    strandId?: string,
  ): LearningPathNode[] => {
    let nextPrerequisitesComplete = prerequisitesComplete;
    return lessons.map((lesson) => {
      const node = resolveLessonNode(
        lesson,
        unitId,
        nextPrerequisitesComplete,
        strandId,
      );
      if (node.state !== 'completed') nextPrerequisitesComplete = false;
      return node;
    });
  };

  const buildCheckpoints = (
    nodes: LearningPathNode[],
    unitId: string,
    unitTitle: string,
    prerequisitesComplete: boolean,
  ) => {
    for (const node of nodes) {
      encounteredLessons[node.kind as 'grammar' | 'vocab'].push(node);
    }
    const kinds = [...new Set(nodes.map((node) => node.kind))].filter(
      (kind): kind is 'grammar' | 'vocab' => kind !== 'letters',
    );
    return kinds.map((kind) => {
      const lessons = encounteredLessons[kind];
      const target = lessons[lessons.length - 1];
      const firstIncompleteIndex = lessons.findIndex(
        (node) => node.state !== 'completed',
      );
      const assessmentRange =
        firstIncompleteIndex === -1
          ? []
          : lessons.slice(firstIncompleteIndex);
      const lessonId =
        kind === 'vocab'
          ? target.lessonId.replace(/^vocab\//, '')
          : target.lessonId;
      const lessonIds = assessmentRange.map((node) =>
        kind === 'vocab'
          ? node.lessonId.replace(/^vocab\//, '')
          : node.lessonId,
      );
      return {
        kind,
        lessonId,
        route:
          kind === 'grammar'
            ? grammarTestOutRoute(lessonId, 'learn', lessonIds)
            : vocabTestOutRoute(lessonId, 'learn', lessonIds),
        state: !prerequisitesComplete
          ? ('locked' as const)
          : assessmentRange.length === 0
            ? ('completed' as const)
            : ('available' as const),
        unitId,
        unitTitle,
        lessonCount: assessmentRange.length,
        lessonIds,
        firstLessonTitle: assessmentRange[0]?.title ?? target.title,
        lastLessonTitle:
          assessmentRange[assessmentRange.length - 1]?.title ?? target.title,
      };
    });
  };

  const parallelLetterUnit =
    manifest.letterPrerequisites.length > 0 &&
    (manifest.letterUnitLessons?.length ?? 0) > 0;
  let letterPrerequisitesComplete = true;
  const letterNodes: LearningPathNode[] = manifest.letterPrerequisites.map(
    (alphabetName) => {
      const lessonId = guidedLessonId(alphabetName);
      const completed =
        resolution.completedLetters.has(alphabetName) ||
        progress.get(lessonId)?.completed === true;
      const state = resolveState(completed, letterPrerequisitesComplete);
      if (completed && !letterPrerequisitesComplete) completedAheadCount += 1;
      if (!completed) letterPrerequisitesComplete = false;
      return {
        id: `letters:${alphabetName}`,
        kind: 'letters',
        lessonId,
        title: alphabetName,
        route: guidedLettersRoute(manifest.language, alphabetName),
        state,
        unitId: 'letters',
        strandId: parallelLetterUnit ? 'letter-practice' : undefined,
      };
    },
  );
  const lettersComplete = letterNodes.every(
    (node) => node.state === 'completed',
  );
  const letterLessonNodes = resolveSequence(
    manifest.letterUnitLessons ?? [],
    'letters',
    parallelLetterUnit || lettersComplete,
    parallelLetterUnit ? 'letter-sounds' : undefined,
  );
  const letterUnitNodes = [...letterNodes, ...letterLessonNodes];
  const letterUnitStrands: LearningPathStrand[] = parallelLetterUnit
    ? [
        {
          id: 'letter-practice',
          title: 'Practice the letters',
          description: 'Build recognition one letter set at a time.',
          nodes: letterNodes,
        },
        {
          id: 'letter-sounds',
          title: 'Hear the sounds',
          description: 'Connect the written alphabet with its spoken sounds.',
          nodes: letterLessonNodes,
        },
      ]
    : [];
  const prerequisitesComplete = letterUnitNodes.every(
    (node) => node.state === 'completed',
  );
  const letterUnitCheckpoints = buildCheckpoints(
    letterLessonNodes,
    'letters',
    'Learn the script',
    parallelLetterUnit || lettersComplete,
  );

  let previousUnitComplete = prerequisitesComplete;
  const units: LearningPathUnit[] = manifest.units.map((unit) => {
    const strands: LearningPathStrand[] = unit.strands
      ? unit.strands.map((strand) => ({
          id: strand.id,
          title: strand.title,
          description: strand.description,
          nodes: resolveSequence(
            strand.lessons,
            unit.id,
            previousUnitComplete,
            strand.id,
          ),
        }))
      : [];
    const nodes = unit.strands
      ? strands.flatMap((strand) => strand.nodes)
      : resolveSequence(unit.lessons, unit.id, previousUnitComplete);
    const checkpoints = buildCheckpoints(
      nodes,
      unit.id,
      unit.title,
      prerequisitesComplete,
    );

    const resolvedUnit: LearningPathUnit = {
      id: unit.id,
      title: unit.title,
      description: unit.description,
      nodes,
      checkpoints,
      strands,
    };
    previousUnitComplete =
      previousUnitComplete &&
      nodes.every((node) => node.state === 'completed');
    return resolvedUnit;
  });

  const allUnits =
    letterUnitNodes.length > 0
      ? [
          {
            id: 'letters',
            title: 'Learn the script',
            description:
              parallelLetterUnit
                ? 'Learn the shapes and sounds side by side before lessons begin.'
                : letterLessonNodes.length > 0
                ? 'Get comfortable with the writing system and its sounds before lessons begin.'
                : 'Get comfortable with the writing system before lessons begin.',
            nodes: letterUnitNodes,
            strands: letterUnitStrands,
            checkpoints: letterUnitCheckpoints,
          },
          ...units,
        ]
      : units;
  const nodes = allUnits.flatMap((unit) => unit.nodes);
  const recommendedNodeId =
    nodes.find((node) => node.state === 'available')?.id ?? null;

  return {
    language: manifest.language,
    units: allUnits,
    testOutOptions: allUnits.flatMap((unit) => unit.checkpoints),
    completedCount: nodes.filter((node) => node.state === 'completed').length,
    totalCount: nodes.length,
    completedAheadCount,
    recommendedNodeId,
  };
}

async function fetchLessonIndex(
  language: string,
  kind: 'grammar' | 'vocab',
): Promise<LessonMeta[]> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}content/${kind}/${language}/index.json`,
  );
  if (!response.ok) {
    throw new Error(`Could not load ${kind} lessons for ${language}`);
  }
  return response.json() as Promise<LessonMeta[]>;
}

export async function loadLearningPath(
  language: string,
): Promise<LearningPath | null> {
  const manifest = getLearningPathManifest(language);
  if (!manifest) return null;

  const [grammar, vocab, progress] = await Promise.all([
    fetchLessonIndex(language, 'grammar'),
    fetchLessonIndex(language, 'vocab'),
    getLessonProgress(language),
  ]);
  const alphabets = getAlphabetsForLanguage(language);
  const completedLetters = new Set<string>();

  for (const alphabetName of manifest.letterPrerequisites) {
    const alphabet = alphabets.find((item) => item.name === alphabetName);
    if (!alphabet) {
      throw new Error(
        `Learning path ${language} references missing alphabet ${alphabetName}`,
      );
    }
    const groups = [...new Set(alphabet.characters.map((item) => item.group))];
    if (isGuidedAlphabetComplete(alphabetName, language, groups)) {
      completedLetters.add(alphabetName);
      const lessonId = guidedLessonId(alphabetName);
      if (!progress.some((item) => item.lessonId === lessonId && item.completed)) {
        await markLessonComplete(language, lessonId, 100);
      }
    }
  }

  return resolveLearningPath(
    manifest,
    { grammar, vocab },
    { progress, completedLetters },
  );
}
