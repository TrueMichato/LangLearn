export type LearningPathLessonKind = 'grammar' | 'vocab';
export type LearningPathActivityKind =
  | 'letters'
  | 'sentence'
  | 'cloze'
  | 'listening'
  | 'dictation'
  | 'conjugation'
  | 'translation'
  | 'minimal-pairs'
  | 'numbers'
  | 'reading'
  | 'lyrics'
  | 'tests';
export type LearningPathNodeKind =
  | LearningPathLessonKind
  | LearningPathActivityKind;
export type LearningPathRequirement = 'required' | 'enrichment';
export type LearningPathUnitPresentation = 'standard' | 'continuation';
export type ArabicDialect =
  | 'egyptian'
  | 'levantine'
  | 'gulf'
  | 'maghrebi'
  | 'iraqi';

export interface LearningPathSessionBounds {
  minItems: number;
  targetItems: number;
  maxItems: number;
}

export interface LearningPathLessonRef {
  kind: LearningPathLessonKind;
  lessonId: string;
  requirement?: LearningPathRequirement;
}

export interface LearningPathPhase {
  id: string;
  title: string;
  description: string;
}

export interface LearningPathContinuationPhaseStart {
  phaseId: string;
  startsAt?: LearningPathLessonRef;
}

interface LearningPathUnitManifestBase {
  id: string;
  title: string;
  description: string;
  presentation?: LearningPathUnitPresentation;
  phaseId?: string;
}

export interface LearningPathActivityRef {
  kind: LearningPathActivityKind;
  /** Stable, namespaced progress key such as `sentence:foundations-1`. */
  milestoneId: string;
  /** Backward-compatible alias while manifests still store refs under `lessons`. */
  lessonId: string;
  title: string;
  route: string;
  session: LearningPathSessionBounds;
  requirement?: LearningPathRequirement;
}

export type LearningPathMilestoneRef =
  | LearningPathLessonRef
  | LearningPathActivityRef;

export interface LearningPathLinearUnitManifest
  extends LearningPathUnitManifestBase {
  lessons: LearningPathMilestoneRef[];
  strands?: never;
}

export interface LearningPathStrandManifest {
  id: string;
  title: string;
  description: string;
  lessons: LearningPathMilestoneRef[];
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
  phases?: LearningPathPhase[];
  units: LearningPathUnitManifest[];
}

export type LearningPathNodeState = 'completed' | 'available' | 'locked';

export interface LearningPathNode {
  id: string;
  kind: LearningPathNodeKind;
  /** Stable progress identity. For legacy lessons this is their catalog id. */
  milestoneId?: string;
  lessonId: string;
  title: string;
  route: string;
  state: LearningPathNodeState;
  unitId: string;
  strandId?: string;
  requirement?: LearningPathRequirement;
  session?: LearningPathSessionBounds;
}

export type LearningPathCheckpointState = 'available' | 'completed' | 'locked';

export interface LearningPathCheckpoint {
  kind: LearningPathLessonKind;
  lessonId: string;
  route: string;
  state: LearningPathCheckpointState;
  unitId: string;
  unitTitle: string;
  phaseTitle?: string;
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
  presentation?: LearningPathUnitPresentation;
  phase?: LearningPathPhase;
  nodes: LearningPathNode[];
  strands: LearningPathStrand[];
  checkpoints: LearningPathCheckpoint[];
}

export interface LearningPath {
  language: string;
  phases?: LearningPathPhase[];
  units: LearningPathUnit[];
  testOutOptions: LearningPathCheckpoint[];
  completedCount: number;
  totalCount: number;
  enrichmentCompletedCount?: number;
  enrichmentTotalCount?: number;
  /** Completed nodes after the current guided step, including its unit. */
  completedAheadCount: number;
  /** The single available node highlighted as the calm next recommendation. */
  recommendedNodeId: string | null;
}

export interface ArabicLearningPathPolicy {
  currentDialect: ArabicDialect | null;
  colloquialFocus: boolean;
}
