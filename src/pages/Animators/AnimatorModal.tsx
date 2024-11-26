import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, Trash2, Link as LinkIcon } from 'lucide-react';
import type { User } from '../../types';
import { differenceInYears, format } from 'date-fns';

interface AnimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  animator: User | null;
  centerId: string;
}

type AnimatorFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
};

export default function AnimatorModal({ isOpen, onClose, animator, centerId }: AnimatorModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnimatorFormData>({
    defaultValues: animator ? {
      firstName: animator.firstName,
      lastName: animator.lastName,
      email: animator.email,
      phone: animator.phone,
      dateOfBirth: animator.dateOfBirth ? format(new Date(animator.dateOfBirth), 'yyyy-MM-dd') : ''
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: ''
    }
  });

  const createAnimator = useMutation({
    mutationFn: async (data: AnimatorFormData) => {
      try {
        const newAnimator = {
          ...data,
          role: 'animator' as const,
          centerId,
          dateOfBirth: new Date(data.dateOfBirth).toISOString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          personalAccessToken: crypto.randomUUID()
        };
        
        const docRef = await addDoc(collection(db, 'users'), newAnimator);
        return { id: docRef.id, ...newAnimator };
      } catch (error) {
        console.error('Error creating animator:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animators'] });
      reset();
      onClose();
    }
  });

  const updateAnimator = useMutation({
    mutationFn: async (data: AnimatorFormData) => {
      if (!animator) return;
      try {
        const animatorRef = doc(db, 'users', animator.id);
        await updateDoc(animatorRef, {
          ...data,
          dateOfBirth: new Date(data.dateOfBirth).toISOString(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating animator:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animators'] });
      onClose();
    }
  });

  const deleteAnimator = useMutation({
    mutationFn: async () => {
      if (!animator) return;
      try {
        await deleteDoc(doc(db, 'users', animator.id));
      } catch (error) {
        console.error('Error deleting animator:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animators'] });
      onClose();
    }
  });

  const calculateAge = (dateOfBirth: string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const calculateSeniority = (createdAt: Date) => {
    const years = differenceInYears(new Date(), createdAt);
    if (years === 0) {
      const months = Math.floor(differenceInYears(new Date(), createdAt) * 12);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  const getPersonalAccessUrl = () => {
    if (!animator?.personalAccessToken) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/time-tracking/${animator.personalAccessToken}`;
  };

  const copyPersonalLink = () => {
    const url = getPersonalAccessUrl();
    navigator.clipboard.writeText(url);
  };

  const onSubmit = async (data: AnimatorFormData) => {
    if (animator) {
      await updateAnimator.mutateAsync(data);
    } else {
      await createAnimator.mutateAsync(data);
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
              {animator ? 'Edit Animator' : 'Add New Animator'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                {...register('firstName', { required: 'First name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                {...register('lastName', { required: 'Last name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone', {
                  required: 'Phone is required',
                  pattern: {
                    value: /^(\+33|0)[1-9](\d{2}){4}$/,
                    message: 'Invalid French phone number'
                  }
                })}
                placeholder="+33612345678"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {animator && (
              <>
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 space-y-2">
                    <p>Age: {calculateAge(animator.dateOfBirth)} years old</p>
                    <p>Seniority: {calculateSeniority(new Date(animator.createdAt))}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Access Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={getPersonalAccessUrl()}
                      readOnly
                      className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-sm"
                    />
                    <button
                      type="button"
                      onClick={copyPersonalLink}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Share this link with the animator for direct time tracking access
                  </p>
                </div>
              </>
            )}

            <div className="flex justify-between space-x-3 pt-4">
              {animator && (
                <button
                  type="button"
                  onClick={() => deleteAnimator.mutate()}
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
                  {animator ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}