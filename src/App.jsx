import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import YearSetup from './pages/YearSetup';
import EventCalendar from './pages/EventCalendar';
import UnitPlanner from './pages/UnitPlanner';
import ProgressView from './pages/ProgressView';

// モバイル判定（タッチデバイス or 幅768px未満）
function isMobile() {
  return window.innerWidth < 768 || ('ontouchstart' in window);
}

function DefaultRedirect() {
  return <Navigate to={isMobile() ? '/progress' : '/setup'} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/setup" element={<YearSetup />} />
          <Route path="/calendar" element={<EventCalendar />} />
          <Route path="/units" element={<UnitPlanner />} />
          <Route path="/progress" element={<ProgressView />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
