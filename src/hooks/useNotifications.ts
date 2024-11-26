import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkDocumentExpirations, checkMissingTimesheets } from '../utils/notifications';

export function useNotifications() {
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
}