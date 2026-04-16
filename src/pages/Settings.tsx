import { useState, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { exportAllData, importAllData, downloadJson } from '../db/backup';
import DeckExport from '../components/common/DeckExport';
import DeckImport from '../components/common/DeckImport';

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

  const languageOptions = [
    { code: 'ja', name: 'Japanese 🇯🇵' },
    { code: 'ru', name: 'Russian 🇷🇺' },
    { code: 'en', name: 'English 🇬🇧' },
    { code: 'es', name: 'Spanish 🇪🇸' },
    { code: 'fr', name: 'French 🇫🇷' },
    { code: 'de', name: 'German 🇩🇪' },
    { code: 'zh', name: 'Chinese 🇨🇳' },
    { code: 'ko', name: 'Korean 🇰🇷' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Settings</h2>

      {/* Theme */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Theme</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{darkMode ? 'Dark mode' : 'Light mode'}</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </section>

      {/* Weekly Goal */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Weekly Study Goal</h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={15}
            max={420}
            step={15}
            value={weeklyGoalMinutes}
            onChange={(e) => setWeeklyGoal(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-sm font-mono w-16 text-right dark:text-gray-300">
            {weeklyGoalMinutes >= 60
              ? `${Math.floor(weeklyGoalMinutes / 60)}h${weeklyGoalMinutes % 60 ? ` ${weeklyGoalMinutes % 60}m` : ''}`
              : `${weeklyGoalMinutes}m`}
          </span>
        </div>
      </section>

      {/* Languages */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Active Languages</h3>
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
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Accessibility */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Accessibility</h3>

        {/* Font Size */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-700 dark:text-gray-200">Content font size</p>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400" style={{ fontSize: fontSize + 'px' }}>
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
            className="w-full accent-indigo-600"
          />
        </div>

        {/* TTS Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-700 dark:text-gray-200">TTS speed</p>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{ttsRate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={ttsRate}
            onChange={(e) => setTtsRate(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        {/* Review Batch Size */}
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">Review batch size</p>
          <div className="flex gap-2">
            {[10, 25, 50, 0].map((size) => (
              <button
                key={size}
                onClick={() => setReviewBatchSize(size)}
                className={`flex-1 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  reviewBatchSize === size
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {size === 0 ? 'All' : size}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Decks */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 space-y-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Decks</h3>
        <DeckExport />
        <hr className="border-gray-200 dark:border-gray-700" />
        <DeckImport />
      </section>

      {/* Russian Features */}
      {activeLanguages.includes('ru') && (
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Russian Features</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-200">Show stress marks (ударе&#x0301;ние)</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Display accent marks on stressed vowels in the Reader</p>
            </div>
            <button
              onClick={toggleStressMarks}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showStressMarks ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={showStressMarks}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showStressMarks ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>
      )}

      {/* Backup */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Data Backup</h3>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
          >
            📥 Export all data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
            <p className="text-sm text-center">{importStatus}</p>
          )}
        </div>
      </section>
    </div>
  );
}
