import { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { LANGUAGES } from '../../lib/languages';

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
                ? 'gradient-primary'
                : i === current
                  ? 'gradient-primary shadow-md shadow-indigo-500/30'
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

  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const addLanguage = useSettingsStore((s) => s.addLanguage);
  const removeLanguage = useSettingsStore((s) => s.removeLanguage);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

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

  const gradientHeading = 'text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent';

  const steps = [
    // Step 1: Welcome
    <div key="welcome" className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
        Welcome to LangLearn 🎓
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md">
        Your personal, kind language learning companion
      </p>

      <div className="w-full max-w-sm text-left">
        <p className="mb-3 font-medium text-slate-700 dark:text-slate-200">
          Which languages are you learning?
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
            <input
              ref={customInputRef}
              type="text"
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomLanguage()}
              placeholder="Add another language…"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomLanguage}
              className="rounded-lg gradient-primary px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity press-feedback"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>,

    // Step 2: Vocabulary
    <div key="vocabulary" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">📚</div>
      <h1 className={gradientHeading}>
        Build Your Vocabulary 📚
      </h1>
      <div className="max-w-md space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          Paste texts in the <strong className="text-slate-900 dark:text-white">Reader</strong>, click any word to save it to your personal dictionary.
        </p>
        <p>
          You can also add words manually from the <strong className="text-slate-900 dark:text-white">Words</strong> page.
        </p>
      </div>
      <div className="mt-2 text-5xl">📖 → 👆 → 💾</div>
    </div>,

    // Step 3: Spaced Repetition
    <div key="srs" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">🃏</div>
      <h1 className={gradientHeading}>
        Review with Spaced Repetition 🃏
      </h1>
      <div className="max-w-md space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          The app schedules reviews automatically using the <strong className="text-slate-900 dark:text-white">SM-2 algorithm</strong>.
        </p>
        <p>
          Cards get easier over time as you learn. Multiple card types keep it fresh!
        </p>
      </div>
      <div className="mt-2 text-5xl">🧠 ✨ 📈</div>
    </div>,

    // Step 4: Progress
    <div key="progress" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">📊</div>
      <h1 className={gradientHeading}>
        Track Your Progress 📊
      </h1>
      <div className="max-w-md space-y-3 text-slate-600 dark:text-slate-300">
        <p>
          Earn <strong className="text-slate-900 dark:text-white">XP</strong> for study time, hit weekly goals, and build streaks!
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-medium">
          No penalties for mistakes — just more practice! 💪
        </p>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={completeOnboarding}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Skip
        </button>
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

        {/* Action button */}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            className="w-full max-w-xs rounded-xl gradient-primary py-3 text-lg font-semibold text-white hover:opacity-90 transition-opacity press-feedback"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={completeOnboarding}
            className="relative overflow-hidden w-full max-w-xs rounded-xl gradient-primary py-3 text-lg font-semibold text-white hover:opacity-90 transition-opacity press-feedback shimmer-btn"
          >
            <span className="relative z-10">Get Started! 🚀</span>
          </button>
        )}
      </div>
    </div>
  );
}
