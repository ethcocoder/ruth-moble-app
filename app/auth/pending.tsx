import { Text, View, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/_core/firebase';

export default function PendingApprovalScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/auth/login');
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 justify-center items-center px-6 gap-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 bg-warning/20 rounded-full items-center justify-center">
            <Text className="text-3xl">⏳</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">Pending Approval</Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            Your account has been created successfully. An administrator will review and approve your account shortly.
          </Text>
          <Text className="text-sm text-muted text-center">
            You will receive a notification once your account is approved.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="w-full bg-primary rounded-lg py-3 items-center"
        >
          <Text className="text-background font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
