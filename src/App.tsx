import { HashRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import ReviewPage from './pages/Review';
import ReaderPage from './pages/Reader';
import GrammarPage from './pages/Grammar';
import SettingsPage from './pages/Settings';
import WordsPage from './pages/Words';
import LearnPage from './pages/Learn';
import VocabLessons from './pages/VocabLessons';
import LetterPractice from './pages/LetterPractice';
import SentenceBuilderPage from './pages/SentenceBuilder';
import AnalyticsPage from './pages/Analytics';
import TestsPage from './pages/Tests';
import AnalyticsPage from './pages/Analytics';
import OnboardingOverlay from './components/onboarding/OnboardingOverlay';
import { useSettingsStore } from './stores/settingsStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import UpdateToast from './components/common/UpdateToast';

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
            <Route path="/sentence-builder" element={<SentenceBuilderPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </HashRouter>
      <UpdateToast />
    </ErrorBoundary>
  );
}
