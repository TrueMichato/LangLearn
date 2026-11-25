import { useId, useState } from 'react';
import { hasBlank } from '../../lib/grammar-cards';
import type { GrammarReviewItem, LessonReviewItem } from '../../lib/lesson-review';
import { rtlProps } from '../../lib/rtl';
import GrammarFace from './GrammarFace';

export function LessonReviewPreview({ item, language, lessonId }: { item: LessonReviewItem; language: string; lessonId?: string }) {
  return (
    <dl className="space-y-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900/50">
      <div>
        <dt className="mb-1 font-medium text-slate-600 dark:text-slate-300">Front</dt>
        <dd className="break-words text-slate-800 dark:text-slate-100">
          {item.kind === 'vocabulary' ? (
            <>
              <span {...rtlProps(language)} className="block">{item.word || 'Your word or phrase'}</span>
              {item.reading && <span dir="auto" className="mt-1 block text-slate-600 dark:text-slate-300">{item.reading}</span>}
            </>
          ) : (
            <GrammarFace card={item} side="front" language={language} lessonId={lessonId} />
          )}
        </dd>
      </div>
      <div className="border-t border-slate-200/70 pt-3 dark:border-white/10">
        <dt className="mb-1 font-medium text-slate-600 dark:text-slate-300">Back</dt>
        <dd className="space-y-2 break-words text-slate-800 dark:text-slate-100">
          {item.kind === 'vocabulary' ? <>
            <p dir="auto">{item.meaning || 'Your meaning'}</p>
            {item.contextSentence && <p {...rtlProps(language)}>{item.contextSentence}</p>}
          </> : (
            <GrammarFace card={item} side="back" language={language} />
          )}
        </dd>
      </div>
    </dl>
  );
}

interface LessonReviewEditorProps {
  item: GrammarReviewItem;
  language: string;
  lessonId?: string;
  onCommit: (item: GrammarReviewItem) => void;
  onCancel: () => void;
}

export default function LessonReviewEditor({ item, language, lessonId, onCommit, onCancel }: LessonReviewEditorProps) {
  const [draft, setDraft] = useState(item);
  const [error, setError] = useState('');
  const id = useId();
  const fieldClass = 'mt-1 w-full min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';
  const change = (patch: Partial<GrammarReviewItem>) => {
    setDraft((previous) => ({ ...previous, ...patch, learnerEdited: true }));
    setError('');
  };

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      if (!draft.prompt.trim() || !draft.answer.trim()) {
        setError('Add a question and an answer before continuing.');
        return;
      }
      if (draft.format === 'cloze' && !hasBlank(draft.prompt)) {
        setError('Use ___ in the example to show where the answer belongs.');
        return;
      }
      onCommit({
        ...draft,
        prompt: draft.prompt.trim(),
        answer: draft.answer.trim(),
        explanation: draft.explanation.trim(),
        rule: draft.rule.trim() || (draft.kind === 'concept' ? 'Personal concept' : 'Personal rule'),
        learnerEdited: true,
      });
    }}>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Make one small recall task. Your wording stays yours, even if the lesson changes.
      </p>
      <label className="block text-sm text-slate-700 dark:text-slate-200" htmlFor={`${id}-kind`}>
        Item type
        <select id={`${id}-kind`} className={fieldClass} value={draft.kind}
          onChange={(event) => change({ kind: event.target.value as GrammarReviewItem['kind'] })}>
          <option value="rule">Rule application</option>
          <option value="concept">Concept or distinction</option>
        </select>
      </label>
      <label className="block text-sm text-slate-700 dark:text-slate-200" htmlFor={`${id}-format`}>
        Review format
        <select id={`${id}-format`} className={fieldClass} value={draft.format}
          onChange={(event) => change({ format: event.target.value as GrammarReviewItem['format'] })}>
          <option value="qa">Question and answer</option>
          <option value="cloze">Fill in the blank</option>
        </select>
      </label>
      <label className="block text-sm text-slate-700 dark:text-slate-200" htmlFor={`${id}-question`}>
        {draft.format === 'cloze' ? 'Example with a blank (___)' : 'Question'}
        <textarea id={`${id}-question`} className={fieldClass} dir="auto" rows={3}
          value={draft.prompt} onChange={(event) => change({ prompt: event.target.value })}
          aria-describedby={error ? `${id}-error` : undefined} required />
      </label>
      <label className="block text-sm text-slate-700 dark:text-slate-200" htmlFor={`${id}-answer`}>
        Answer
        <textarea id={`${id}-answer`} className={fieldClass} dir="auto" rows={2}
          value={draft.answer} onChange={(event) => change({ answer: event.target.value })} required />
      </label>
      <label className="block text-sm text-slate-700 dark:text-slate-200" htmlFor={`${id}-explanation`}>
        Explanation (optional)
        <textarea id={`${id}-explanation`} className={fieldClass} dir="auto" rows={2}
          value={draft.explanation} onChange={(event) => change({ explanation: event.target.value })} />
      </label>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-amber-800 dark:text-amber-300">{error}</p>}
      <LessonReviewPreview item={draft} language={language} lessonId={lessonId} />
      <p className="text-xs text-slate-500 dark:text-slate-400">This preview is local. Nothing is saved until you confirm Save in the picker.</p>
      <button type="submit"
        className="w-full min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
        Use this item
      </button>
      <button type="button" onClick={onCancel}
        className="w-full min-h-[44px] rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
        Cancel editing
      </button>
    </form>
  );
}
