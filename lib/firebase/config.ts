import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWE4YTyQU1lQBS-LxnCBqRBUTFELGXe5s",
  authDomain: "soc-scheduler-c2ad9.firebaseapp.com",
  projectId: "soc-scheduler-c2ad9",
  storageBucket: "soc-scheduler-c2ad9.firebasestorage.app",
  messagingSenderId: "797316656144",
  appId: "1:797316656144:web:f67489232126114415ee95",
  measurementId: "G-0ZJRFCRFCQ"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
