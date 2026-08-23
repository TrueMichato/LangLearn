import type { Question } from './test-questions';

const STORAGE_KEY = 'langlearn-assessment-drafts';
const STORAGE_VERSION = 1;
const MAX_DRAFTS = 3;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type AssessmentKind = 'grammar' | 'vocab';

export interface AssessmentDraftIdentity {
  language: string;
  kind: AssessmentKind;
  lessonIds: readonly string[];
}

export interface AssessmentDraft {
  id: string;
  language: string;
  kind: AssessmentKind;
  lessonIds: string[];
  questions: Question[];
  index: number;
  correctCount: number;
  selectedIndex: number | null;
  savedAt: number;
}

interface StoredDrafts {
  version: typeof STORAGE_VERSION;
  drafts: AssessmentDraft[];
}

function storage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function assessmentDraftId({
  language,
  kind,
  lessonIds,
}: AssessmentDraftIdentity): string {
  return `${language}/${kind}/${lessonIds.join('|')}`;
}

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false;
  const question = value as Partial<Question>;
  return (
    Number.isInteger(question.id) &&
    (question.category === 'grammar' || question.category === 'vocabulary') &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.every((option) => typeof option === 'string') &&
    Number.isInteger(question.correctIndex) &&
    (question.correctIndex ?? -1) >= 0 &&
    (question.correctIndex ?? 0) < question.options.length &&
    (question.lessonId === undefined || typeof question.lessonId === 'string') &&
    (question.questionDirection === undefined ||
      question.questionDirection === 'target') &&
    (question.targetOptionIndices === undefined ||
      (Array.isArray(question.targetOptionIndices) &&
        question.targetOptionIndices.every(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < question.options!.length,
        )))
  );
}

function isDraft(value: unknown): value is AssessmentDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<AssessmentDraft>;
  if (
    typeof draft.id !== 'string' ||
    typeof draft.language !== 'string' ||
    (draft.kind !== 'grammar' && draft.kind !== 'vocab') ||
    !Array.isArray(draft.lessonIds) ||
    draft.lessonIds.length === 0 ||
    !draft.lessonIds.every((id) => typeof id === 'string') ||
    !Array.isArray(draft.questions) ||
    draft.questions.length === 0 ||
    !draft.questions.every(isQuestion) ||
    !Number.isInteger(draft.index) ||
    !Number.isInteger(draft.correctCount) ||
    typeof draft.savedAt !== 'number'
  ) {
    return false;
  }
  if (
    draft.index! < 0 ||
    draft.index! >= draft.questions.length ||
    draft.correctCount! < 0 ||
    draft.correctCount! > draft.index!
  ) {
    return false;
  }
  const selectedValid =
    draft.selectedIndex === null ||
    (Number.isInteger(draft.selectedIndex) &&
      (draft.selectedIndex ?? -1) >= 0 &&
      (draft.selectedIndex ?? 0) < draft.questions[draft.index!].options.length);
  return (
    draft.id ===
      assessmentDraftId({
        language: draft.language,
        kind: draft.kind,
        lessonIds: draft.lessonIds,
      }) &&
    selectedValid
  );
}

function parseDrafts(raw: string | null, now: number): AssessmentDraft[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<StoredDrafts>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.drafts)) {
      console.warn('Ignored unsupported assessment draft storage');
      return [];
    }
    const valid = parsed.drafts.filter(isDraft);
    if (valid.length !== parsed.drafts.length) {
      console.warn('Removed malformed assessment draft data');
    }
    return valid
      .filter((draft) => now - draft.savedAt <= MAX_AGE_MS)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_DRAFTS);
  } catch (error) {
    console.warn('Could not read assessment draft data', error);
    return [];
  }
}

function readAll(now = Date.now()): AssessmentDraft[] {
  const target = storage();
  if (!target) return [];
  const drafts = parseDrafts(target.getItem(STORAGE_KEY), now);
  if (drafts.length === 0 && target.getItem(STORAGE_KEY)) {
    target.removeItem(STORAGE_KEY);
  }
  return drafts;
}

function writeAll(drafts: AssessmentDraft[]): boolean {
  const target = storage();
  if (!target) return false;
  try {
    if (drafts.length === 0) {
      target.removeItem(STORAGE_KEY);
    } else {
      const payload: StoredDrafts = {
        version: STORAGE_VERSION,
        drafts: drafts.slice(0, MAX_DRAFTS),
      };
      target.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    return true;
  } catch (error) {
    console.error('Could not save assessment draft', error);
    return false;
  }
}

export function readAssessmentDraft(
  identity: AssessmentDraftIdentity,
  now = Date.now(),
): AssessmentDraft | null {
  const id = assessmentDraftId(identity);
  return readAll(now).find((draft) => draft.id === id) ?? null;
}

export function listAssessmentDrafts(
  language?: string,
  now = Date.now(),
): AssessmentDraft[] {
  return readAll(now).filter(
    (draft) => language === undefined || draft.language === language,
  );
}

export function saveAssessmentDraft(
  identity: AssessmentDraftIdentity,
  state: Omit<
    AssessmentDraft,
    'id' | 'language' | 'kind' | 'lessonIds' | 'savedAt'
  >,
  now = Date.now(),
): boolean {
  const draft: AssessmentDraft = {
    ...state,
    id: assessmentDraftId(identity),
    language: identity.language,
    kind: identity.kind,
    lessonIds: [...identity.lessonIds],
    savedAt: now,
  };
  if (!isDraft(draft)) {
    console.error('Refused to save invalid assessment draft');
    return false;
  }
  const remaining = readAll(now).filter((item) => item.id !== draft.id);
  return writeAll([draft, ...remaining]);
}

export function deleteAssessmentDraft(
  identity: AssessmentDraftIdentity,
): boolean {
  const id = assessmentDraftId(identity);
  return writeAll(readAll().filter((draft) => draft.id !== id));
}
