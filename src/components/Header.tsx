import { useState } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { Clock } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { format } from 'date-fns';

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  const { isDirector } = useUserRole();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Current Date and Time */}
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">
            {format(currentTime, 'PPpp')}
          </span>
        </div>

        {/* Right section */}
        <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
          {user && (
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationBell />
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs font-medium text-gray-500">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}