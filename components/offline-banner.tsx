import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNetwork } from '@/lib/network-context';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { isOnline, isLoading, checkNetwork } = useNetwork();
  const { t } = useTranslation();

  if (isOnline || isLoading) {
    return null;
  }

  return (
    <View className="bg-red-500 px-4 py-3 z-50">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-2xl">📡</Text>
          <Text className="text-white font-semibold text-sm flex-1">
            You're offline. Some features may not work.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => checkNetwork()}
          className="bg-white/20 px-4 py-2 rounded-lg active:bg-white/30"
        >
          <Text className="text-white font-semibold text-xs">Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
