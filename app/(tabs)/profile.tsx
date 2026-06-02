import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, userRole, userStatus, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (!user) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 justify-center items-center px-6 gap-4">
          <Text className="text-2xl font-bold text-foreground">Sign In Required</Text>
          <Text className="text-muted text-center">Please sign in to view your profile</Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="w-full bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-background font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-6 py-8 gap-4 bg-primary/10 items-center">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
            <Text className="text-4xl">👤</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">{user.email}</Text>
            <View className="flex-row gap-2 items-center">
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-semibold capitalize">{userRole || 'Customer'}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                userStatus === 'approved' ? 'bg-success/20' : 'bg-warning/20'
              }`}>
                <Text className={`text-xs font-semibold capitalize ${
                  userStatus === 'approved' ? 'text-success' : 'text-warning'
                }`}>
                  {userStatus || 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View className="px-6 py-6 gap-4">
          <Text className="text-lg font-bold text-foreground">Account Information</Text>
          <View className="bg-surface rounded-lg p-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted">Email</Text>
              <Text className="text-foreground font-semibold">{user.email}</Text>
            </View>
            <View className="border-t border-border pt-3 flex-row justify-between">
              <Text className="text-muted">Role</Text>
              <Text className="text-foreground font-semibold capitalize">{userRole || 'Customer'}</Text>
            </View>
            <View className="border-t border-border pt-3 flex-row justify-between">
              <Text className="text-muted">Status</Text>
              <Text className="text-foreground font-semibold capitalize">{userStatus || 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View className="px-6 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Quick Links</Text>
          <View className="gap-2">
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">My Orders</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Notifications</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Settings</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="px-6 py-6 gap-3 mb-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error/10 border border-error rounded-lg py-3 items-center"
          >
            <Text className="text-error font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
