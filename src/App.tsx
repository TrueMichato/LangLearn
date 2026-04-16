import { HashRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import ReviewPage from './pages/Review';
import ReaderPage from './pages/Reader';
import GrammarPage from './pages/Grammar';
import SettingsPage from './pages/Settings';
import WordsPage from './pages/Words';
import MorePage from './pages/More';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/words" element={<WordsPage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/more" element={<MorePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
