import { useState, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useXPStore } from '../stores/xpStore';
import { getLanguageLabel } from '../lib/languages';
import { JA_VERBS, JA_FORM_LABELS, type JaFormName } from '../data/conjugations/ja-verbs';
import { RU_VERBS, RU_VERB_FORM_LABELS, type RuVerbFormName } from '../data/conjugations/ru-verbs';
import { RU_NOUNS, RU_CASE_LABELS, type RuCaseName } from '../data/conjugations/ru-nouns';
import TileDrill, { type DrillQuestion } from '../components/drills/TileDrill';
import TypeDrill from '../components/drills/TypeDrill';

type Category = 'ja-verbs' | 'ru-verbs' | 'ru-nouns';
type DrillMode = 'tiles' | 'type';

const CATEGORIES: Record<string, { value: Category; label: string }[]> = {
  ja: [{ value: 'ja-verbs', label: 'Verb Conjugation' }],
  ru: [
    { value: 'ru-verbs', label: 'Verb Conjugation' },
    { value: 'ru-nouns', label: 'Noun Declension' },
  ],
};

const SUPPORTED_LANGUAGES = ['ja', 'ru'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  }
}

function buildQuestions(category: Category, selectedForms: string[]): DrillQuestion[] {
  const questions: DrillQuestion[] = [];

  if (category === 'ja-verbs') {
    const forms = selectedForms as JaFormName[];
    for (const verb of JA_VERBS) {
      for (const form of forms) {
        questions.push({
          prompt: `Conjugate 「${verb.dictionary}」 (${verb.meaning}) → ${JA_FORM_LABELS[form]}`,
          correctAnswer: verb.conjugations[form],
          language: 'ja',
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
        });
      }
    }
  } else {
    const cases = selectedForms as RuCaseName[];
    for (const noun of RU_NOUNS) {
      for (const c of cases) {
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RU_CASE_LABELS[c]} singular`,
          correctAnswer: noun.declensions[c].singular,
          language: 'ru',
        });
        questions.push({
          prompt: `${noun.nominative} (${noun.meaning}) → ${RU_CASE_LABELS[c]} plural`,
          correctAnswer: noun.declensions[c].plural,
          language: 'ru',
        });
      }
    }
  }

  return shuffle(questions).slice(0, 10);
}

export default function ConjugationsPage() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const addXP = useXPStore((s) => s.addXP);

  const supportedActive = useMemo(
    () => activeLanguages.filter((l) => SUPPORTED_LANGUAGES.includes(l)),
    [activeLanguages],
  );

  const [language, setLanguage] = useState(supportedActive[0] ?? 'ja');
  const [category, setCategory] = useState<Category>(CATEGORIES[language]?.[0]?.value ?? 'ja-verbs');
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<DrillMode>('tiles');
  const [drilling, setDrilling] = useState(false);
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);

  const formOptions = useMemo(() => getFormOptions(category), [category]);

  const handleLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      const cats = CATEGORIES[lang];
      if (cats?.length) {
        setCategory(cats[0].value);
      }
      setSelectedForms(new Set());
    },
    [],
  );

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    setSelectedForms(new Set());
  }, []);

  const toggleForm = useCallback((form: string) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      if (next.has(form)) next.delete(form);
      else next.add(form);
      return next;
    });
  }, []);

  const selectAllForms = useCallback(() => {
    setSelectedForms(new Set(formOptions.map((f) => f.value)));
  }, [formOptions]);

  const startDrill = useCallback(() => {
    const forms = Array.from(selectedForms);
    if (forms.length === 0) return;
    const q = buildQuestions(category, forms);
    setQuestions(q);
    setResult(null);
    setDrilling(true);
  }, [selectedForms, category]);

  const handleComplete = useCallback(
    (correct: number, total: number) => {
      const xp = 20 + 3 * correct;
      addXP(xp);
      setResult({ correct, total });
      setDrilling(false);
    },
    [addXP],
  );

  const resetDrill = useCallback(() => {
    setResult(null);
    setDrilling(false);
    setQuestions([]);
  }, []);

  // No supported languages active
  if (supportedActive.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4">🔄</p>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Conjugation Drills
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
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
      <div className="max-w-md mx-auto space-y-6 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center space-y-4">
          <p className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</p>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Drill Complete!</h2>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {result.correct} / {result.total}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pct}% correct</p>
          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">+{xp} XP</p>
        </div>
        <button
          onClick={resetDrill}
          className="w-full bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Back to Setup
        </button>
      </div>
    );
  }

  // Drill mode
  if (drilling && questions.length > 0) {
    return (
      <div className="max-w-md mx-auto py-4">
        <button
          onClick={resetDrill}
          className="mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        Conjugation Drills
      </h2>

      {/* Language selector */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Language</label>
        <div className="flex gap-2 flex-wrap">
          {supportedActive.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                language === lang
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {getLanguageLabel(lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Category selector */}
      {CATEGORIES[language] && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES[language].map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  category === cat.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form/case filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {category === 'ru-nouns' ? 'Cases' : 'Forms'} to practice
          </label>
          <button
            onClick={selectAllForms}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Select all
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => toggleForm(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedForms.has(f.value)
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-2">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('tiles')}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'tiles'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🧩 Tiles (Beginner)
          </button>
          <button
            onClick={() => setMode('type')}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'type'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ⌨️ Type (Advanced)
          </button>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={startDrill}
        disabled={selectedForms.size === 0}
        className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
      >
        Start Drill
      </button>
      {selectedForms.size === 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500">
          Select at least one {category === 'ru-nouns' ? 'case' : 'form'} to begin
        </p>
      )}
    </div>
  );
}
