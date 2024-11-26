import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parseISO } from 'date-fns';
import { Edit, Calendar } from 'lucide-react';
import type { WorkSchedule } from '../../types';

export default function Schedule() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: schedules } = useQuery({
    queryKey: ['schedules', currentUser?.id, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const q = query(
        collection(db, 'workSchedules'),
        where('userId', '==', currentUser.id),
        where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WorkSchedule));
    },
    enabled: !!currentUser
  });

  const { data: timeEntries } = useQuery({
    queryKey: ['time-entries', currentUser?.id, format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const q = query(
        collection(db, 'timeEntries'),
        where('userId', '==', currentUser.id),
        where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
        where('date', '<=', format(monthEnd, 'yyyy-MM-dd'))
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || parseISO(doc.data().date)
      }));
    },
    enabled: !!currentUser
  });

  const createSchedule = useMutation({
    mutationFn: async ({ date, hours, minutes }: { date: string; hours: number; minutes: number }) => {
      if (!currentUser) return;

      const totalMinutes = (hours * 60) + minutes;
      const newSchedule = {
        userId: currentUser.id,
        centerId: currentUser.centerId,
        date,
        plannedMinutes: totalMinutes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'workSchedules'), newSchedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setEditingSchedule(null);
    }
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, hours, minutes }: { id: string; hours: number; minutes: number }) => {
      const totalMinutes = (hours * 60) + minutes;
      const scheduleRef = doc(db, 'workSchedules', id);
      await updateDoc(scheduleRef, {
        plannedMinutes: totalMinutes,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setEditingSchedule(null);
    }
  });

  const calculateDayMinutes = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const schedule = schedules?.find(s => s.date === dateStr);
    
    // Calculate actual minutes from time entries
    const dayEntries = timeEntries?.filter(entry => entry.date === dateStr) || [];
    let actualMinutes = 0;
    let currentStart: Date | null = null;
    let isOnBreak = false;

    dayEntries.forEach(entry => {
      const entryTime = new Date(entry.timestamp);
      
      switch (entry.type) {
        case 'arrival':
        case 'break_end':
          currentStart = entryTime;
          isOnBreak = false;
          break;
        case 'break_start':
          if (currentStart && !isOnBreak) {
            actualMinutes += Math.round((entryTime.getTime() - currentStart.getTime()) / 60000);
            isOnBreak = true;
          }
          break;
        case 'departure':
          if (currentStart && !isOnBreak) {
            actualMinutes += Math.round((entryTime.getTime() - currentStart.getTime()) / 60000);
          }
          currentStart = null;
          break;
      }
    });

    return {
      planned: schedule?.plannedMinutes || 0,
      actual: actualMinutes
    };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${hours}h${mins.toString().padStart(2, '0')}`;
  };

  const getMonthSummary = () => {
    let totalPlanned = 0;
    let totalActual = 0;

    days.forEach(date => {
      const { planned, actual } = calculateDayMinutes(date);
      totalPlanned += planned;
      totalActual += actual;
    });

    return {
      planned: totalPlanned,
      actual: totalActual,
      difference: totalActual - totalPlanned
    };
  };

  const monthSummary = getMonthSummary();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Work Schedule</h1>
        <input
          type="month"
          value={format(currentDate, 'yyyy-MM')}
          onChange={(e) => setCurrentDate(new Date(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Monthly Summary</h2>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Planned:</span>
              <span className="font-medium">{formatTime(monthSummary.planned)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Actual:</span>
              <span className="font-medium">{formatTime(monthSummary.actual)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-500">Difference:</span>
              <span className={`font-medium ${
                monthSummary.difference >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatTime(monthSummary.difference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-900"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map(date => {
            const { planned, actual } = calculateDayMinutes(date);
            const schedule = schedules?.find(s => s.date === format(date, 'yyyy-MM-dd'));
            const difference = actual - planned;
            
            return (
              <div
                key={date.toString()}
                className={`bg-white p-3 h-36 ${
                  !isSameMonth(date, currentDate) ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    {format(date, 'd')}
                  </span>
                  {editingSchedule === schedule?.id ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        className="w-16 text-sm border-gray-300 rounded-md"
                        defaultValue={Math.floor(planned / 60)}
                        onBlur={(e) => {
                          const hours = Number(e.target.value);
                          const minutes = planned % 60;
                          if (schedule) {
                            updateSchedule.mutate({
                              id: schedule.id,
                              hours,
                              minutes
                            });
                          } else {
                            createSchedule.mutate({
                              date: format(date, 'yyyy-MM-dd'),
                              hours,
                              minutes
                            });
                          }
                        }}
                        min="0"
                        placeholder="Hours"
                      />
                      <span className="text-sm">h</span>
                      <input
                        type="number"
                        className="w-16 text-sm border-gray-300 rounded-md"
                        defaultValue={planned % 60}
                        onBlur={(e) => {
                          const hours = Math.floor(planned / 60);
                          const minutes = Number(e.target.value);
                          if (schedule) {
                            updateSchedule.mutate({
                              id: schedule.id,
                              hours,
                              minutes
                            });
                          } else {
                            createSchedule.mutate({
                              date: format(date, 'yyyy-MM-dd'),
                              hours,
                              minutes
                            });
                          }
                        }}
                        min="0"
                        max="59"
                        placeholder="Min"
                      />
                      <span className="text-sm">m</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (schedule) {
                          setEditingSchedule(schedule.id);
                        } else {
                          createSchedule.mutate({
                            date: format(date, 'yyyy-MM-dd'),
                            hours: 8,
                            minutes: 0
                          });
                        }
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Planned:</span>
                    <span>{formatTime(planned)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{formatTime(actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Difference:</span>
                    <span className={difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatTime(difference)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}