import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Centers from './pages/Centers';
import Animators from './pages/Animators';
import Periods from './pages/Periods';
import Activities from './pages/Activities';
import TimeTracking from './pages/TimeTracking';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Help from './pages/Help';
import ConnectionStatus from './components/ConnectionStatus';
import NotificationsProvider from './contexts/NotificationsContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/centers" element={<Centers />} />
                <Route path="/animators" element={<Animators />} />
                <Route path="/periods" element={<Periods />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/time-tracking/*" element={<TimeTracking />} />
                <Route path="/budget/*" element={<Budget />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
              </Route>
            </Routes>
            <ConnectionStatus />
          </Router>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}