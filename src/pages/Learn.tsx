import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentLanguage } from '../hooks/useCurrentLanguage';
import LearningPath from '../components/learn/LearningPath';
import LanguagePicker from '../components/common/LanguagePicker';
import LanguageUnavailable from '../components/common/LanguageUnavailable';
import { LEARNING_PATHS } from '../data/learning-paths';
import { SkeletonList } from '../components/common/Skeleton';
import { useLearningPath } from '../hooks/useLearningPath';
import LearnModeNav from '../components/learn/LearnModeNav';

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
        Follow a calm route through the essentials, or choose any lesson and practice activity.
      </p>

      <LearnModeNav />

      <LanguagePicker
        options={activeLanguages}
        value={currentLanguage}
        onChange={setLanguage}
        label="Learning path language"
        className="mb-2"
      />

      {pathLoading ? (
        <SkeletonList count={4} />
      ) : pathError ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="font-semibold">Your path needs a quick refresh</p>
          <p className="mt-1">{pathError} You can still open Lessons &amp; practice above.</p>
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
