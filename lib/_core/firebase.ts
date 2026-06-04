import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration - Replace with your actual Firebase project credentials if you later change projects
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA55qEcgi-dD9hrqHLEpIuseGOmc-qw8dY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ruth-tracking.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ruth-tracking',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ruth-tracking.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '357267932960',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:357267932960:ios:150309504bdd8699a5f945',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    return signInWithPopup(auth, googleProvider);
  }
  throw new Error('Google sign-in is only supported on web at the moment.');
}

export default app;
