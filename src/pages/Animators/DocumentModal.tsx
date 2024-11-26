import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { X, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { User, Document } from '../../types';
import { clsx } from 'clsx';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  animator: User | null;
  documents: Document[];
}

export default function DocumentModal({ isOpen, onClose, animator, documents }: DocumentModalProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<Document['type']>('other');
  const [expiryDate, setExpiryDate] = useState('');

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      if (!animator) return;
      
      setUploading(true);
      try {
        const storageRef = ref(storage, `documents/${animator.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'documents'), {
          userId: animator.id,
          centerId: animator.centerId,
          type: documentType,
          name: file.name,
          url,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          isValid: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } finally {
        setUploading(false);
        setDocumentType('other');
        setExpiryDate('');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const updateDocumentValidity = useMutation({
    mutationFn: async ({ documentId, isValid }: { documentId: string; isValid: boolean }) => {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, { isValid, updatedAt: new Date() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      await deleteDoc(doc(db, 'documents', documentId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument.mutate(file);
    }
  };

  const isDocumentExpiring = (doc: Document) => {
    if (!doc.expiryDate) return false;
    const expiryDate = new Date(doc.expiryDate);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return expiryDate <= thirtyDaysFromNow;
  };

  if (!isOpen || !animator) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Documents - {animator.firstName} {animator.lastName}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-4">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as Document['type'])}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="vaccine">Vaccine Certificate</option>
                <option value="diploma">Diploma</option>
                <option value="other">Other Document</option>
              </select>

              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="Expiry Date (if applicable)"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".pdf,image/*"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF or images up to 5MB</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg",
                    document.isValid ? "bg-gray-50" : "bg-red-50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900 mr-2">
                        {document.name}
                      </h4>
                      {isDocumentExpiring(document) && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" title="Expiring soon" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Type: {document.type}</p>
                      <p>Added: {format(new Date(document.createdAt), 'PP')}</p>
                      {document.expiryDate && (
                        <p>Expires: {format(new Date(document.expiryDate), 'PP')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateDocumentValidity({
                        documentId: document.id,
                        isValid: !document.isValid
                      })}
                      className={clsx(
                        "p-1 rounded-full",
                        document.isValid ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => deleteDocument.mutate(document.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}