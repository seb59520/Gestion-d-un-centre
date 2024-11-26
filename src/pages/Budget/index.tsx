import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { PieChart, BarChart2, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import type { BudgetCategory, BudgetEntry, CenterSettings } from '../../types';
import BudgetOverview from './BudgetOverview';
import CategoryList from './CategoryList';
import BudgetModal from './BudgetModal';
import CategoryModal from './CategoryModal';

type ViewMode = 'overview' | 'categories' | 'transactions';

export default function Budget() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: settings } = useQuery({
    queryKey: ['center-settings', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'centerSettings'),
        where('centerId', '==', currentUser?.centerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs[0]?.data() as CenterSettings;
    },
    enabled: !!currentUser
  });

  const { data: categories } = useQuery({
    queryKey: ['budget-categories', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'budgetCategories'),
        where('centerId', '==', currentUser?.centerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetCategory));
    },
    enabled: !!currentUser
  });

  const { data: entries } = useQuery({
    queryKey: ['budget-entries', currentUser?.centerId, selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      
      const q = query(
        collection(db, 'budgetEntries'),
        where('centerId', '==', currentUser?.centerId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BudgetEntry));
    },
    enabled: !!currentUser
  });

  const handleExportBudget = () => {
    // TODO: Implement budget export functionality
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Budget Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 first:rounded-l-md last:rounded-r-md`}
            >
              <PieChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'categories'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 first:rounded-l-md last:rounded-r-md`}
            >
              <BarChart2 className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExportBudget}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => {
              setSelectedCategory(undefined);
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <BudgetOverview
          categories={categories || []}
          entries={entries || []}
          year={selectedYear}
          budgetType={settings?.budgetYear || 'civil'}
        />
      ) : (
        <CategoryList
          categories={categories || []}
          entries={entries || []}
          onEditCategory={handleEditCategory}
        />
      )}

      <BudgetModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
      />
    </div>
  );
}