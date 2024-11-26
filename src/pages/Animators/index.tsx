import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, FileText, AlertTriangle, CheckCircle, Calendar, Clock } from 'lucide-react';
import type { User, Document } from '../../types';
import AnimatorModal from './AnimatorModal';
import DocumentModal from './DocumentModal';
import { addDays, differenceInYears } from 'date-fns';

export default function Animators() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isAnimatorModalOpen, setIsAnimatorModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedAnimator, setSelectedAnimator] = useState<User | null>(null);

  const { data: animators, isLoading } = useQuery({
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

  const { data: documents } = useQuery({
    queryKey: ['documents', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'documents'),
        where('centerId', '==', currentUser?.centerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
    },
    enabled: !!currentUser
  });

  const handleOpenAnimatorModal = (animator?: User) => {
    setSelectedAnimator(animator || null);
    setIsAnimatorModalOpen(true);
  };

  const handleOpenDocumentModal = (animator: User) => {
    setSelectedAnimator(animator);
    setIsDocumentModalOpen(true);
  };

  const getAnimatorDocuments = (animatorId: string) => {
    return documents?.filter(doc => doc.userId === animatorId) || [];
  };

  const getDocumentStatus = (animatorId: string) => {
    const docs = getAnimatorDocuments(animatorId);
    const hasInvalidDocs = docs.some(doc => !doc.isValid);
    const hasExpiringDocs = docs.some(doc => {
      if (!doc.expiryDate) return false;
      const expiryDate = new Date(doc.expiryDate);
      const thirtyDaysFromNow = addDays(new Date(), 30);
      return expiryDate <= thirtyDaysFromNow;
    });

    return {
      total: docs.length,
      hasInvalidDocs,
      hasExpiringDocs
    };
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Animators</h1>
        <button
          onClick={() => handleOpenAnimatorModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Animator
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {animators?.map((animator) => {
          const docStatus = getDocumentStatus(animator.id);
          
          return (
            <div
              key={animator.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {animator.firstName[0]}{animator.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {animator.firstName} {animator.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{animator.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAnimatorModal(animator)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 text-gray-600">
                <p>{animator.phone}</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(animator.dateOfBirth)} years old</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Seniority: {calculateSeniority(new Date(animator.createdAt))}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => handleOpenDocumentModal(animator)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documents ({docStatus.total})
                  {docStatus.hasInvalidDocs && (
                    <AlertTriangle className="h-4 w-4 ml-2 text-red-500" />
                  )}
                  {docStatus.hasExpiringDocs && (
                    <AlertTriangle className="h-4 w-4 ml-2 text-amber-500" />
                  )}
                  {!docStatus.hasInvalidDocs && !docStatus.hasExpiringDocs && docStatus.total > 0 && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                  )}
                </button>

                {animator.personalAccessToken && (
                  <a
                    href={`/time-tracking?token=${animator.personalAccessToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Personal Time Tracking
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatorModal
        isOpen={isAnimatorModalOpen}
        onClose={() => setIsAnimatorModalOpen(false)}
        animator={selectedAnimator}
        centerId={currentUser?.centerId || ''}
      />

      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        animator={selectedAnimator}
        documents={selectedAnimator ? getAnimatorDocuments(selectedAnimator.id) : []}
      />
    </div>
  );
}