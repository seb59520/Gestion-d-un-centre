import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import type { Notification } from '../types';
import { markNotificationAsRead, dismissNotification } from '../utils/notifications';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, refetch } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.id),
        where('status', '==', 'unread')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate()
      } as Notification));
    },
    enabled: !!currentUser
  });

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    refetch();
  };

  const handleDismiss = async (notificationId: string) => {
    await dismissNotification(notificationId);
    refetch();
  };

  const unreadCount = notifications?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="mt-4 space-y-4">
              {notifications?.length === 0 ? (
                <p className="text-sm text-gray-500">No new notifications</p>
              ) : (
                notifications?.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {format(notification.createdAt, 'PP')}
                      </p>
                      {notification.link && (
                        <a
                          href={notification.link}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          View details
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}