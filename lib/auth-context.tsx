import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './_core/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  userRole: 'customer' | 'staff' | 'admin' | null;
  userStatus: 'pending' | 'approved' | 'rejected' | 'active' | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUserRole: (role: 'customer' | 'staff' | 'admin') => void;
  setUserStatus: (status: 'pending' | 'approved' | 'rejected' | 'active') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'staff' | 'admin' | null>(null);
  const [userStatus, setUserStatus] = useState<'pending' | 'approved' | 'rejected' | 'active' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Load user role and status from AsyncStorage
        const savedRole = await AsyncStorage.getItem(`user_role_${firebaseUser.uid}`);
        const savedStatus = await AsyncStorage.getItem(`user_status_${firebaseUser.uid}`);
        
        if (savedRole) setUserRole(savedRole as any);
        if (savedStatus) setUserStatus(savedStatus as any);
      } else {
        setUserRole(null);
        setUserStatus(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
    setUserStatus(null);
  };

  const updateUserRole = (role: 'customer' | 'staff' | 'admin') => {
    setUserRole(role);
    if (user) {
      AsyncStorage.setItem(`user_role_${user.uid}`, role);
    }
  };

  const updateUserStatus = (status: 'pending' | 'approved' | 'rejected' | 'active') => {
    setUserStatus(status);
    if (user) {
      AsyncStorage.setItem(`user_status_${user.uid}`, status);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        userStatus,
        loading,
        logout,
        setUserRole: updateUserRole,
        setUserStatus: updateUserStatus,
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
