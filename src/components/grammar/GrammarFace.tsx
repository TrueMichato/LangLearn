import type { ReactNode, Ref } from 'react';
import { filledBlankParts, hasBlank } from '../../lib/grammar-cards';
import { isReviewedGrammarLesson } from '../../lib/grammar-review-scope';
import type { GrammarReviewItem } from '../../lib/lesson-review';
import { isRTL, rtlProps } from '../../lib/rtl';

type FaceFields = Pick<GrammarReviewItem, 'prompt' | 'hint' | 'answer' | 'explanation' | 'rule'> &
  Partial<Pick<GrammarReviewItem, 'format' | 'provenance' | 'learnerEdited'>>;

// An English question can quote Arabic (and an Arabic example can quote English).
function direction(text: string, language: string) {
  const firstLetter = text.match(/\p{Letter}/u)?.[0];
  if (!firstLetter) return rtlProps(language);
  return { dir: /\p{Script=Arabic}/u.test(firstLetter) ? 'rtl' : 'ltr' };
}

const mainText = 'whitespace-pre-line break-words text-[length:var(--app-font-size)] leading-relaxed text-slate-800 dark:text-slate-100';
const supportingText = 'whitespace-pre-line break-words text-[length:var(--app-font-size)] leading-relaxed text-slate-600 dark:text-slate-300';
const disclosure = 'min-h-[44px] cursor-pointer py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400';

export default function GrammarFace({ card, side, language, lessonId, focusRef, comparison }: {
  card: FaceFields;
  side: 'front' | 'back';
  language: string;
  lessonId?: string | null;
  focusRef?: Ref<HTMLParagraphElement>;
  comparison?: ReactNode;
}) {
  const { prompt, hint, answer, explanation, rule } = card;
  const question = prompt || (rule !== answer ? rule : '') || 'Recall the grammar point.';
  const cloze = card.format !== 'qa' && hasBlank(prompt);
  const focus = { ref: focusRef, tabIndex: focusRef ? -1 : undefined };

  if (side === 'front') {
    // Only reviewed lessons are authored to put every necessary cue in the prompt.
    // The Russian pilot's one previously authored primer can still be in an unrefreshed deck.
    const oldPrimer = language === 'ru' && lessonId === 'spelling-rules' && hint === 'кни́га → plural';
    const optional = hint && isReviewedGrammarLesson(language, lessonId) &&
      card.provenance === 'authored' && !card.learnerEdited && !oldPrimer;
    return <div className="space-y-2">
      <p {...focus} className={`${mainText} focus-ring font-medium`} {...direction(question, language)}>{question}</p>
      {optional ? <details>
        <summary className={disclosure}>Show a hint</summary>
        <p className={supportingText} {...direction(hint, language)}>{hint}</p>
      </details> : hint && <p className={supportingText} {...direction(hint, language)}>{hint}</p>}
    </div>;
  }

  const usefulRule = rule !== question && rule !== answer ? rule : '';
  const reason = explanation && explanation !== answer && explanation !== question ? explanation : usefulRule;
  const additionalRule = usefulRule && usefulRule !== reason;
  const parts = cloze && answer ? filledBlankParts(prompt, answer) : null;
  return <div className="space-y-3">
    {parts ? (
      <p {...focus} className={`${mainText} focus-ring`} {...direction(parts.map((part) => part.text).join(''), language)}>
        {parts.map((part, i) => part.target
          ? <strong key={i} className={`text-indigo-700 dark:text-indigo-300 ${isRTL(language) ? 'font-normal underline underline-offset-4' : 'font-bold'}`}>{part.text}</strong>
          : part.text)}
      </p>
    ) : <>
      <p className={supportingText} {...direction(question, language)}>{question}</p>
      <p {...focus} className={`${mainText} focus-ring font-semibold`} {...direction(answer, language)}>{answer || 'Your answer'}</p>
    </>}
    {comparison}
    {reason && <p className={supportingText} {...direction(reason, language)}>{reason}</p>}
    {additionalRule && <details>
      <summary className={disclosure}>More about the rule</summary>
      <p className={supportingText} {...direction(rule, language)}>{rule}</p>
    </details>}
  </div>;
}
