/**
 * The kinds of study the timer can record.
 *
 * Every surface that starts the timer must pick the key that matches what the
 * learner is actually doing. Letter drills and vocabulary lessons both used to
 * record themselves as `grammar`, which made the analytics activity balance
 * report time the learner never spent on grammar.
 */
export type StudyActivity =
  | 'srs'
  | 'reading'
  | 'grammar'
  | 'vocab'
  | 'letters'
  | 'listening';

/** Human labels. Never render a raw activity key in the UI. */
export const ACTIVITY_LABELS: Record<string, string> = {
  srs: 'Review',
  reading: 'Reading',
  grammar: 'Grammar',
  vocab: 'Vocabulary',
  letters: 'Letters',
  listening: 'Listening',
};

export const ACTIVITY_COLORS: Record<string, string> = {
  srs: 'bg-indigo-500',
  reading: 'bg-indigo-400',
  grammar: 'bg-indigo-300',
  vocab: 'bg-slate-400',
  letters: 'bg-slate-500',
  listening: 'bg-slate-300',
};

export function activityLabel(activity: string): string {
  return ACTIVITY_LABELS[activity] ?? activity;
}
