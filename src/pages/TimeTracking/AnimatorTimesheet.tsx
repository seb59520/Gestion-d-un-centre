import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Pause, LogOut, Clock } from 'lucide-react';
import { format } from 'date-fns';
import TimeTrackingHistory from './TimeTrackingHistory';
import TimeTrackingSummary from './TimeTrackingSummary';

export default function AnimatorTimesheet() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ['time-entries', currentUser?.id, selectedDate],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', currentUser.id),
        where('date', '==', format(selectedDate, 'yyyy-MM-dd'))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().date)
      }));
    },
    enabled: !!currentUser,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const createTimeEntry = useMutation({
    mutationFn: async (type: 'arrival' | 'departure') => {
      if (!currentUser) return;

      const now = new Date();
      const newEntry = {
        userId: currentUser.id,
        centerId: currentUser.centerId,
        type,
        date: format(now, 'yyyy-MM-dd'),
        timestamp: serverTimestamp(),
        createdAt: now
      };

      await addDoc(collection(db, 'timeEntries'), newEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    }
  });

  const getLastEntry = () => {
    if (!timeEntries?.length) return null;
    return timeEntries[timeEntries.length - 1];
  };

  const lastEntry = getLastEntry();
  const isWorking = lastEntry?.type === 'arrival';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Time Tracking</h2>
          </div>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => createTimeEntry.mutate('arrival')}
            disabled={isWorking}
            className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${
              isWorking
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Work
          </button>

          <button
            onClick={() => createTimeEntry.mutate('departure')}
            disabled={!isWorking}
            className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${
              !isWorking
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <LogOut className="h-5 w-5 mr-2" />
            End Work
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            isWorking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isWorking ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            {isWorking ? 'Currently Working' : 'Not Working'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TimeTrackingHistory entries={timeEntries || []} />
        <TimeTrackingSummary userId={currentUser?.id || ''} date={selectedDate} />
      </div>
    </div>
  );
}