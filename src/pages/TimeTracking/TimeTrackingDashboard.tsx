import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUserRole } from '../../hooks/useUserRole';
import { Play, Pause, LogOut, Clock, Users, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeEntry, User } from '../../types';
import TimeTrackingHistory from './TimeTrackingHistory';
import TimeTrackingSummary from './TimeTrackingSummary';

export default function TimeTrackingDashboard() {
  const { currentUser } = useAuth();
  const { isDirector } = useUserRole();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Fetch all users for the center
  const { data: users } = useQuery({
    queryKey: ['users', currentUser?.centerId],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const q = query(
        collection(db, 'users'),
        where('centerId', '==', currentUser.centerId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    },
    enabled: !!currentUser && isDirector
  });

  // Get the actual user ID to query time entries for
  const targetUserId = selectedUserId || currentUser?.id;

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ['time-entries', targetUserId, selectedDate],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', targetUserId),
        where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().date)
      } as TimeEntry));
    },
    enabled: !!targetUserId,
    refetchInterval: 30000
  });

  const createTimeEntry = useMutation({
    mutationFn: async (type: TimeEntry['type']) => {
      if (!currentUser) return;

      const now = new Date();
      const newEntry = {
        userId: targetUserId,
        centerId: currentUser.centerId,
        type,
        date: format(now, 'yyyy-MM-dd'),
        timestamp: serverTimestamp(),
        createdAt: now
      };

      const docRef = await addDoc(collection(db, 'timeEntries'), newEntry);
      return { id: docRef.id, ...newEntry, timestamp: now };
    },
    onSuccess: (newEntry) => {
      queryClient.setQueryData(['time-entries', targetUserId, selectedDate], (old: TimeEntry[] = []) => {
        return [...old, newEntry].sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
      });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    }
  });

  const getLastEntry = () => {
    if (!timeEntries?.length) return null;
    return timeEntries[timeEntries.length - 1];
  };

  const handleTimeEntry = (type: TimeEntry['type']) => {
    createTimeEntry.mutate(type);
  };

  const filteredUsers = users?.filter(user => 
    selectedRole === 'all' || user.role === selectedRole
  );

  const selectedUser = users?.find(user => user.id === targetUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const lastEntry = getLastEntry();
  const isWorking = lastEntry?.type === 'arrival' || lastEntry?.type === 'break_end';
  const isOnBreak = lastEntry?.type === 'break_start';

  return (
    <div>
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Time Tracking</h1>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {isDirector && (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Select User
              </label>
              <select
                id="user"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value || null)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Current User</option>
                {filteredUsers?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Filter by Role
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="director">Directors</option>
                <option value="assistant">Assistants</option>
                <option value="animator">Animators</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">
              Current Status
              {selectedUser && ` - ${selectedUser.firstName} ${selectedUser.lastName}`}
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isWorking ? 'bg-green-100 text-green-800' :
            isOnBreak ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isWorking ? 'Working' : isOnBreak ? 'On Break' : 'Not Working'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => handleTimeEntry('arrival')}
            disabled={isWorking}
            className={`flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              isWorking
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-transparent text-white bg-green-600 hover:bg-green-700'
            }`}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Work
          </button>

          <button
            onClick={() => handleTimeEntry('break_start')}
            disabled={!isWorking || isOnBreak}
            className={`flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              !isWorking || isOnBreak
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-transparent text-white bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            <Pause className="h-4 w-4 mr-2" />
            Start Break
          </button>

          <button
            onClick={() => handleTimeEntry('break_end')}
            disabled={!isOnBreak}
            className={`flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              !isOnBreak
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-transparent text-white bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            <Play className="h-4 w-4 mr-2" />
            End Break
          </button>

          <button
            onClick={() => handleTimeEntry('departure')}
            disabled={!isWorking}
            className={`flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              !isWorking
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-transparent text-white bg-red-600 hover:bg-red-700'
            }`}
          >
            <LogOut className="h-4 w-4 mr-2" />
            End Work
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TimeTrackingHistory entries={timeEntries || []} />
        <TimeTrackingSummary userId={targetUserId} date={selectedDate} />
      </div>
    </div>
  );
}