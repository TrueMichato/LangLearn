export type LearningPathLessonKind = 'grammar' | 'vocab';

export interface LearningPathLessonRef {
  kind: LearningPathLessonKind;
  lessonId: string;
}

interface LearningPathUnitManifestBase {
  id: string;
  title: string;
  description: string;
}

export interface LearningPathLinearUnitManifest
  extends LearningPathUnitManifestBase {
  lessons: LearningPathLessonRef[];
  strands?: never;
}

export interface LearningPathStrandManifest {
  id: string;
  title: string;
  description: string;
  lessons: LearningPathLessonRef[];
}

export interface LearningPathParallelUnitManifest
  extends LearningPathUnitManifestBase {
  lessons?: never;
  strands: LearningPathStrandManifest[];
}

export type LearningPathUnitManifest =
  | LearningPathLinearUnitManifest
  | LearningPathParallelUnitManifest;

export interface LearningPathManifest {
  language: string;
  letterPrerequisites: string[];
  /** Lessons that belong in the generated "Learn the script" unit. */
  letterUnitLessons?: LearningPathLessonRef[];
  units: LearningPathUnitManifest[];
}

export type LearningPathNodeKind = 'letters' | LearningPathLessonKind;
export type LearningPathNodeState = 'completed' | 'available' | 'locked';

export interface LearningPathNode {
  id: string;
  kind: LearningPathNodeKind;
  lessonId: string;
  title: string;
  route: string;
  state: LearningPathNodeState;
  unitId: string;
  strandId?: string;
}

export type LearningPathCheckpointState = 'available' | 'completed' | 'locked';

export interface LearningPathCheckpoint {
  kind: LearningPathLessonKind;
  lessonId: string;
  route: string;
  state: LearningPathCheckpointState;
  unitId: string;
  unitTitle: string;
  lessonCount: number;
  lessonIds: string[];
  firstLessonTitle: string;
  lastLessonTitle: string;
}

export interface LearningPathStrand {
  id: string;
  title: string;
  description: string;
  nodes: LearningPathNode[];
}

export interface LearningPathUnit {
  id: string;
  title: string;
  description: string;
  nodes: LearningPathNode[];
  strands: LearningPathStrand[];
  checkpoints: LearningPathCheckpoint[];
}

export interface LearningPath {
  language: string;
  units: LearningPathUnit[];
  testOutOptions: LearningPathCheckpoint[];
  completedCount: number;
  totalCount: number;
  /** Completed nodes after the current guided step, including its unit. */
  completedAheadCount: number;
  /** The single available node highlighted as the calm next recommendation. */
  recommendedNodeId: string | null;
}
