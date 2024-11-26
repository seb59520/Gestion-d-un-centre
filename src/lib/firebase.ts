import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDQ8KamXtOOP46HN0Raoo-DGq8LCsy4xVo",
  authDomain: "gestion-d-un-centre.firebaseapp.com",
  projectId: "gestion-d-un-centre",
  storageBucket: "gestion-d-un-centre.appspot.com",
  messagingSenderId: "1087114150057",
  appId: "1:1087114150057:web:6b68e26e2d24ac40ba29b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.');
  }
});

// Connection status
let isConnected = navigator.onLine;

window.addEventListener('online', () => {
  isConnected = true;
  console.log('[Firebase] Back online');
});

window.addEventListener('offline', () => {
  isConnected = false;
  console.log('[Firebase] Offline mode');
});

export const getConnectionStatus = () => isConnected;