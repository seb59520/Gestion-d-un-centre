import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { User, Clock } from 'lucide-react';
import type { TimeEntry, User as UserType } from '../../types';

export default function AnimatorPresence() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: animators } = useQuery({
    queryKey: ['animators'],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'animator')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserType));
    }
  });

  const { data: timeEntries } = useQuery({
    queryKey: ['time-entries', today],
    queryFn: async () => {
      const q = query(
        collection(db, 'timeEntries'),
        where('date', '==', today)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as TimeEntry));
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const getAnimatorStatus = (animatorId: string) => {
    const animatorEntries = timeEntries?.filter(entry => entry.userId === animatorId) || [];
    const lastEntry = animatorEntries[animatorEntries.length - 1];
    
    if (!lastEntry) return 'absent';
    return lastEntry.type === 'arrival' ? 'present' : 'absent';
  };

  const getArrivalTime = (animatorId: string) => {
    const animatorEntries = timeEntries?.filter(entry => entry.userId === animatorId) || [];
    const arrivalEntry = animatorEntries.find(entry => entry.type === 'arrival');
    return arrivalEntry?.timestamp;
  };

  const presentCount = animators?.filter(animator => 
    getAnimatorStatus(animator.id) === 'present'
  ).length || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Animator Presence</h3>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {presentCount} Present
        </span>
      </div>

      <div className="space-y-4">
        {animators?.map((animator) => {
          const status = getAnimatorStatus(animator.id);
          const arrivalTime = getArrivalTime(animator.id);

          return (
            <div
              key={animator.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {animator.firstName} {animator.lastName}
                  </p>
                  {arrivalTime && status === 'present' && (
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Arrived at {format(arrivalTime, 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === 'present'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {status === 'present' ? 'Present' : 'Absent'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}