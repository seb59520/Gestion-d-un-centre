import { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { checkDocumentExpirations, checkMissingTimesheets } from '../utils/notifications';

const NotificationsContext = createContext<null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Check for notifications when component mounts
    const checkNotifications = async () => {
      await Promise.all([
        checkDocumentExpirations(currentUser.id, currentUser.centerId),
        checkMissingTimesheets(currentUser.id, currentUser.centerId)
      ]);
    };

    checkNotifications();

    // Set up interval to check periodically
    const interval = setInterval(checkNotifications, 1000 * 60 * 60); // Check every hour

    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <NotificationsContext.Provider value={null}>
      {children}
    </NotificationsContext.Provider>
  );
}