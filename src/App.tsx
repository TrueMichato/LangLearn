import { lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import OnboardingOverlay from './components/onboarding/OnboardingOverlay';
import { useSettingsStore } from './stores/settingsStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import UpdateToast from './components/common/UpdateToast';

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
const TestsPage = lazy(() => import('./pages/Tests'));
const DailyChallengePage = lazy(() => import('./pages/DailyChallenge'));
const ClozePracticePage = lazy(() => import('./pages/ClozePractice'));
const MinimalPairsPage = lazy(() => import('./pages/MinimalPairs'));
const TranslationPracticePage = lazy(() => import('./pages/TranslationPractice'));
const LyricsPage = lazy(() => import('./pages/Lyrics'));

export default function App() {
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <ErrorBoundary>
      {!onboardingComplete && <OnboardingOverlay />}
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/words" element={<WordsPage />} />
            <Route path="/reader" element={<ReaderPage />} />
            <Route path="/grammar" element={<GrammarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/vocab-lessons" element={<VocabLessons />} />
            <Route path="/letters/:lang" element={<LetterPractice />} />
            <Route path="/listening" element={<ListeningPage />} />
            <Route path="/conjugations" element={<ConjugationsPage />} />
            <Route path="/sentence-builder" element={<SentenceBuilderPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/daily-challenge" element={<DailyChallengePage />} />
            <Route path="/cloze-practice" element={<ClozePracticePage />} />
            <Route path="/minimal-pairs" element={<MinimalPairsPage />} />
            <Route path="/lyrics" element={<LyricsPage />} />
            <Route path="/translation" element={<TranslationPracticePage />} />
          </Route>
        </Routes>
      </HashRouter>
      <UpdateToast />
    </ErrorBoundary>
  );
}
