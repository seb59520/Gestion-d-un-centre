import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TimeTrackingDashboard from './TimeTrackingDashboard';
import AnimatorTimesheet from './AnimatorTimesheet';
import Schedule from './Schedule';

export default function TimeTracking() {
  const { currentUser } = useAuth();
  const isAnimator = currentUser?.role === 'animator';

  if (isAnimator) {
    return <AnimatorTimesheet />;
  }

  return (
    <Routes>
      <Route index element={<TimeTrackingDashboard />} />
      <Route path="schedule" element={<Schedule />} />
    </Routes>
  );
}