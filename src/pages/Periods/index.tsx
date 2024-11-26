import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users, Calendar, GraduationCap, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Period, User } from '../../types';
import PeriodModal from './PeriodModal';
import PeriodDetails from './PeriodDetails';
import { generateSchoolYears, getCurrentSchoolYear, formatSchoolYear } from '../../utils/schoolYears';

export default function Periods() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('');

  const schoolYears = generateSchoolYears();
  const currentSchoolYear = getCurrentSchoolYear(schoolYears);

  // Set the current school year as default if not already selected
  useEffect(() => {
    if (!selectedSchoolYear && currentSchoolYear) {
      setSelectedSchoolYear(currentSchoolYear.name);
    }
  }, [currentSchoolYear, selectedSchoolYear]);

  const { data: periods, isLoading: isLoadingPeriods } = useQuery({
    queryKey: ['periods', currentUser?.centerId, selectedSchoolYear],
    queryFn: async () => {
      const q = query(
        collection(db, 'periods'),
        where('centerId', '==', currentUser?.centerId),
        where('schoolYearId', '==', selectedSchoolYear)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          startDate: data.startDate?.toDate?.() || parseISO(data.startDate),
          endDate: data.endDate?.toDate?.() || parseISO(data.endDate)
        } as Period;
      });
    },
    enabled: !!currentUser && !!selectedSchoolYear
  });

  const { data: animators } = useQuery({
    queryKey: ['animators', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('centerId', '==', currentUser?.centerId),
        where('role', '==', 'animator')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    },
    enabled: !!currentUser
  });

  const handleOpenModal = (period?: Period) => {
    if (period) {
      setSelectedPeriod(period);
    } else {
      setSelectedPeriod(null);
    }
    setIsModalOpen(true);
  };

  const getAnimatorNames = (animatorIds: string[]) => {
    return animatorIds
      .map(id => {
        const animator = animators?.find(a => a.id === id);
        return animator ? `${animator.firstName} ${animator.lastName}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  if (isLoadingPeriods) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Periods</h1>
          <select
            value={selectedSchoolYear}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {schoolYears.map((year) => (
              <option key={year.name} value={year.name}>
                {formatSchoolYear(year.name)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Period
        </button>
      </div>

      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <GraduationCap className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">School Year Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolYears.find(year => year.name === selectedSchoolYear)?.vacationPeriods.map((vacation) => (
              <div key={vacation.name} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{vacation.name}</h3>
                <p className="text-sm text-gray-500">
                  {format(parseISO(vacation.start), 'PP')} - {format(parseISO(vacation.end), 'PP')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {periods?.map((period) => (
          <div key={period.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className={`h-6 w-6 ${
                    period.type === 'wednesday' ? 'text-green-600' : 'text-blue-600'
                  } mr-2`} />
                  <h2 className="text-xl font-semibold text-gray-900">{period.name}</h2>
                  <span className={`ml-4 px-2 py-1 text-xs font-medium rounded-full capitalize ${
                    period.type === 'wednesday' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {period.type}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenModal(period)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 text-gray-600 mb-4">
                <p>
                  {format(period.startDate, 'PP')} - {format(period.endDate, 'PP')}
                </p>
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  <span>
                    {period.animators.length} animator{period.animators.length !== 1 ? 's' : ''}:
                    {' '}{getAnimatorNames(period.animators)}
                  </span>
                </div>
              </div>

              <PeriodDetails period={period} />
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <PeriodModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPeriod(null);
          }}
          period={selectedPeriod}
          centerId={currentUser?.centerId || ''}
          animators={animators || []}
          schoolYearId={selectedSchoolYear}
        />
      )}
    </div>
  );
}