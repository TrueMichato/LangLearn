import { useState, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { exportAllData, importAllData, downloadJson } from '../db/backup';
import DeckExport from '../components/common/DeckExport';
import DeckImport from '../components/common/DeckImport';
import NotificationSettings from '../components/settings/NotificationSettings';
import { LANGUAGES, getLanguageLabel } from '../lib/languages';

function SectionHeading({ icon, label }: { icon: string; label: string }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
      {icon} {label}
    </h3>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        checked ? 'gradient-primary' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const sectionCard =
  'bg-white dark:bg-slate-800/90 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 p-4';

export default function SettingsPage() {
  const { weeklyGoalMinutes, setWeeklyGoal, activeLanguages, addLanguage, removeLanguage, showStressMarks, toggleStressMarks, darkMode, toggleDarkMode, fontSize, setFontSize, ttsRate, setTtsRate, reviewBatchSize, setReviewBatchSize } =
    useSettingsStore();
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const json = await exportAllData();
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(json, `langlearn-backup-${date}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importAllData(text);
      setImportStatus('✅ Data imported successfully!');
    } catch {
      setImportStatus('❌ Import failed. Check file format.');
    }
  };

  const languageOptions = Object.values(LANGUAGES);

  return (
    <div className="space-y-6 page-enter">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Settings</h2>

      {/* Appearance */}
      <section className={sectionCard}>
        <SectionHeading icon="🎨" label="Appearance" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{darkMode ? 'Dark mode' : 'Light mode'}</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="text-2xl p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors press-feedback"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <NotificationSettings />

      {/* Languages */}
      <section className={sectionCard}>
        <SectionHeading icon="🌐" label="Languages" />

        {/* Weekly Study Goal */}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Weekly Study Goal</p>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="range"
            min={15}
            max={420}
            step={15}
            value={weeklyGoalMinutes}
            onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            className="flex-1 accent-indigo-600 dark:accent-indigo-400"
          />
          <span className="text-sm font-mono w-16 text-right text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2 py-0.5">
            {weeklyGoalMinutes >= 60
              ? `${Math.floor(weeklyGoalMinutes / 60)}h${weeklyGoalMinutes % 60 ? ` ${weeklyGoalMinutes % 60}m` : ''}`
              : `${weeklyGoalMinutes}m`}
          </span>
        </div>

        {/* Active Languages */}
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Active Languages</p>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((lang) => {
            const isActive = activeLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() =>
                  isActive
                    ? removeLanguage(lang.code)
                    : addLanguage(lang.code)
                }
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 animate-[scaleIn_0.2s_ease-out] press-feedback ${
                  isActive
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {getLanguageLabel(lang.code)}
              </button>
            );
          })}
        </div>
      </section>

      {/* Accessibility */}
      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="♿" label="Accessibility" />

        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">Content font size</p>
            <span
              className="text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2 py-0.5"
              style={{ fontSize: fontSize + 'px' }}
            >
              {fontSize}px
            </span>
          </div>
          <input
            type="range"
            min={14}
            max={24}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-indigo-600 dark:accent-indigo-400"
          />
        </div>

        {/* TTS Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">TTS speed</p>
            <span className="text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 rounded-lg px-2 py-0.5">
              {ttsRate.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={ttsRate}
            onChange={(e) => setTtsRate(Number(e.target.value))}
            className="w-full accent-indigo-600 dark:accent-indigo-400"
          />
        </div>

        {/* Review Batch Size */}
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">Review batch size</p>
          <div className="flex gap-2">
            {[10, 25, 50, 0].map((size) => (
              <button
                key={size}
                onClick={() => setReviewBatchSize(size)}
                className={`flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 press-feedback ${
                  reviewBatchSize === size
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {size === 0 ? 'All' : size}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Decks */}
      <section className={`${sectionCard} space-y-4`}>
        <SectionHeading icon="🌐" label="Decks" />
        <DeckExport />
        <hr className="border-slate-200 dark:border-slate-700" />
        <DeckImport />
      </section>

      {/* Russian Features */}
      {activeLanguages.includes('ru') && (
        <section className={sectionCard}>
          <SectionHeading icon="🌐" label="Russian Features" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200">Show stress marks (ударе&#x0301;ние)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Display accent marks on stressed vowels in the Reader</p>
            </div>
            <Toggle checked={showStressMarks} onChange={toggleStressMarks} />
          </div>
        </section>
      )}

      {/* Backup */}
      <section className={sectionCard}>
        <SectionHeading icon="💾" label="Data" />
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors press-feedback"
          >
            📥 Export all data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors press-feedback"
          >
            📤 Import from file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          {importStatus && (
            <p className="text-sm text-center text-slate-600 dark:text-slate-300">{importStatus}</p>
          )}
        </div>
      </section>
    </div>
  );
}
