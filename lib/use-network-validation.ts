import { useNetwork } from '@/lib/network-context';
import { Alert } from 'react-native';

export function useNetworkValidation() {
  const { isOnline, checkNetwork } = useNetwork();

  const validateNetwork = async (featureName?: string) => {
    const online = await checkNetwork();
    if (!online) {
      Alert.alert(
        'No Internet Connection',
        featureName 
          ? `${featureName} requires an internet connection. Please check your network settings and try again.`
          : 'This feature requires an internet connection. Please check your network settings and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  return {
    isOnline,
    validateNetwork,
  };
}
