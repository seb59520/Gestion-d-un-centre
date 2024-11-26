import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import type { Document, TimeEntry, Notification, User } from '../types';

export async function checkDocumentExpirations(userId: string, centerId: string) {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    where('centerId', '==', centerId)
  );
  
  const snapshot = await getDocs(q);
  const documents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
  
  const thirtyDaysFromNow = addDays(new Date(), 30);
  
  for (const document of documents) {
    if (!document.expiryDate) continue;
    
    const expiryDate = new Date(document.expiryDate);
    
    if (isBefore(expiryDate, thirtyDaysFromNow)) {
      await createNotification({
        userId,
        centerId,
        type: 'document_expiry',
        title: 'Document Expiring Soon',
        message: `Your ${document.type} "${document.name}" will expire on ${format(expiryDate, 'PP')}. Please update it.`,
        link: `/animators?document=${document.id}`
      });
    }
  }
}

export async function checkMissingTimesheets(userId: string, centerId: string) {
  const today = new Date();
  const yesterday = addDays(today, -1);
  
  const q = query(
    collection(db, 'timeEntries'),
    where('userId', '==', userId),
    where('centerId', '==', centerId),
    where('date', '==', format(yesterday, 'yyyy-MM-dd'))
  );
  
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TimeEntry));
  
  if (entries.length === 0) {
    await createNotification({
      userId,
      centerId,
      type: 'missing_timesheet',
      title: 'Missing Time Entry',
      message: `You haven't recorded any time entries for ${format(yesterday, 'PP')}. Please update your timesheet.`,
      link: '/time-tracking'
    });
  }
}

interface CreateNotificationParams {
  userId: string;
  centerId: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const notification: Omit<Notification, 'id'> = {
    ...params,
    status: 'unread',
    createdAt: new Date()
  };
  
  await addDoc(collection(db, 'notifications'), notification);
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    status: 'read',
    readAt: new Date()
  });
}

export async function dismissNotification(notificationId: string) {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    status: 'dismissed'
  });
}