import { summarizeVocabAttempt, type VocabLessonAttempt } from '../../lib/vocab-lesson-attempt';
import { vocabExerciseSize } from '../../lib/vocab-lesson-state';

const LABELS = {
  match: 'Matching', 'fill-blank': 'Fill in the blank', 'multiple-choice': 'Quiz',
  typing: 'Typing', listening: 'Listening',
};

export default function VocabLessonProgress({ attempt }: { attempt: VocabLessonAttempt }) {
  const place = summarizeVocabAttempt(attempt);
  const stage = attempt.step === 'words' ? 1 : attempt.exerciseIndex + 2;
  return (
    <div className="mb-4 space-y-1">
      <p className="font-medium text-slate-800 dark:text-slate-100">
        {place.stage} {place.position} of {place.itemCount}
        <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> · Stage {stage} of {attempt.exercises.length + 1}</span>
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Whole lesson: {attempt.lesson.words.length} words
        {attempt.exercises.map((exercise, index) => (
          <span key={index}> · {LABELS[exercise.type]} ({vocabExerciseSize(exercise)} {exercise.type === 'match'
            ? vocabExerciseSize(exercise) === 1 ? 'pair' : 'pairs'
            : vocabExerciseSize(exercise) === 1 ? 'question' : 'questions'})</span>
        ))}
      </p>
    </div>
  );
}
