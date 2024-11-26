import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, Filter, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import type { Activity, Period, User } from '../../types';
import ActivityModal from './ActivityModal';
import WeeklyView from './WeeklyView';
import ListView from './ListView';

type ViewMode = 'week' | 'list';

export default function Activities() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Fetch periods
  const { data: periods } = useQuery({
    queryKey: ['periods', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'periods'),
        where('centerId', '==', currentUser?.centerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Period));
    },
    enabled: !!currentUser
  });

  // Fetch animators
  const { data: animators } = useQuery({
    queryKey: ['animators', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('centerId', '==', currentUser?.centerId),
        where('role', '==', 'animator')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    },
    enabled: !!currentUser
  });

  // Fetch activities
  const { data: activities } = useQuery({
    queryKey: ['activities', currentUser?.centerId, selectedPeriod, currentWeekStart],
    queryFn: async () => {
      let q = query(
        collection(db, 'activities'),
        where('centerId', '==', currentUser?.centerId)
      );

      if (selectedPeriod !== 'all') {
        q = query(q, where('periodId', '==', selectedPeriod));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Activity));
    },
    enabled: !!currentUser
  });

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleExportActivities = () => {
    // TODO: Implement export functionality
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Periods</option>
            {periods?.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>

          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'week'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExportActivities}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => {
              setSelectedActivity(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <WeeklyView
          activities={activities || []}
          animators={animators || []}
          currentWeekStart={currentWeekStart}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onEditActivity={(activity) => {
            setSelectedActivity(activity);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <ListView
          activities={activities || []}
          animators={animators || []}
          onEditActivity={(activity) => {
            setSelectedActivity(activity);
            setIsModalOpen(true);
          }}
        />
      )}

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        periodId={selectedPeriod}
        centerId={currentUser?.centerId || ''}
        animators={animators || []}
      />
    </div>
  );
}