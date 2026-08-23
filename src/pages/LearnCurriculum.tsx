import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import CurriculumOutline from '../components/learn/CurriculumOutline';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { SkeletonList } from '../components/common/Skeleton';
import { LEARNING_PATHS } from '../data/learning-paths';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import { useLearningPath } from '../hooks/useLearningPath';
import { ROUTES } from '../lib/routes';
import { useSettingsStore } from '../stores/settingsStore';

export default function LearnCurriculumPage() {
  const activeLanguages = useSettingsStore((state) => state.activeLanguages);
  const { language, setLanguage } = useCurrentLanguage();
  const pathLanguages = useMemo(
    () => activeLanguages.filter((code) => LEARNING_PATHS[code]),
    [activeLanguages],
  );
  const { loading, path, error } = useLearningPath(language);

  return (
    <div>
      <Link
        to={ROUTES.learn}
        state={{ focusCurrentPathStep: true }}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
      >
        <span aria-hidden="true">←</span>
        Back to your path
      </Link>

      <h2 className="mb-2 mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Full curriculum
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        See the whole route when you want to plan ahead. Your daily path still
        keeps one next step in focus.
      </p>

      <LanguagePicker
        options={activeLanguages}
        value={language}
        onChange={setLanguage}
        label="Curriculum language"
        className="mb-4"
      />

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">The curriculum needs a quick refresh</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : path ? (
        <CurriculumOutline path={path} />
      ) : (
        <LanguageUnavailable
          requested={language}
          options={pathLanguages}
          onChange={setLanguage}
          feature="A curriculum overview"
        />
      )}
    </div>
  );
}
