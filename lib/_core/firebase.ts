import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  UserCredential 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from google-services.json and GoogleService-Info.plist
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDmvFdxYkYNTrcCvNeghqeVtJ33OHZ1dLY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ruth-tracking.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ruth-tracking',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ruth-tracking.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '357267932960',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:357267932960:android:7aaecd709d3c7cd8a5f945',
  // iOS specific config
  iosClientId: process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID || '357267932960-ojbepnr62avdrcb5p5o4ee2pmb406240.apps.googleusercontent.com',
  iosBundleId: process.env.EXPO_PUBLIC_FIREBASE_IOS_BUNDLE_ID || 'com.ruth.ruthtracking',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Sign-In provider
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export default app;
