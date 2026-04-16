import { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { LANGUAGES } from '../../lib/languages';

const KNOWN_LANGUAGES = Object.values(LANGUAGES).map(l => ({ code: l.code, label: `${l.name} ${l.flag}` }));

const TOTAL_STEPS = 4;

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

  const steps = [
    // Step 1: Welcome
    <div key="welcome" className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        Welcome to LangLearn 🎓
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md">
        Your personal, kind language learning companion
      </p>

      <div className="w-full max-w-sm text-left">
        <p className="mb-3 font-medium text-gray-700 dark:text-gray-200">
          Which languages are you learning?
        </p>
        <div className="flex flex-col gap-2">
          {KNOWN_LANGUAGES.map((lang) => (
            <label
              key={lang.code}
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <input
                type="checkbox"
                checked={activeLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
                className="h-5 w-5 rounded accent-indigo-500"
              />
              <span className="text-gray-800 dark:text-gray-100">
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
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => removeLanguage(code)}
                  className="h-5 w-5 rounded accent-indigo-500"
                />
                <span className="text-gray-800 dark:text-gray-100">
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
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomLanguage}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-medium hover:bg-indigo-600 transition-colors"
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Build Your Vocabulary 📚
      </h1>
      <div className="max-w-md space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          Paste texts in the <strong className="text-gray-900 dark:text-white">Reader</strong>, click any word to save it to your personal dictionary.
        </p>
        <p>
          You can also add words manually from the <strong className="text-gray-900 dark:text-white">Words</strong> page.
        </p>
      </div>
      <div className="mt-2 text-5xl">📖 → 👆 → 💾</div>
    </div>,

    // Step 3: Spaced Repetition
    <div key="srs" className="flex flex-col items-center gap-6 text-center">
      <div className="text-7xl">🃏</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Review with Spaced Repetition 🃏
      </h1>
      <div className="max-w-md space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          The app schedules reviews automatically using the <strong className="text-gray-900 dark:text-white">SM-2 algorithm</strong>.
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Track Your Progress 📊
      </h1>
      <div className="max-w-md space-y-3 text-gray-600 dark:text-gray-300">
        <p>
          Earn <strong className="text-gray-900 dark:text-white">XP</strong> for study time, hit weekly goals, and build streaks!
        </p>
        <p className="text-indigo-600 dark:text-indigo-400 font-medium">
          No penalties for mistakes — just more practice! 💪
        </p>
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={completeOnboarding}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
        {/* Dots */}
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step
                  ? 'bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            className="w-full max-w-xs rounded-xl bg-indigo-500 py-3 text-lg font-semibold text-white hover:bg-indigo-600 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={completeOnboarding}
            className="w-full max-w-xs rounded-xl bg-indigo-500 py-3 text-lg font-semibold text-white hover:bg-indigo-600 transition-colors"
          >
            Get Started! 🚀
          </button>
        )}
      </div>
    </div>
  );
}
