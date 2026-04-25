import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import YearSetup from './pages/YearSetup';
import EventCalendar from './pages/EventCalendar';
import UnitPlanner from './pages/UnitPlanner';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<YearSetup />} />
          <Route path="/calendar" element={<EventCalendar />} />
          <Route path="/units" element={<UnitPlanner />} />
          {/* Step 4は今後追加 */}
          {/* <Route path="/progress" element={<ProgressView />} /> */}
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
