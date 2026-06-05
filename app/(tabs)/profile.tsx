import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useThemeContext } from '@/lib/theme-provider';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { user, profile, logout, updateProfile, loading, changePassword } = useAuthContext();
  const { setColorScheme } = useThemeContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [theme, setTheme] = useState(profile?.theme ?? 'light');
  const [saving, setSaving] = useState(false);
  
  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.passwordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordMismatch'));
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), t('profile.passwordChanged'));
      handleCancel();
    } catch (err: any) {
      Alert.alert(t('common.error'), t('profile.passwordError'));
    } finally {
      setChangingPassword(false);
    }
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
          <Text className="text-2xl font-bold text-foreground">{t('auth.signIn')}</Text>
          <Text className="text-muted text-center">{t('auth.loginSubtitle')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="w-full bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-background font-semibold">{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const LANGUAGE_OPTIONS = [
    { value: 'en', label: t('profile.english') },
    { value: 'am', label: t('profile.amharic') },
  ] as const;

  const THEME_OPTIONS = [
    { value: 'light', label: t('profile.light') },
    { value: 'dark', label: t('profile.dark') },
  ] as const;

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
          <Text className="text-lg font-bold text-foreground">{t('profile.displayName')}</Text>
          <View className="bg-surface rounded-lg p-4 gap-4">
            <View>
              <Text className="text-muted mb-2">{t('profile.displayName')}</Text>
              <TextInput
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View>
              <Text className="text-muted mb-2">{t('profile.language')}</Text>
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
              <Text className="text-muted mb-2">{t('profile.theme')}</Text>
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
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-semibold">{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password Section */}
        <View className="px-6 py-6 gap-4">
          <Text className="text-lg font-bold text-foreground">{t('profile.security')}</Text>
          <TouchableOpacity
            onPress={() => setShowChangePassword(true)}
            className="bg-surface rounded-lg p-4"
          >
            <Text className="text-foreground font-semibold">{t('profile.changePassword')}</Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 py-6 gap-3 mb-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-error/10 border border-error rounded-lg py-3 items-center"
          >
            <Text className="text-error font-semibold">{t('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-background rounded-xl p-6 w-full max-w-md gap-4">
            <Text className="text-xl font-bold text-foreground mb-2">{t('profile.changePassword')}</Text>
            
            <View>
              <Text className="text-muted mb-2">{t('profile.currentPassword')}</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder={t('profile.currentPassword')}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View>
              <Text className="text-muted mb-2">{t('profile.newPassword')}</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder={t('profile.newPassword')}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View>
              <Text className="text-muted mb-2">{t('profile.confirmPassword')}</Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder={t('profile.confirmPassword')}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleChangePassword}
                className="flex-1 bg-primary rounded-lg py-3 items-center"
                disabled={changingPassword}
              >
                {changingPassword ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-semibold">{t('common.update')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
