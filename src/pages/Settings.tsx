import { useState } from 'react';
import DataSafetySection from '../components/settings/DataSafetySection';
import { useDatabaseBootContext } from '../hooks/database-boot-context';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import DeckExport from '../components/common/DeckExport';
import DeckImport from '../components/common/DeckImport';
import NotificationSettings from '../components/settings/NotificationSettings';
import ImmersionSection from '../components/settings/ImmersionSection';
import { SettingRange, SettingToggle } from '../components/settings/SettingControls';
import { LANGUAGES, getLanguageLabel } from '../lib/languages';
import { DIALECTS, DIALECT_CODES } from '../lib/arabic-dialects';
import { diagnoseTTS } from '../lib/tts';

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
      {icon} {label}
    </h3>
  );
}

const sectionCard =
  'bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/70 dark:border-white/10 p-4';

export default function SettingsPage() {
  const { weeklyGoalMinutes, setWeeklyGoal, dailyGoalMinutes, setDailyGoal, activeLanguages, addLanguage, removeLanguage, showStressMarks, toggleStressMarks, darkMode, toggleDarkMode, fontSize, setFontSize, ttsRate, setTtsRate, reviewBatchSize, setReviewBatchSize, adaptiveReview, toggleAdaptiveReview, scheduler, setScheduler, fsrsRequestRetention, setFsrsRequestRetention, arabicDialect, setArabicDialect, arabicColloquialFocus, setArabicColloquialFocus } =
    useSettingsStore();
  const { persistence } = useDatabaseBootContext();

  const languageOptions = Object.values(LANGUAGES);

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Settings</h2>

      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="🌐" label="Languages" />
        <p id="settings-active-languages" className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Languages you study
        </p>
        <div role="group" aria-labelledby="settings-active-languages" className="flex flex-wrap gap-2">
          {languageOptions.map((lang) => {
            const isActive = activeLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                id={`settings-language-${lang.code}`}
                name="activeLanguages"
                type="button"
                value={lang.code}
                aria-pressed={isActive}
                onClick={() =>
                  isActive
                    ? removeLanguage(lang.code)
                    : addLanguage(lang.code)
                }
                className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm transition-all duration-200 animate-[scaleIn_0.2s_ease-out] press-feedback ${
                  isActive
                    ? 'fill-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {getLanguageLabel(lang.code)}
              </button>
            );
          })}
        </div>

        {activeLanguages.includes('ru') && (
          <div className="border-t border-slate-200/70 dark:border-white/10 pt-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
              {getLanguageLabel('ru')} options
            </h4>
            <SettingToggle
              id="settings-stress-marks"
              label="Show stress marks"
              description="Display accent marks on stressed vowels in the Reader."
              checked={showStressMarks}
              onChange={toggleStressMarks}
            />
          </div>
        )}

        {activeLanguages.includes('ar') && (
          <div className="border-t border-slate-200/70 dark:border-white/10 pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {getLanguageLabel('ar')} options
            </h4>
            <div>
              <p id="settings-dialect-label" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Spoken dialect
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Everyone learns Modern Standard Arabic (fuṣḥā) as the shared core. Pick a spoken
                dialect to also see its everyday words, pronunciation notes and colloquial lessons.
              </p>
              <div role="group" aria-labelledby="settings-dialect-label" className="space-y-2">
                {DIALECT_CODES.map((code) => {
                  const d = DIALECTS[code];
                  const isActive = arabicDialect === code;
                  return (
                    <button
                      key={code}
                      id={`settings-dialect-${code}`}
                      name="arabicDialect"
                      type="button"
                      value={code}
                      onClick={() => setArabicDialect(code)}
                      className={`w-full min-h-[44px] text-left rounded-xl border px-3 py-2 transition-colors press-feedback ${
                        isActive
                          ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      aria-pressed={isActive}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-lg leading-none" aria-hidden="true">{d.flag}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{d.name}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300" dir="rtl">{d.nativeName}</span>
                        {isActive && <span aria-hidden="true" className="ml-auto text-indigo-600 dark:text-indigo-300 text-sm">✓</span>}
                      </span>
                      <span className="block text-xs text-slate-600 dark:text-slate-300 mt-1">{d.blurb}</span>
                      <span className="block text-xs text-slate-600 dark:text-slate-300 mt-0.5">{d.region}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <SettingToggle
              id="settings-colloquial-focus"
              label="Colloquial focus"
              description={<>Emphasize everyday spoken Arabic in your chosen dialect over formal fuṣḥā when both exist.
                {arabicDialect === 'msa' && ' Pick a dialect above to get the most from this.'}</>}
              checked={arabicColloquialFocus}
              onChange={() => setArabicColloquialFocus(!arabicColloquialFocus)}
            />
          </div>
        )}
      </section>

      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="🎯" label="Study goals" />
        <SettingRange
          id="settings-daily-goal"
          label="Daily study goal"
          description="A small daily target builds the habit. Tiny is fine — even 5 minutes counts."
          min={2}
          max={60}
          step={1}
          value={dailyGoalMinutes}
          valueText={`${dailyGoalMinutes} minutes per day`}
          onChange={setDailyGoal}
        />
        <SettingRange
          id="settings-weekly-goal"
          label="Weekly study goal"
          min={15}
          max={420}
          step={15}
          value={weeklyGoalMinutes}
          valueText={`${weeklyGoalMinutes} minutes per week`}
          onChange={setWeeklyGoal}
        />
      </section>

      <NotificationSettings />

      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="🃏" label="Reviews and scheduling" />
        <div>
          <p id="settings-batch-label" className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Cards per session
          </p>
          <div role="group" aria-labelledby="settings-batch-label" className="flex flex-wrap gap-2">
            {[10, 25, 50, 0].map((size) => (
              <button
                key={size}
                id={`settings-batch-${size}`}
                name="reviewBatchSize"
                type="button"
                value={size}
                aria-pressed={reviewBatchSize === size}
                aria-label={size === 0 ? 'All available cards' : `${size} cards`}
                onClick={() => setReviewBatchSize(size)}
                className={`flex-1 py-1.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-200 press-feedback ${
                  reviewBatchSize === size
                    ? 'fill-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {size === 0 ? 'All' : size}
              </button>
            ))}
          </div>
        </div>
        <SettingToggle
          id="settings-adaptive-review"
          label="Focus on tricky cards"
          description="Gently weight each session toward cards you find tricky. No penalties — just a little extra practice where it helps."
          checked={adaptiveReview}
          onChange={toggleAdaptiveReview}
        />
        <details className="border-t border-slate-200/70 dark:border-white/10 pt-2">
          <summary className="min-h-[44px] cursor-pointer py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            Advanced scheduling
          </summary>
          <p id="settings-scheduler-label" className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-2 mb-1">
            How review dates are chosen
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Classic (SM-2) uses a predictable interval schedule. Adaptive (FSRS) adjusts
            intervals to your recall of each card. Switching is safe — your existing cards carry over.
          </p>
          <div role="group" aria-labelledby="settings-scheduler-label" className="flex flex-wrap gap-2">
            {([
              { value: 'sm2', label: 'Classic (SM-2)' },
              { value: 'fsrs', label: 'Adaptive (FSRS)' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                id={`settings-scheduler-${opt.value}`}
                name="scheduler"
                type="button"
                value={opt.value}
                aria-pressed={scheduler === opt.value}
                onClick={() => setScheduler(opt.value)}
                className={`flex-1 py-1.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-200 press-feedback ${
                  scheduler === opt.value
                    ? 'fill-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {scheduler === 'fsrs' && (
            <div className="mt-3">
              <SettingRange
                id="settings-retention"
                label="Target recall"
                description="The recall level FSRS aims for (target retention). Higher means more frequent reviews; lower means fewer."
                min={0.8}
                max={0.97}
                step={0.01}
                value={fsrsRequestRetention}
                valueText={`${Math.round(fsrsRequestRetention * 100)}% target recall`}
                onChange={setFsrsRequestRetention}
              />
            </div>
          )}
        </details>
      </section>

      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="♿" label="Display, audio and accessibility" />
        <SettingToggle
          id="settings-dark-mode"
          label="Dark mode"
          description={darkMode ? 'Dark appearance is on.' : 'Light appearance is on.'}
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        <SettingRange
          id="settings-font-size"
          label="Content font size"
          min={14}
          max={24}
          step={1}
          value={fontSize}
          valueText={`${fontSize} pixels`}
          onChange={setFontSize}
        />
        <SettingRange
          id="settings-speech-speed"
          label="Speech speed"
          min={0.5}
          max={2.0}
          step={0.1}
          value={ttsRate}
          valueText={`${ttsRate.toFixed(1)} times normal speed`}
          onChange={setTtsRate}
        />
        <TTSDiagPanel />
      </section>

      <section aria-labelledby="settings-data-heading" className="space-y-4">
        <h3 id="settings-data-heading" className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Data and privacy
        </h3>
        <DataSafetySection persistence={persistence} />
        <section className={`${sectionCard} space-y-4`}>
          <SectionHeading icon="🌐" label="Share vocabulary decks" />
          <DeckExport />
          <hr className="border-slate-200 dark:border-slate-700" />
          <DeckImport />
        </section>
      </section>

      <ImmersionSection />
    </div>
  );
}

function TTSDiagPanel() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof diagnoseTTS>> | null>(null);
  const [testing, setTesting] = useState(false);
  const { language: currentLanguage } = useCurrentLanguage();
  const lang = currentLanguage ?? 'en';

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await diagnoseTTS(lang);
      setResult(r);
    } catch (e) {
      setResult({
        supported: false, voiceCount: 0, voicesForLang: [],
        tests: [{ label: 'exception', result: 'error', error: String(e) }],
        displayMode: 'unknown',
      });
    }
    setTesting(false);
  };

  return (
    <details className="border-t border-slate-200/70 dark:border-white/10 pt-2">
      <summary className="min-h-[44px] cursor-pointer py-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50">
        Speech troubleshooting
      </summary>
      <div className="space-y-3 mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Runs 4 text-to-speech (TTS) tests with different configurations for {getLanguageLabel(lang)}.
        </p>
        <button
          onClick={runTest}
          disabled={testing}
          className="w-full min-h-[44px] fill-primary text-white py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity press-feedback disabled:opacity-50"
        >
          {testing ? '⏳ Testing speech…' : '▶ Test speech playback'}
        </button>
        {result && (
          <div role="status" className="bg-slate-100 dark:bg-slate-700 rounded-xl p-3 text-xs font-mono space-y-2 text-slate-700 dark:text-slate-300 break-words">
            <p>mode: {result.displayMode}</p>
            <p>voices: {result.voiceCount} total, {result.voicesForLang.length} for {getLanguageLabel(lang)}</p>
            {result.voicesForLang.length > 0 && (
              <p className="text-xs">{result.voicesForLang.join(', ')}</p>
            )}
            <hr className="border-slate-300 dark:border-slate-600" />
            {result.tests.map((t, i) => (
              <div key={i} className="rounded-lg border border-slate-300/70 dark:border-slate-600 p-2">
                <p className={t.result === 'started' ? 'text-green-800 dark:text-green-300 font-bold' : 'text-amber-800 dark:text-amber-300 font-bold'}>
                  Test {i + 1}: {t.result}
                </p>
                <p className="text-xs">{t.label}</p>
                {t.error && <p className="text-xs">↳ {t.error}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
