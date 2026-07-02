import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase conditionally to prevent crashes before env is set
// Temporarily disabled sync to Firebase per user request
const isConfigured = false; // !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const app = isConfigured && !getApps().length ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const googleProvider = app ? new GoogleAuthProvider() : null;

export { app, auth, db, googleProvider, isConfigured };
