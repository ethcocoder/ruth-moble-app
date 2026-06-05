import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './_core/firebase';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  UserProfile,
  UserRole,
  UserStatus,
  ThemePreference,
  LanguagePreference,
  hasAdminUser,
} from './_core/firestore';
import i18n from './i18n';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  userRole: UserRole | null;
  userStatus: UserStatus | null;
  loading: boolean;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'language' | 'theme'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const savedProfile = await getUserProfile(uid);

        if (savedProfile) {
          setProfile(savedProfile);
        } else {
          const isAdmin = !(await hasAdminUser());
          const role: UserRole = isAdmin ? 'admin' : 'staff';
          const status: UserStatus = isAdmin ? 'approved' : 'pending';
          const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
            uid,
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? '',
            role,
            status,
            language: 'en',
            theme: 'light',
          };
          await createUserProfile(newProfile);
          setProfile({ ...newProfile, createdAt: null, updatedAt: null });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sync i18n language with profile language
  useEffect(() => {
    if (profile?.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'displayName' | 'language' | 'theme'>>) => {
      if (!user) return;
      const uid = user.uid;
      await updateUserProfile(uid, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [user],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user || !user.email) {
        throw new Error('User not found');
      }
      
      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userRole: profile?.role ?? null,
        userStatus: profile?.status ?? null,
        loading,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
