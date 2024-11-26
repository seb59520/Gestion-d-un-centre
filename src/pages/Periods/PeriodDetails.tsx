import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { Period, User } from '../../types';
import WeeklySchedule from './WeeklySchedule';

interface PeriodDetailsProps {
  period: Period;
}

export default function PeriodDetails({ period }: PeriodDetailsProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(period.startDate), { weekStartsOn: 1 })
  );

  const { data: animators } = useQuery({
    queryKey: ['animators', period.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('centerId', '==', period.centerId),
        where('role', '==', 'animator')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    }
  });

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleExportSchedule = () => {
    // TODO: Implement PDF export functionality
  };

  if (!animators) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            Week of {format(currentWeekStart, 'MMMM d, yyyy')}
          </h3>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={handleExportSchedule}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Schedule
        </button>
      </div>

      <WeeklySchedule
        periodId={period.id}
        centerId={period.centerId}
        startDate={currentWeekStart}
        animators={animators}
      />
    </div>
  );
}