import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, Trash2 } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import type { Period, User, VacationPeriod } from '../../types';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: Period | null;
  centerId: string;
  animators: User[];
}

interface PeriodFormData {
  name: string;
  type: 'wednesday' | 'vacation';
  startDate: string;
  endDate: string;
  animators: string[];
}

interface SplitPeriodPreview {
  name: string;
  startDate: string;
  endDate: string;
}

export default function PeriodModal({ isOpen, onClose, period, centerId, animators }: PeriodModalProps) {
  const queryClient = useQueryClient();
  const [creationStep, setCreationStep] = useState<'type' | 'vacation-select' | 'split-decision' | 'details'>(period ? 'details' : 'type');
  const [selectedVacation, setSelectedVacation] = useState<VacationPeriod | null>(null);
  const [splitPeriod, setSplitPeriod] = useState(false);
  const [splitPeriods, setSplitPeriods] = useState<SplitPeriodPreview[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('2023-2024');

  const { register, handleSubmit, reset, setValue, watch } = useForm<PeriodFormData>({
    defaultValues: period ? {
      name: period.name,
      type: period.type,
      startDate: format(period.startDate, 'yyyy-MM-dd'),
      endDate: format(period.endDate, 'yyyy-MM-dd'),
      animators: period.animators
    } : {
      name: '',
      type: 'wednesday',
      startDate: '',
      endDate: '',
      animators: []
    }
  });

  const createPeriod = useMutation({
    mutationFn: async (data: PeriodFormData) => {
      const newPeriod = {
        ...data,
        centerId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addDoc(collection(db, 'periods'), newPeriod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      onClose();
      reset();
    }
  });

  const updatePeriod = useMutation({
    mutationFn: async (data: PeriodFormData) => {
      if (!period) return;
      const periodRef = doc(db, 'periods', period.id);
      await updateDoc(periodRef, {
        ...data,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      onClose();
    }
  });

  const deletePeriod = useMutation({
    mutationFn: async () => {
      if (!period) return;
      await deleteDoc(doc(db, 'periods', period.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      onClose();
    }
  });

  const calculateSplitPeriods = (vacation: VacationPeriod) => {
    const startDate = parseISO(vacation.start);
    const endDate = parseISO(vacation.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksCount = Math.ceil(totalDays / 7);
    const periods: SplitPeriodPreview[] = [];

    for (let i = 0; i < weeksCount; i++) {
      const weekStartDate = addDays(startDate, i * 7);
      const weekEndDate = addDays(weekStartDate, 6);
      const finalEndDate = weekEndDate > endDate ? endDate : weekEndDate;
      
      periods.push({
        name: `${vacation.name} - Semaine ${i + 1}`,
        startDate: format(weekStartDate, 'yyyy-MM-dd'),
        endDate: format(finalEndDate, 'yyyy-MM-dd')
      });
    }

    return periods;
  };

  const handleVacationSelect = (vacation: VacationPeriod) => {
    setSelectedVacation(vacation);
    setValue('name', vacation.name);
    
    if (!splitPeriod) {
      setValue('startDate', vacation.start);
      setValue('endDate', vacation.end);
      setSplitPeriods([]);
    } else {
      const periods = calculateSplitPeriods(vacation);
      setSplitPeriods(periods);
      
      if (periods.length > 0) {
        setValue('name', periods[0].name);
        setValue('startDate', periods[0].startDate);
        setValue('endDate', periods[0].endDate);
      }
    }
    
    setCreationStep('details');
  };

  const onSubmit = async (data: PeriodFormData) => {
    if (period) {
      await updatePeriod.mutateAsync(data);
    } else {
      if (splitPeriod && splitPeriods.length > 0) {
        for (const splitPeriod of splitPeriods) {
          await createPeriod.mutateAsync({
            ...data,
            name: splitPeriod.name,
            startDate: splitPeriod.startDate,
            endDate: splitPeriod.endDate,
            schoolYearId: selectedSchoolYear
          });
        }
      } else {
        await createPeriod.mutateAsync({
          ...data,
          schoolYearId: selectedSchoolYear
        });
      }
      onClose();
      reset();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {period ? 'Edit Period' : 'Add New Period'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {creationStep === 'type' && !period && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Select period type</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setValue('type', 'wednesday');
                    setCreationStep('details');
                  }}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg mb-2">📅</span>
                  <span className="text-sm font-medium">Wednesday</span>
                </button>
                <button
                  onClick={() => {
                    setValue('type', 'vacation');
                    setCreationStep('vacation-select');
                  }}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg mb-2">🏖️</span>
                  <span className="text-sm font-medium">Vacation</span>
                </button>
              </div>
            </div>
          )}

          {creationStep === 'vacation-select' && !period && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Select vacation period</h4>
              <div className="grid grid-cols-1 gap-4">
                {/* Add vacation period buttons here */}
                <button
                  onClick={() => setCreationStep('split-decision')}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">Toussaint</span>
                  <span className="text-sm text-gray-500">Oct 21 - Nov 5</span>
                </button>
              </div>
            </div>
          )}

          {creationStep === 'split-decision' && selectedVacation && !period && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Do you want to split this period into weeks?</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSplitPeriod(true);
                    handleVacationSelect(selectedVacation);
                  }}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg mb-2">📅</span>
                  <span className="text-sm font-medium">Split into Weeks</span>
                </button>
                <button
                  onClick={() => {
                    setSplitPeriod(false);
                    handleVacationSelect(selectedVacation);
                  }}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-lg mb-2">📆</span>
                  <span className="text-sm font-medium">Keep as One Period</span>
                </button>
              </div>
            </div>
          )}

          {(creationStep === 'details' || period) && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="wednesday">Wednesday</option>
                  <option value="vacation">Vacation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    {...register('endDate', { required: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Animators</label>
                <select
                  multiple
                  {...register('animators')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {animators.map((animator) => (
                    <option key={animator.id} value={animator.id}>
                      {animator.firstName} {animator.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {splitPeriod && splitPeriods.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Split Periods Preview</h4>
                  <div className="border rounded-lg divide-y">
                    {splitPeriods.map((split, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{split.name}</p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(split.startDate), 'PP')} - {format(parseISO(split.endDate), 'PP')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between space-x-3 pt-4">
                {period && (
                  <button
                    type="button"
                    onClick={() => deletePeriod.mutate()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
                <div className="flex space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {period ? 'Update' : splitPeriod ? 'Create Split Periods' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}