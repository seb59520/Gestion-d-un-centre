import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';
import type { BudgetEntry, CenterSettings } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CenterSettings | undefined;
}

type BudgetFormData = {
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: string;
  categoryId: string;
};

export default function BudgetModal({ isOpen, onClose, settings }: BudgetModalProps) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormData>({
    defaultValues: {
      amount: 0,
      type: 'expense',
      description: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: ''
    }
  });

  const createEntry = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!currentUser) return;

      const newEntry = {
        ...data,
        centerId: currentUser.centerId,
        amount: Number(data.amount),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // First, get the current category data
      const categoryRef = doc(db, 'budgetCategories', data.categoryId);
      const categorySnap = await getDoc(categoryRef);
      
      if (!categorySnap.exists()) {
        throw new Error('Category not found');
      }

      const categoryData = categorySnap.data();
      const currentRemaining = categoryData.remainingBudget || categoryData.annualBudget;
      
      // Calculate new remaining budget
      const adjustment = data.type === 'expense' ? -data.amount : data.amount;
      const newRemaining = currentRemaining + adjustment;

      // Update category remaining budget
      await updateDoc(categoryRef, {
        remainingBudget: newRemaining,
        updatedAt: new Date()
      });

      // Create the budget entry
      await addDoc(collection(db, 'budgetEntries'), newEntry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-entries'] });
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      onClose();
      reset();
    }
  });

  const onSubmit = async (data: BudgetFormData) => {
    await createEntry.mutateAsync(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Add Budget Entry
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                {...register('type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                {...register('categoryId', { required: 'Category is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                {settings?.budgetCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                Add Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}