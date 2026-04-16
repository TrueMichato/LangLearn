import { HashRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import ReviewPage from './pages/Review';
import ReaderPage from './pages/Reader';
import GrammarPage from './pages/Grammar';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/reader" element={<ReaderPage />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
