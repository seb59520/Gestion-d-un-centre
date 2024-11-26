import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Clock, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';
import type { TimeEntry } from '../../types';

interface TimeTrackingSummaryProps {
  userId: string;
  date: Date;
}

export default function TimeTrackingSummary({ userId, date }: TimeTrackingSummaryProps) {
  // Get weekly entries
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // Get monthly entries
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const { data: weeklyEntries } = useQuery({
    queryKey: ['time-entries', userId, 'weekly', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
        where('date', '<=', format(weekEnd, 'yyyy-MM-dd'))
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().date)
      } as TimeEntry));
    },
    enabled: !!userId
  });

  const { data: monthlyEntries } = useQuery({
    queryKey: ['time-entries', userId, 'monthly', format(monthStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', userId),
        where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().date)
      } as TimeEntry));
    },
    enabled: !!userId
  });

  const calculateWorkDuration = (entries: TimeEntry[]) => {
    let totalMinutes = 0;
    let currentStart: Date | null = null;
    let isOnBreak = false;

    entries.forEach(entry => {
      switch (entry.type) {
        case 'arrival':
        case 'break_end':
          currentStart = entry.timestamp;
          isOnBreak = false;
          break;
        case 'break_start':
          if (currentStart && !isOnBreak) {
            totalMinutes += differenceInMinutes(entry.timestamp, currentStart);
            isOnBreak = true;
          }
          break;
        case 'departure':
          if (currentStart && !isOnBreak) {
            totalMinutes += differenceInMinutes(entry.timestamp, currentStart);
          }
          currentStart = null;
          break;
      }
    });

    return totalMinutes;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const weeklyMinutes = weeklyEntries ? calculateWorkDuration(weeklyEntries) : 0;
  const monthlyMinutes = monthlyEntries ? calculateWorkDuration(monthlyEntries) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Work Summary</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-lg font-medium text-gray-900">
                {formatDuration(weeklyMinutes)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-lg font-medium text-gray-900">
                {formatDuration(monthlyMinutes)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {format(monthStart, 'MMMM yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}