import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useThemeContext } from '@/lib/theme-provider';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'am', label: 'Amharic' },
] as const;

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function ProfileScreen() {
  const { user, profile, logout, updateProfile, loading } = useAuthContext();
  const { setColorScheme } = useThemeContext();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [theme, setTheme] = useState(profile?.theme ?? 'light');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const saveSettings = async () => {
    if (!profile) return;
    setSaving(true);
    await updateProfile({ displayName, language, theme });
    setColorScheme(theme);
    setSaving(false);
  };

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </ScreenContainer>
    );
  }

  if (!user || !profile) {
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
        <View className="px-6 py-8 gap-4 bg-primary/10 items-center">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center">
            <Text className="text-4xl">👤</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">{profile.displayName || user.email}</Text>
            <View className="flex-row gap-2 items-center">
              <View className="bg-primary/20 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-semibold capitalize">{profile.role}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${
                profile.status === 'approved' ? 'bg-success/20' : 'bg-warning/20'
              }`}>
                <Text className={`text-xs font-semibold capitalize ${
                  profile.status === 'approved' ? 'text-success' : 'text-warning'
                }`}>
                  {profile.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 py-6 gap-4">
          <Text className="text-lg font-bold text-foreground">Account Settings</Text>
          <View className="bg-surface rounded-lg p-4 gap-4">
            <View>
              <Text className="text-muted mb-2">Full Name</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View>
              <Text className="text-muted mb-2">Language</Text>
              <View className="flex-row gap-2 flex-wrap">
                {LANGUAGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setLanguage(option.value)}
                    className={`px-4 py-2 rounded-full border ${
                      language === option.value ? 'bg-primary border-primary' : 'bg-surface border-border'
                    }`}
                  >
                    <Text className={`${language === option.value ? 'text-background' : 'text-foreground'} text-sm`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-muted mb-2">Theme</Text>
              <View className="flex-row gap-2 flex-wrap">
                {THEME_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setTheme(option.value)}
                    className={`px-4 py-2 rounded-full border ${
                      theme === option.value ? 'bg-primary border-primary' : 'bg-surface border-border'
                    }`}
                  >
                    <Text className={`${theme === option.value ? 'text-background' : 'text-foreground'} text-sm`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={saveSettings}
              className="bg-primary rounded-lg py-3 items-center"
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-semibold">Save Settings</Text>}
            </TouchableOpacity>
          </View>
        </View>

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
