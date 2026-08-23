import { getAlphabetsForLanguage } from '../data/alphabets';
import { getLearningPathManifest } from '../data/learning-paths';
import { getLessonProgress, markLessonComplete } from '../db/lessons';
import type { LessonProgress } from '../db/schema';
import type {
  LearningPath,
  LearningPathManifest,
  LearningPathNode,
  LearningPathNodeState,
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
  availableClaimed: boolean,
): LearningPathNodeState {
  if (completed) return 'completed';
  return availableClaimed ? 'locked' : 'available';
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
  let availableClaimed = false;

  const letterNodes: LearningPathNode[] = manifest.letterPrerequisites.map(
    (alphabetName) => {
      const lessonId = guidedLessonId(alphabetName);
      const completed =
        resolution.completedLetters.has(alphabetName) ||
        progress.get(lessonId)?.completed === true;
      const state = resolveState(completed, availableClaimed);
      if (!completed) availableClaimed = true;
      return {
        id: `letters:${alphabetName}`,
        kind: 'letters',
        lessonId,
        title: alphabetName,
        route: guidedLettersRoute(manifest.language, alphabetName),
        state,
        unitId: 'letters',
      };
    },
  );
  const prerequisitesComplete = letterNodes.every(
    (node) => node.state === 'completed',
  );
  const encounteredLessons = {
    grammar: [] as LearningPathNode[],
    vocab: [] as LearningPathNode[],
  };

  const units = manifest.units.map((unit) => {
    const nodes = unit.lessons.map((lesson): LearningPathNode => {
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
      const state = resolveState(completed, availableClaimed);
      if (!completed) availableClaimed = true;
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
        unitId: unit.id,
      };
    });

    for (const node of nodes) {
      encounteredLessons[node.kind as 'grammar' | 'vocab'].push(node);
    }
    const kinds = [...new Set(nodes.map((node) => node.kind))] as Array<
      'grammar' | 'vocab'
    >;
    const checkpoints = kinds.map((kind) => {
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
      return {
        kind,
        lessonId,
        route:
          kind === 'grammar'
            ? grammarTestOutRoute(lessonId, 'learn')
            : vocabTestOutRoute(lessonId, 'learn'),
        state: !prerequisitesComplete
          ? ('locked' as const)
          : assessmentRange.length === 0
            ? ('completed' as const)
            : ('available' as const),
        unitId: unit.id,
        unitTitle: unit.title,
        lessonCount: assessmentRange.length,
        lessonIds: assessmentRange.map((node) =>
          kind === 'vocab'
            ? node.lessonId.replace(/^vocab\//, '')
            : node.lessonId,
        ),
        firstLessonTitle: assessmentRange[0]?.title ?? target.title,
        lastLessonTitle:
          assessmentRange[assessmentRange.length - 1]?.title ?? target.title,
      };
    });

    return {
      id: unit.id,
      title: unit.title,
      description: unit.description,
      nodes,
      checkpoints,
    };
  });

  const allUnits =
    letterNodes.length > 0
      ? [
          {
            id: 'letters',
            title: 'Learn the script',
            description:
              'Get comfortable with the writing system before lessons begin.',
            nodes: letterNodes,
            checkpoints: [],
          },
          ...units,
        ]
      : units;
  const nodes = allUnits.flatMap((unit) => unit.nodes);
  const currentUnitIndex = allUnits.findIndex((unit) =>
    unit.nodes.some((node) => node.state === 'available'),
  );
  const completedAheadCount =
    currentUnitIndex === -1
      ? 0
      : allUnits
          .slice(currentUnitIndex + 1)
          .flatMap((unit) => unit.nodes)
          .filter((node) => node.state === 'completed').length;

  return {
    language: manifest.language,
    units: allUnits,
    testOutOptions: allUnits.flatMap((unit) => unit.checkpoints),
    completedCount: nodes.filter((node) => node.state === 'completed').length,
    totalCount: nodes.length,
    completedAheadCount,
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
