import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Edit, Trash2, Plus } from 'lucide-react';
import type { LeisureCenter } from '../../types';
import CenterModal from './CenterModal';

export default function Centers() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<LeisureCenter | null>(null);

  const { data: centers, isLoading } = useQuery({
    queryKey: ['centers', currentUser?.centerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'centers'),
        where('id', '==', currentUser?.centerId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LeisureCenter));
    },
    enabled: !!currentUser
  });

  const createCenter = useMutation({
    mutationFn: async (center: Omit<LeisureCenter, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, 'centers'), {
        ...center,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      setIsModalOpen(false);
    }
  });

  const updateCenter = useMutation({
    mutationFn: async (center: LeisureCenter) => {
      const centerRef = doc(db, 'centers', center.id);
      await updateDoc(centerRef, {
        ...center,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      setIsModalOpen(false);
    }
  });

  const deleteCenter = useMutation({
    mutationFn: async (centerId: string) => {
      await deleteDoc(doc(db, 'centers', centerId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
    }
  });

  const handleOpenModal = (center?: LeisureCenter) => {
    setSelectedCenter(center || null);
    setIsModalOpen(true);
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
        <h1 className="text-2xl font-semibold text-gray-900">Leisure Centers</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Center
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {centers?.map((center) => (
          <div
            key={center.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 text-indigo-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">{center.name}</h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal(center)}
                  className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => deleteCenter.mutate(center.id)}
                  className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-gray-600">
              <p>{center.address}</p>
              <p>{center.phone}</p>
              <p>{center.email}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">Directors</p>
                  <p className="text-gray-600">{center.directors.length}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Assistants</p>
                  <p className="text-gray-600">{center.assistants.length}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        center={selectedCenter}
        onSubmit={(center) => {
          if (selectedCenter) {
            updateCenter.mutate({ ...selectedCenter, ...center });
          } else {
            createCenter.mutate(center);
          }
        }}
      />
    </div>
  );
}