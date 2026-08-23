export type LearningPathLessonKind = 'grammar' | 'vocab';

export interface LearningPathLessonRef {
  kind: LearningPathLessonKind;
  lessonId: string;
}

export interface LearningPathUnitManifest {
  id: string;
  title: string;
  description: string;
  lessons: LearningPathLessonRef[];
}

export interface LearningPathManifest {
  language: string;
  letterPrerequisites: string[];
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

export interface LearningPathUnit {
  id: string;
  title: string;
  description: string;
  nodes: LearningPathNode[];
  checkpoints: LearningPathCheckpoint[];
}

export interface LearningPath {
  language: string;
  units: LearningPathUnit[];
  testOutOptions: LearningPathCheckpoint[];
  completedCount: number;
  totalCount: number;
}
