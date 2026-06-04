import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';

export default function SplashScreen() {
  const router = useRouter();
  const { user, userRole, userStatus, loading } = useAuthContext();
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    const timeout = setTimeout(() => {
      if (loading) return;

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      if (userStatus === 'pending') {
        router.replace('/auth/pending');
        return;
      }

      if (userRole === 'admin') {
        router.replace('/admin-dashboard');
        return;
      }

      router.replace('/staff-dashboard');
    }, 2000);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [loading, router, user, userRole, userStatus, logoOpacity]);

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 items-center justify-center px-6 gap-6">
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [
              {
                scale: logoOpacity.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.95, 1.05],
                }),
              },
            ],
          }}
          className="w-40 h-40 bg-primary rounded-full items-center justify-center"
        >
          <Text className="text-5xl">⚙️</Text>
        </Animated.View>
        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground">Kitch ERP</Text>
          <Text className="text-sm text-muted text-center">
            Management system for staff and admin workflows.
          </Text>
        </View>
        <ActivityIndicator color="#0a7ea4" />
      </View>
    </ScreenContainer>
  );
}
