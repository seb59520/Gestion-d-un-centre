import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { getConnectionStatus } from '../lib/firebase';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Firebase connection status
    setIsOnline(getConnectionStatus());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center">
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm">Working offline</span>
    </div>
  );
}