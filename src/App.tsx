import { lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';
import OnboardingOverlay from './components/onboarding/OnboardingOverlay';
import { useSettingsStore } from './stores/settingsStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import UpdateToast from './components/common/UpdateToast';
import { ROUTES } from './lib/routes';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ReviewPage = lazy(() => import('./pages/Review'));
const ReaderPage = lazy(() => import('./pages/Reader'));
const GrammarPage = lazy(() => import('./pages/Grammar'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const WordsPage = lazy(() => import('./pages/Words'));
const LearnPage = lazy(() => import('./pages/Learn'));
const VocabLessons = lazy(() => import('./pages/VocabLessons'));
const LetterPractice = lazy(() => import('./pages/LetterPractice'));
const ListeningPage = lazy(() => import('./pages/Listening'));
const ConjugationsPage = lazy(() => import('./pages/Conjugations'));
const SentenceBuilderPage = lazy(() => import('./pages/SentenceBuilder'));
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const AchievementsPage = lazy(() => import('./pages/Achievements'));
const TestsPage = lazy(() => import('./pages/Tests'));
const DailyChallengePage = lazy(() => import('./pages/DailyChallenge'));
const ClozePracticePage = lazy(() => import('./pages/ClozePractice'));
const MinimalPairsPage = lazy(() => import('./pages/MinimalPairs'));
const NumberPracticePage = lazy(() => import('./pages/NumberPractice'));
const TranslationPracticePage = lazy(() => import('./pages/TranslationPractice'));
const LyricsPage = lazy(() => import('./pages/Lyrics'));
const DialectsPage = lazy(() => import('./pages/Dialects'));

export default function App() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <ErrorBoundary>
      <HashRouter>
        {!onboardingComplete && <OnboardingOverlay />}
        <Routes>
          <Route element={<Shell />}>
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
            <Route path={ROUTES.review} element={<ReviewPage />} />
            <Route path={ROUTES.words} element={<WordsPage />} />
            <Route path={ROUTES.reader} element={<ReaderPage />} />
            <Route path={ROUTES.grammar} element={<GrammarPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route path={ROUTES.learn} element={<LearnPage />} />
            <Route path={ROUTES.vocabLessons} element={<VocabLessons />} />
            <Route path={ROUTES.letters} element={<LetterPractice />} />
            <Route path={ROUTES.listening} element={<ListeningPage />} />
            <Route path={ROUTES.conjugations} element={<ConjugationsPage />} />
            <Route path={ROUTES.sentenceBuilder} element={<SentenceBuilderPage />} />
            <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
            <Route path={ROUTES.achievements} element={<AchievementsPage />} />
            <Route path={ROUTES.tests} element={<TestsPage />} />
            <Route path={ROUTES.dailyChallenge} element={<DailyChallengePage />} />
            <Route path={ROUTES.clozePractice} element={<ClozePracticePage />} />
            <Route path={ROUTES.minimalPairs} element={<MinimalPairsPage />} />
            <Route path={ROUTES.numberPractice} element={<NumberPracticePage />} />
            <Route path={ROUTES.dialects} element={<DialectsPage />} />
            <Route path={ROUTES.lyrics} element={<LyricsPage />} />
            <Route path={ROUTES.translation} element={<TranslationPracticePage />} />
            <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
          </Route>
        </Routes>
      </HashRouter>
      <UpdateToast />
    </ErrorBoundary>
  );
}
