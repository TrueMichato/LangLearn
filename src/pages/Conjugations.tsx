import { useState, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useXPStore } from '../stores/xpStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { JA_VERBS, JA_FORM_LABELS, type JaFormName } from '../data/conjugations/ja-verbs';
import { RU_VERBS, RU_VERB_FORM_LABELS, type RuVerbFormName } from '../data/conjugations/ru-verbs';
import { RU_NOUNS, RU_CASE_LABELS, type RuCaseName } from '../data/conjugations/ru-nouns';
import { RU_ADJECTIVES, RU_ADJ_CASE_LABELS, type RuAdjectiveCaseName } from '../data/conjugations/ru-adjectives';
import { PT_VERBS, PT_FORM_LABELS, type PtFormName } from '../data/conjugations/pt-verbs';
import { ES_VERBS, ES_FORM_LABELS, type EsFormName } from '../data/conjugations/es-verbs';
import { AR_VERBS, AR_FORM_LABELS, type ArVerbFormName } from '../data/conjugations/ar-verbs';
import { RO_VERBS, RO_FORM_LABELS, type RoFormName } from '../data/conjugations/ro-verbs';
import { RO_NOUNS, RO_CASE_LABELS, type RoCaseName } from '../data/conjugations/ro-nouns';
import { RO_ADJECTIVES, RO_ADJ_FORM_LABELS, type RoAdjFormName } from '../data/conjugations/ro-adjectives';
import TileDrill, { type DrillQuestion } from '../components/drills/TileDrill';
import TypeDrill from '../components/drills/TypeDrill';
import { useGuidedPractice } from '../hooks/useGuidedPractice';
import {
  GuidedCompletionActions,
  GuidedPracticeError,
  GuidedPracticeNotice,
} from '../components/learn/GuidedPractice';
import { useAdaptivePractice } from '../hooks/useAdaptivePractice';
import AdaptivePracticeNotice from '../components/common/AdaptivePracticeNotice';
import PracticeWordCapture from '../components/common/PracticeWordCapture';

type Category = 'ja-verbs' | 'ru-verbs' | 'ru-nouns' | 'ru-adjectives' | 'pt-verbs' | 'es-verbs' | 'ar-verbs' | 'ro-verbs' | 'ro-nouns' | 'ro-adjectives';
type DrillMode = 'tiles' | 'type';

const CATEGORIES: Record<string, { value: Category; label: string }[]> = {
  ja: [{ value: 'ja-verbs', label: 'Verb Conjugation' }],
  ru: [
    { value: 'ru-verbs', label: 'Verb Conjugation' },
    { value: 'ru-nouns', label: 'Noun Declension' },
    { value: 'ru-adjectives', label: 'Adjective Declension' },
  ],
  pt: [{ value: 'pt-verbs', label: 'Verb Conjugation' }],
  es: [{ value: 'es-verbs', label: 'Verb Conjugation' }],
  ar: [{ value: 'ar-verbs', label: 'Verb Conjugation' }],
  ro: [
    { value: 'ro-verbs', label: 'Verb Conjugation' },
    { value: 'ro-nouns', label: 'Noun Declension' },
    { value: 'ro-adjectives', label: 'Adjective Agreement' },
  ],
};

const SUPPORTED_LANGUAGES = ['ja', 'ru', 'pt', 'es', 'ar', 'ro'];

function getFormOptions(category: Category): { value: string; label: string }[] {
  switch (category) {
    case 'ja-verbs':
      return Object.entries(JA_FORM_LABELS)
        .filter(([k]) => k !== 'dictionary')
        .map(([value, label]) => ({ value, label }));
    case 'ru-verbs':
      return Object.entries(RU_VERB_FORM_LABELS).map(([value, label]) => ({ value, label }));
    case 'ru-nouns':
      return Object.entries(RU_CASE_LABELS).map(([value, label]) => ({ value, label }));
    case 'ru-adjectives':
      return Object.entries(RU_ADJ_CASE_LABELS).map(([value, label]) => ({ value, label }));
    case 'pt-verbs':
      return Object.entries(PT_FORM_LABELS).map(([value, label]) => ({ value, label }));
    case 'es-verbs':
      return Object.entries(ES_FORM_LABELS).map(([value, label]) => ({ value, label }));
    case 'ar-verbs':
      return Object.entries(AR_FORM_LABELS).map(([value, label]) => ({ value, label }));
    case 'ro-verbs':
      return Object.entries(RO_FORM_LABELS).map(([value, label]) => ({ value, label }));
    case 'ro-nouns':
      return Object.entries(RO_CASE_LABELS).map(([value, label]) => ({ value, label }));
    case 'ro-adjectives':
      return Object.entries(RO_ADJ_FORM_LABELS).map(([value, label]) => ({ value, label }));
  }
}

function buildQuestions(
  category: Category,
  selectedForms: string[],
): DrillQuestion[] {
  const questions: DrillQuestion[] = [];
  const validForms = new Set(getFormOptions(category).map((form) => form.value));
  selectedForms = selectedForms.filter((form) => validForms.has(form));

  if (category === 'ja-verbs') {
    const forms = selectedForms as JaFormName[];
    for (const verb of JA_VERBS) {
      for (const form of forms) {
        questions.push({
          prompt: `Conjugate 「${verb.dictionary}」 (${verb.meaning}) → ${JA_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'ja',
          lemma: verb.dictionary, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'ru-verbs') {
    const forms = selectedForms as RuVerbFormName[];
    for (const verb of RU_VERBS) {
      for (const form of forms) {
        if (verb.conjugations[form] === '—') continue;
        questions.push({
          prompt: `${verb.infinitive} (${verb.meaning}) → ${RU_VERB_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'ru',
          lemma: verb.infinitive, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'ru-nouns') {
    const cases = selectedForms as RuCaseName[];
    for (const noun of RU_NOUNS) {
      for (const c of cases) {
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RU_CASE_LABELS[c]} singular`,
          correctAnswer: noun.declensions[c].singular,
          language: 'ru',
          lemma: noun.nominative, meaning: noun.meaning,
        });
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RU_CASE_LABELS[c]} plural`,
          correctAnswer: noun.declensions[c].plural,
          language: 'ru',
          lemma: noun.nominative, meaning: noun.meaning,
        });
      }
    }
  } else if (category === 'ru-adjectives') {
    const cases = selectedForms as RuAdjectiveCaseName[];
    const genders = ['masculine', 'feminine', 'neuter', 'plural'] as const;
    const genderLabels = { masculine: 'masc.', feminine: 'fem.', neuter: 'neut.', plural: 'pl.' };
    for (const adj of RU_ADJECTIVES) {
      for (const c of cases) {
        for (const g of genders) {
          questions.push({
            prompt: `${adj.masculine_nom} (${adj.meaning}) → ${RU_ADJ_CASE_LABELS[c]} ${genderLabels[g]}`,
            correctAnswer: adj.declensions[c][g],
            language: 'ru',
            lemma: adj.masculine_nom, meaning: adj.meaning,
          });
        }
      }
    }
  } else if (category === 'pt-verbs') {
    const forms = selectedForms as PtFormName[];
    for (const verb of PT_VERBS) {
      for (const form of forms) {
        if (verb.conjugations[form] === '—') continue;
        questions.push({
          prompt: `${verb.infinitive} (${verb.meaning}) → ${PT_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'pt',
          lemma: verb.infinitive, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'es-verbs') {
    const forms = selectedForms as EsFormName[];
    for (const verb of ES_VERBS) {
      for (const form of forms) {
        if (verb.conjugations[form] === '—') continue;
        questions.push({
          prompt: `${verb.infinitive} (${verb.meaning}) → ${ES_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'es',
          lemma: verb.infinitive, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'ar-verbs') {
    const forms = selectedForms as ArVerbFormName[];
    for (const verb of AR_VERBS) {
      for (const form of forms) {
        if (verb.conjugations[form] === '—') continue;
        questions.push({
          prompt: `${verb.infinitive} (${verb.meaning}) → ${AR_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'ar',
          lemma: verb.infinitive, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'ro-verbs') {
    const forms = selectedForms as RoFormName[];
    for (const verb of RO_VERBS) {
      for (const form of forms) {
        if (verb.conjugations[form] === '—') continue;
        questions.push({
          prompt: `${verb.infinitive} (${verb.meaning}) → ${RO_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'ro',
          lemma: verb.infinitive, meaning: verb.meaning,
        });
      }
    }
  } else if (category === 'ro-nouns') {
    const cases = selectedForms as RoCaseName[];
    for (const noun of RO_NOUNS) {
      for (const c of cases) {
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RO_CASE_LABELS[c]} singular`,
          correctAnswer: noun.declensions[c].singular,
          language: 'ro',
          lemma: noun.nominative, meaning: noun.meaning,
        });
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RO_CASE_LABELS[c]} plural`,
          correctAnswer: noun.declensions[c].plural,
          language: 'ro',
          lemma: noun.nominative, meaning: noun.meaning,
        });
      }
    }
  } else if (category === 'ro-adjectives') {
    const forms = selectedForms as RoAdjFormName[];
    for (const adj of RO_ADJECTIVES) {
      for (const form of forms) {
        questions.push({
          prompt: `${adj.base} (${adj.meaning}) → ${RO_ADJ_FORM_LABELS[form]}`,
          correctAnswer: adj.forms[form],
          language: 'ro',
          lemma: adj.base, meaning: adj.meaning,
        });
      }
    }
  }

  return questions;
}

export default function ConjugationsPage() {
  const current = useCurrentLanguage(SUPPORTED_LANGUAGES);
  const { search } = useLocation();
  return <ConjugationsSession key={`${current.requested}/${search}`} current={current} />;
}

export function ConjugationsSession({ current: languageState }: { current: ReturnType<typeof useCurrentLanguage> }) {
  const addXP = useXPStore((s) => s.addXP);
  const {
    language: currentLanguage,
    setLanguage: setCurrentLanguage,
    options: supportedActive,
    requested,
    isSupported,
  } = languageState;
  const language = currentLanguage ?? 'ja';
  const [category, setCategory] = useState<Category>(CATEGORIES[language]?.[0]?.value ?? 'ja-verbs');
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<DrillMode>('tiles');
  const [drilling, setDrilling] = useState(false);
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  const formOptions = useMemo(() => getFormOptions(category), [category]);
  const guided = useGuidedPractice('conjugation', language);
  const adaptive = useAdaptivePractice<DrillQuestion>(language);
  const resetAdaptive = adaptive.reset;

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setCurrentLanguage(lang);
      const cats = CATEGORIES[lang];
      if (cats?.length) {
        setCategory(cats[0].value);
      }
      setSelectedForms(new Set());
    },
    [setCurrentLanguage],
  );

  const handleCategoryChange = useCallback((cat: Category) => {
    resetAdaptive();
    setCategory(cat);
    setSelectedForms(new Set());
  }, [resetAdaptive]);

  const toggleForm = useCallback((form: string) => {
    resetAdaptive();
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(form)) next.delete(form);
      else next.add(form);
      return next;
    });
  }, [resetAdaptive]);

  const selectAllForms = useCallback(() => {
    resetAdaptive();
    setSelectedForms(new Set(formOptions.map((f) => f.value)));
  }, [formOptions, resetAdaptive]);

  const startDrill = async () => {
    if (!isSupported || adaptive.status === 'loading') return;
    const forms =
      guided.descriptor?.scope?.forms ?? (guided.descriptor && selectedForms.size === 0
        ? formOptions.map((form) => form.value)
        : Array.from(selectedForms));
    const categories = guided.descriptor?.scope?.categories;
    let pool = categories && !categories.includes(category)
      ? [] : buildQuestions(category, [...forms]);
    const scope = guided.descriptor?.scope?.itemIds;
    if (scope) pool = pool.filter((item) => scope.includes(item.prompt));
    const q = await adaptive.start(pool, {
      seed: guided.descriptor?.seed ?? `${language}/${category}`,
      session: guided.descriptor?.session ?? { minItems: 1, targetItems: 10, maxItems: 10 },
    }, (item, index) => ({
      id: item.prompt, language: item.language,
      vocabulary: [{ surface: item.lemma ?? item.correctAnswer, lemma: item.lemma }],
      order: index,
    }));
    if (!q) return;
    setQuestions(q);
    setResult(null);
    setDrilling(true);
  };

  const handleComplete = useCallback(
    (correct: number, total: number) => {
      const xp = 20 + 3 * correct;
      addXP(xp);
      void guided.complete({
        itemsCompleted: total,
        score: Math.round((correct / total) * 100),
      });
      setResult({ correct, total });
      setDrilling(false);
    },
    [addXP, guided],
  );

  const resetDrill = useCallback(() => {
    setResult(null);
    setDrilling(false);
    setQuestions([]);
    resetAdaptive();
  }, [resetAdaptive]);

  if (guided.invalidMessage) {
    return <GuidedPracticeError message={guided.invalidMessage} />;
  }
  if (!isSupported && (drilling || result)) {
    return <LanguageUnavailable requested={requested} options={supportedActive} onChange={handleLanguageChange} feature="Conjugation drills" />;
  }
  if ((drilling || result) && adaptive.selection?.language !== language) {
    return <p role="status">Preparing this language…</p>;
  }

  // No supported languages active
  if (supportedActive.length === 0) {
    return (
      <div className="text-center py-12 page-enter">
        <p className="text-5xl mb-4">🔄</p>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Conjugation Drills
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Add Japanese or Russian in Settings to unlock conjugation drills.
        </p>
      </div>
    );
  }

  // Show summary
  if (result) {
    const xp = 20 + 3 * result.correct;
    const pct = Math.round((result.correct / result.total) * 100);
    return (
      <div className="max-w-md mx-auto space-y-6 py-4 page-enter">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 text-center space-y-4">
          <p className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Drill Complete!</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {result.correct} / {result.total}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{pct}% correct</p>
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">+{xp} XP</p>
        </div>
        <PracticeWordCapture language={language} source="conjugation" words={questions.map((question) => ({
          word: question.correctAnswer, lemma: question.lemma, meaning: question.meaning,
        }))} />
        <GuidedCompletionActions guided={guided} onPracticeAgain={resetDrill} />
        {!guided.isGuided && (
          <button
            onClick={resetDrill}
            className="w-full bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 press-feedback transition-colors"
          >
            Back to Setup
          </button>
        )}
      </div>
    );
  }

  // Drill mode
  if (drilling && questions.length > 0) {
    return (
      <div className="max-w-md mx-auto py-4 page-enter">
        <AdaptivePracticeNotice {...adaptive} />
        <button
          onClick={resetDrill}
          className="mb-4 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Back
        </button>
        {mode === 'tiles' ? (
          <TileDrill questions={questions} onComplete={handleComplete} />
        ) : (
          <TypeDrill questions={questions} onComplete={handleComplete} />
        )}
      </div>
    );
  }

  // Setup
  return (
    <div className="max-w-md mx-auto space-y-6 page-enter">
      <div>
        <Link to="/learn" className="inline-flex min-h-[44px] items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-3 hover:underline press-feedback inline-block">
          ← Back to Learn
        </Link>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Conjugation Drills
        </h2>
      </div>
      <GuidedPracticeNotice guided={guided} />
      <AdaptivePracticeNotice {...adaptive} />

      {!guided.descriptor && !isSupported && (
        <LanguageUnavailable
          requested={requested}
          options={supportedActive}
          onChange={handleLanguageChange}
          feature="Conjugation drills"
          plural
        />
      )}

      {!guided.descriptor && supportedActive.length > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Language</label>
          <LanguagePicker
            options={supportedActive}
            value={language}
            onChange={handleLanguageChange}
            label="Drill language"
          />
        </div>
      )}

      {/* Category selector */}
      {CATEGORIES[language] && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES[language].map((cat) => (
              <button
                key={cat.value}
                disabled={adaptive.status === 'loading' || (!!guided.descriptor?.scope?.categories && !guided.descriptor.scope.categories.includes(cat.value))}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form/case filter */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {category === 'ru-nouns' || category === 'ru-adjectives' ? 'Cases' : 'Forms'} to practice
          </label>
          <button
            disabled={!!guided.descriptor?.scope?.forms || adaptive.status === 'loading'}
            onClick={selectAllForms}
            className="inline-flex min-h-[44px] items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Select all
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formOptions.map((f) => (
            <button
              key={f.value}
              disabled={!!guided.descriptor?.scope?.forms || adaptive.status === 'loading'}
              onClick={() => toggleForm(f.value)}
              className={`px-3 py-1.5 min-h-[44px] rounded-lg text-sm transition-colors ${
                (guided.descriptor?.scope?.forms?.includes(f.value) ?? selectedForms.has(f.value))
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-4 space-y-2">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('tiles')}
            className={`flex-1 px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              mode === 'tiles'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            🧩 Tiles (Beginner)
          </button>
          <button
            onClick={() => setMode('type')}
            className={`flex-1 px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              mode === 'type'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            ⌨️ Type (Advanced)
          </button>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={startDrill}
        disabled={!isSupported || adaptive.status === 'loading' || (!guided.descriptor && selectedForms.size === 0)}
        className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed press-feedback transition-colors font-semibold text-lg"
      >
        Start Drill
      </button>
      {selectedForms.size === 0 && (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Select at least one {category === 'ru-nouns' || category === 'ru-adjectives' ? 'case' : 'form'} to begin
        </p>
      )}
    </div>
  );
}
