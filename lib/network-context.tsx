import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';

interface NetworkContextType {
  isOnline: boolean;
  isLoading: boolean;
  checkNetwork: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const checkNetwork = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const online = networkState.isConnected ?? true;
      setIsOnline(online);
      return online;
    } catch (error) {
      console.warn('Network check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    checkNetwork().finally(() => setIsLoading(false));

    // Listen for network changes (web support is limited)
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isLoading,
        checkNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
