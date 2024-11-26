import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Activity, ActivityResource, User } from '../../types';
import { format } from 'date-fns';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
  periodId: string;
  centerId: string;
  animators: User[];
  date: string;
}

type ActivityFormData = Omit<Activity, 'id' | 'periodId' | 'centerId' | 'createdAt' | 'updatedAt'>;

export default function ActivityModal({
  isOpen,
  onClose,
  activity,
  periodId,
  centerId,
  animators,
  date
}: ActivityModalProps) {
  const queryClient = useQueryClient();
  const [isAddingResource, setIsAddingResource] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ActivityFormData>({
    defaultValues: activity || {
      name: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      date: date,
      location: '',
      animatorIds: [],
      maxParticipants: 15,
      minAge: 3,
      maxAge: 12,
      resources: []
    }
  });

  const { fields: resources, append, remove } = useFieldArray({
    control,
    name: 'resources'
  });

  const createActivity = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const newActivity = {
        ...data,
        periodId,
        centerId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addDoc(collection(db, 'activities'), newActivity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
      reset();
    }
  });

  const updateActivity = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      if (!activity) return;
      const activityRef = doc(db, 'activities', activity.id);
      await updateDoc(activityRef, {
        ...data,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
    }
  });

  const deleteActivity = useMutation({
    mutationFn: async () => {
      if (!activity) return;
      await deleteDoc(doc(db, 'activities', activity.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
    }
  });

  const onSubmit = async (data: ActivityFormData) => {
    if (activity) {
      await updateActivity.mutateAsync(data);
    } else {
      await createActivity.mutateAsync(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {activity ? 'Edit Activity' : 'Add New Activity'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  {...register('location', { required: 'Location is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  {...register('startTime', { required: 'Start time is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  {...register('endTime', { required: 'End time is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                <input
                  type="number"
                  {...register('maxParticipants', { min: 1 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Min Age</label>
                <input
                  type="number"
                  {...register('minAge', { min: 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Age</label>
                <input
                  type="number"
                  {...register('maxAge', { min: 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Animators</label>
              <select
                multiple
                {...register('animatorIds')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {animators.map((animator) => (
                  <option key={animator.id} value={animator.id}>
                    {animator.firstName} {animator.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Resources</label>
                <button
                  type="button"
                  onClick={() => {
                    append({ name: '', quantity: 1, type: 'material' });
                    setIsAddingResource(true);
                  }}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </button>
              </div>

              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={resource.id} className="flex items-center space-x-2">
                    <input
                      {...register(`resources.${index}.name` as const)}
                      placeholder="Resource name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      {...register(`resources.${index}.quantity` as const)}
                      placeholder="Qty"
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <select
                      {...register(`resources.${index}.type` as const)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="material">Material</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between space-x-3 pt-4">
              {activity && (
                <button
                  type="button"
                  onClick={() => deleteActivity.mutate()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  {activity ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}