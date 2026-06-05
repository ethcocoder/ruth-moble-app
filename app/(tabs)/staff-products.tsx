import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/lib/auth-context';
import { ProductManagement } from '@/components/product-management';
import { ScreenContainer } from '@/components/screen-container';
import { Text, View } from 'react-native';

export default function StaffProductsScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }
    if (userRole !== 'staff' || userStatus !== 'approved') {
      router.replace(userRole === 'admin' ? '/admin-dashboard' : '/auth/login');
      return;
    }
  }, [authLoading, router, userRole, userStatus]);

  if (!profile) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Loading product workspace...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return <ProductManagement profile={profile} isAdmin={false} />;
}
