import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LearningPath from '../components/learn/LearningPath';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { LEARNING_PATHS } from '../data/learning-paths';
import { SkeletonList } from '../components/common/Skeleton';
import { ROUTES } from '../lib/routes';
import { useLearningPath } from '../hooks/useLearningPath';

export default function LearnPage() {
  const location = useLocation();
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const { language: currentLanguage, setLanguage } = useCurrentLanguage();
  const pathLanguages = useMemo(
    () => activeLanguages.filter((lang) => LEARNING_PATHS[lang]),
    [activeLanguages],
  );
  const {
    loading: pathLoading,
    path,
    error: pathError,
  } = useLearningPath(currentLanguage);

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Learn</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Follow a calm route through the essentials, or browse every activity when you know what you need.
      </p>

      <LanguagePicker
        options={activeLanguages}
        value={currentLanguage}
        onChange={setLanguage}
        label="Learning path language"
        className="mb-2"
      />

      <div className="mb-4 flex justify-end">
        <Link
          to={ROUTES.browseActivities}
          className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-200"
        >
          Browse activities
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      {pathLoading ? (
        <SkeletonList count={4} />
      ) : pathError ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">Your path needs a quick refresh</p>
          <p className="mt-1">{pathError} You can still browse every activity from the link above.</p>
        </div>
      ) : path ? (
        <LearningPath
          path={path}
          focusCurrent={
            location.state?.focusCurrentPathStep === true
          }
        />
      ) : (
        <LanguageUnavailable
          requested={currentLanguage}
          options={pathLanguages}
          onChange={setLanguage}
          feature="A guided learning path"
        />
      )}

    </div>
  );
}
