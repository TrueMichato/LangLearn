import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { LANGUAGES, getLanguageLabel } from '../../lib/languages';
import StartingPoints from './StartingPoints';
import type { StartingPoint } from '../../lib/starting-points';

const KNOWN_LANGUAGES = Object.values(LANGUAGES).map(l => ({ code: l.code, label: `${l.name} ${l.flag}` }));

const TOTAL_STEPS = 4;

function StepIndicators({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          {/* Dot */}
          <div
            className={`relative h-3 w-3 rounded-full transition-all duration-300 flex items-center justify-center ${
              i < current
                ? 'fill-primary'
                : i === current
                  ? 'fill-primary shadow-md shadow-indigo-500/30'
                  : 'border-2 border-slate-300 dark:border-slate-600 bg-transparent'
            }`}
          >
            {i < current && (
              <svg className="h-2 w-2 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {/* Connecting line */}
          {i < total - 1 && (
            <div
              className={`w-8 h-0.5 transition-colors duration-300 ${
                i < current ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const [customLang, setCustomLang] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const addLanguage = useSettingsStore((s) => s.addLanguage);
  const removeLanguage = useSettingsStore((s) => s.removeLanguage);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const hasLanguage = activeLanguages.length > 0;
  const firstLanguage = activeLanguages[0];

  const toggleLanguage = (code: string) => {
    if (activeLanguages.includes(code)) {
      removeLanguage(code);
    } else {
      addLanguage(code);
    }
  };

  const addCustomLanguage = () => {
    const trimmed = customLang.trim().toLowerCase();
    if (trimmed && !activeLanguages.includes(trimmed)) {
      addLanguage(trimmed);
    }
    setCustomLang('');
    customInputRef.current?.focus();
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  // The hand-off: onboarding ends inside a lesson, not on an empty dashboard.
  const startHere = (point: StartingPoint) => {
    completeOnboarding();
    navigate(point.route);
  };

  const heading = 'text-3xl font-bold text-indigo-600 dark:text-indigo-400';

  const steps = [
    // Step 1: Welcome
    <div key="welcome" className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
        Welcome to LangLearn 🎓
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md">
        A kind way to learn a language, a few minutes at a time
      </p>

      <div className="w-full max-w-sm text-left">
        <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
          Which languages are you learning?
        </p>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Pick at least one. You can add more later.
        </p>
        <div className="flex flex-col gap-2">
          {KNOWN_LANGUAGES.map((lang) => (
            <label
              key={lang.code}
              className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={activeLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
                className="h-5 w-5 rounded accent-indigo-500"
              />
              <span className="text-slate-800 dark:text-slate-100">
                {lang.label}
              </span>
            </label>
          ))}

          {/* Custom languages already added */}
          {activeLanguages
            .filter((l) => !KNOWN_LANGUAGES.some((k) => k.code === l))
            .map((code) => (
              <label
                key={code}
                className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => removeLanguage(code)}
                  className="h-5 w-5 rounded accent-indigo-500"
                />
                <span className="text-slate-800 dark:text-slate-100">
                  {code}
                </span>
              </label>
            ))}

          <div className="flex gap-2 mt-1">
            <label htmlFor="onboarding-custom-language" className="sr-only">
              Add another language
            </label>
            <input
              ref={customInputRef}
              id="onboarding-custom-language"
              name="customLanguage"
              type="text"
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomLanguage()}
              placeholder="Add another language…"
              className="flex-1 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomLanguage}
              className="min-h-[44px] rounded-lg fill-primary px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity press-feedback"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>,

    // Step 2: What a session actually looks like
    <div key="lessons" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">📚</div>
      <h1 className={heading}>Short lessons, one at a time</h1>
      <div className="max-w-md space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          A lesson takes about two minutes: a handful of words, a few real
          examples, and a quick check that it stuck.
        </p>
        <p>
          Lessons unlock in order, so you never have to decide what to study
          next.
        </p>
      </div>
      <div className="mt-2 text-5xl">🔤 → ✨ → 📖</div>
    </div>,

    // Step 3: Reviews, in plain language
    <div key="reviews" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">🃏</div>
      <h1 className={heading}>Reviews come back at the right time</h1>
      <div className="max-w-md space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          Everything you learn turns into a review card. The app brings each one
          back just before you'd forget it — you only have to show up.
        </p>
        <p className="font-medium text-indigo-600 dark:text-indigo-400">
          Got one wrong? You'll simply see it again sooner. No penalties, ever.
          💪
        </p>
      </div>
    </div>,

    // Step 4: The hand-off
    <div key="start" className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className={heading}>Where would you like to start?</h1>
        {firstLanguage && (
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            in {getLanguageLabel(firstLanguage)}
          </p>
        )}
      </div>
      {firstLanguage && (
        <StartingPoints language={firstLanguage} onSelect={startHere} />
      )}
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] app-surface flex flex-col">
      {/* Skip — only once a language is chosen, so nobody lands language-less */}
      <div className="flex justify-end p-4">
        {hasLanguage && (
          <button
            type="button"
            onClick={completeOnboarding}
            className="min-h-[44px] px-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Skip
          </button>
        )}
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          {steps.map((content, i) => (
            <div
              key={i}
              className="w-full flex-shrink-0 flex items-center justify-center px-6"
              aria-hidden={i !== step}
              inert={i !== step}
            >
              {content}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 pb-8 px-6">
        {/* Step indicators */}
        <StepIndicators current={step} total={TOTAL_STEPS} />

        {/* Action button — the last step is chosen from the options above */}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!hasLanguage}
            className="w-full max-w-xs min-h-[44px] rounded-xl fill-primary py-3 text-lg font-semibold text-white hover:opacity-90 transition-opacity press-feedback disabled:cursor-not-allowed disabled:opacity-40"
          >
            {hasLanguage ? 'Next →' : 'Pick a language to continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={completeOnboarding}
            className="min-h-[44px] px-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            I'll look around first
          </button>
        )}
      </div>
    </div>
  );
}
