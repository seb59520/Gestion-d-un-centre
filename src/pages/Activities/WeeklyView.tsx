import { format, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Activity, User } from '../../types';

interface WeeklyViewProps {
  activities: Activity[];
  animators: User[];
  currentWeekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onEditActivity: (activity: Activity) => void;
}

export default function WeeklyView({
  activities,
  animators,
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onEditActivity
}: WeeklyViewProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getActivitiesForDay = (date: Date) => {
    return activities
      .filter(activity => isSameDay(new Date(activity.date), date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={onPreviousWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            Week of {format(currentWeekStart, 'MMMM d, yyyy')}
          </h3>
          <button
            onClick={onNextWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((date) => (
          <div key={date.toString()} className="bg-white min-h-[200px]">
            <div className="p-2 border-b bg-gray-50">
              <div className="font-medium text-gray-900">
                {format(date, 'EEEE')}
              </div>
              <div className="text-sm text-gray-500">
                {format(date, 'MMM d')}
              </div>
            </div>
            <div className="p-2 space-y-2">
              {getActivitiesForDay(date).map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => onEditActivity(activity)}
                  className="p-2 rounded bg-indigo-50 hover:bg-indigo-100 cursor-pointer text-sm"
                >
                  <div className="font-medium text-indigo-900">
                    {activity.name}
                  </div>
                  <div className="text-indigo-700">
                    {activity.startTime} - {activity.endTime}
                  </div>
                  <div className="text-indigo-600">
                    {activity.location}
                  </div>
                  <div className="text-xs text-indigo-500 truncate">
                    {getAnimatorNames(activity.animatorIds)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}