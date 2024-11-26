import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Building2 } from 'lucide-react';
import type { CenterSettings, LeisureCenter } from '../../types';

export default function Settings() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [budgetYear, setBudgetYear] = useState<'civil' | 'school'>('civil');
  const [centerData, setCenterData] = useState<Partial<LeisureCenter>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    directors: [],
    assistants: []
  });

  // Fetch center settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['center-settings', currentUser?.centerId],
    queryFn: async () => {
      if (!currentUser?.centerId) return null;

      const q = query(
        collection(db, 'centerSettings'),
        where('centerId', '==', currentUser.centerId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const defaultSettings = {
          centerId: currentUser.centerId,
          budgetYear: 'civil' as const,
          budgetCategories: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'centerSettings'), defaultSettings);
        return { id: docRef.id, ...defaultSettings };
      }
      
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CenterSettings;
    },
    enabled: !!currentUser
  });

  // Fetch or create center data
  const { data: center, isLoading: isLoadingCenter } = useQuery({
    queryKey: ['center', currentUser?.centerId],
    queryFn: async () => {
      if (!currentUser?.centerId) return null;

      const centerRef = doc(db, 'centers', currentUser.centerId);
      const defaultCenter: LeisureCenter = {
        id: currentUser.centerId,
        name: '',
        address: '',
        phone: '',
        email: '',
        directors: [currentUser.id], // Add current user as director
        assistants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create the center document if it doesn't exist
      await setDoc(centerRef, defaultCenter, { merge: true });
      
      return defaultCenter;
    },
    enabled: !!currentUser
  });

  // Update local state when settings and center data are loaded
  useEffect(() => {
    if (settings) {
      setBudgetYear(settings.budgetYear);
    }
    if (center) {
      setCenterData({
        name: center.name,
        address: center.address,
        phone: center.phone,
        email: center.email,
        directors: center.directors,
        assistants: center.assistants
      });
    }
  }, [settings, center]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CenterSettings>) => {
      if (!settings || !currentUser) return;
      
      const settingsRef = doc(db, 'centerSettings', settings.id);
      await updateDoc(settingsRef, {
        ...newSettings,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-settings'] });
    }
  });

  const updateCenter = useMutation({
    mutationFn: async (data: Partial<LeisureCenter>) => {
      if (!currentUser?.centerId) return;
      
      const centerRef = doc(db, 'centers', currentUser.centerId);
      await setDoc(centerRef, {
        ...data,
        id: currentUser.centerId,
        updatedAt: new Date()
      }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center'] });
    }
  });

  const handleSaveAll = async () => {
    await Promise.all([
      updateSettings.mutateAsync({ budgetYear }),
      updateCenter.mutateAsync(centerData)
    ]);
  };

  if (isLoadingSettings || isLoadingCenter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <button
          onClick={handleSaveAll}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Center Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Center Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Center Name</label>
              <input
                type="text"
                value={centerData.name}
                onChange={(e) => setCenterData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={centerData.email}
                onChange={(e) => setCenterData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={centerData.phone}
                onChange={(e) => setCenterData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={centerData.address}
                onChange={(e) => setCenterData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Budget Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Budget Settings</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Year Type</label>
              <p className="mt-1 text-sm text-gray-500">
                Choose whether your budget should follow the civil year (January to December) or the school year (September to August)
              </p>
              <div className="mt-2">
                <select
                  value={budgetYear}
                  onChange={(e) => setBudgetYear(e.target.value as 'civil' | 'school')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="civil">Civil Year (Jan-Dec)</option>
                  <option value="school">School Year (Sep-Aug)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Budget Categories</label>
              <p className="mt-1 text-sm text-gray-500">
                Manage your budget categories in the Budget section
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.href = '/budget'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Manage Budget Categories
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}