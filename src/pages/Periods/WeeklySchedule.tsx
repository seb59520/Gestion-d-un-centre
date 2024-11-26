import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, addDays, isSameDay } from 'date-fns';
import { Clock, Users, MapPin, Plus } from 'lucide-react';
import type { Activity, User } from '../../types';
import ActivityModal from './ActivityModal';

interface WeeklyScheduleProps {
  periodId: string;
  centerId: string;
  startDate: Date;
  animators: User[];
}

export default function WeeklySchedule({ periodId, centerId, startDate, animators }: WeeklyScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const { data: activities } = useQuery({
    queryKey: ['activities', periodId, format(startDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const q = query(
        collection(db, 'activities'),
        where('periodId', '==', periodId),
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(weekDays[6], 'yyyy-MM-dd'))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Activity));
    }
  });

  const getActivitiesForDay = (date: Date) => {
    return activities?.filter(activity => 
      isSameDay(new Date(activity.date), date)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
  };

  const getAnimatorNames = (animatorIds: string[]) => {
    return animatorIds
      .map(id => {
        const animator = animators.find(a => a.id === id);
        return animator ? `${animator.firstName} ${animator.lastName}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleAddActivity = (date: Date) => {
    setSelectedDate(date);
    setSelectedActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsActivityModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((date) => (
          <div key={date.toString()} className="bg-white p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(date, 'EEEE')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(date, 'MMM d')}
                </p>
              </div>
              <button
                onClick={() => handleAddActivity(date)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {getActivitiesForDay(date).map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => handleEditActivity(activity)}
                  className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 cursor-pointer"
                >
                  <div className="font-medium text-sm text-indigo-900">
                    {activity.name}
                  </div>
                  <div className="mt-1 text-xs space-y-1">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.startTime} - {activity.endTime}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-3 w-3 mr-1" />
                      {activity.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-3 w-3 mr-1" />
                      {getAnimatorNames(activity.animatorIds)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isActivityModalOpen && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          activity={selectedActivity}
          periodId={periodId}
          centerId={centerId}
          animators={animators}
          date={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd')}
        />
      )}
    </div>
  );
}