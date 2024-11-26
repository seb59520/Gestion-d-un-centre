import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Trash2 } from 'lucide-react';
import type { BudgetCategory } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: BudgetCategory;
}

type CategoryFormData = {
  name: string;
  description: string;
  annualBudget: number;
};

export default function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: category ? {
      name: category.name,
      description: category.description || '',
      annualBudget: category.annualBudget
    } : {
      name: '',
      description: '',
      annualBudget: 0
    }
  });

  const createCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!currentUser) return;

      const newCategory = {
        ...data,
        centerId: currentUser.centerId,
        remainingBudget: data.annualBudget,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'budgetCategories'), newCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      onClose();
      reset();
    }
  });

  const updateCategory = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!category) return;
      const categoryRef = doc(db, 'budgetCategories', category.id);
      await updateDoc(categoryRef, {
        ...data,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      onClose();
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async () => {
      if (!category) return;
      await deleteDoc(doc(db, 'budgetCategories', category.id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      onClose();
    }
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (category) {
      await updateCategory.mutateAsync(data);
    } else {
      await createCategory.mutateAsync(data);
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
              {category ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Annual Budget</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
                <input
                  type="number"
                  {...register('annualBudget', {
                    required: 'Annual budget is required',
                    min: { value: 0, message: 'Budget must be positive' }
                  })}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {errors.annualBudget && (
                <p className="mt-1 text-sm text-red-600">{errors.annualBudget.message}</p>
              )}
            </div>

            <div className="flex justify-between space-x-3 pt-4">
              {category && (
                <button
                  type="button"
                  onClick={() => deleteCategory.mutate()}
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
                  {category ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}