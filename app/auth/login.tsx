import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/_core/firebase';
import { ScreenContainer } from '@/components/screen-container';
import { OfflineBanner } from '@/components/offline-banner';
import { useRouter } from 'expo-router';
import { getUserProfile } from '@/lib/_core/firestore';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNetworkValidation } from '@/lib/use-network-validation';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { validateNetwork } = useNetworkValidation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Login');
    if (!isOnline) return;

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser;
      console.log('User authenticated:', user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        console.log('User profile:', profile);
        if (!profile || profile.status === 'pending') {
          console.log('Redirecting to pending (profile missing or pending)');
          router.replace('/auth/pending');
          return;
        }

        console.log('User role:', profile.role);
        if (profile.role === 'admin') {
          router.replace('/admin-dashboard');
          return;
        }
      }

      router.replace('/staff-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Login');
    if (!isOnline) return;

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;
      if (!user) {
        throw new Error('Google sign-in failed');
      }

      const profile = await getUserProfile(user.uid);
      if (!profile) {
        throw new Error('No ERP profile found for this Google account. Use the same sign-in method used during registration.');
      }

      if (profile.status === 'pending') {
        router.replace('/auth/pending');
        return;
      }

      if (profile.role === 'admin') {
        router.replace('/admin-dashboard');
        return;
      }

      router.replace('/staff-dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <OfflineBanner />
      <View className="absolute inset-0 bg-gradient-to-b from-[#0f80b8] via-[#2aa1d7] to-[#e7f5fd]" />
      <View className="absolute -right-10 top-24 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <View className="absolute -left-10 top-32 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center">
          <View className="rounded-[40px] bg-white/95 p-6 shadow-2xl shadow-slate-900/10">
            <View className="mb-8 items-center">
              <View className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0f80b8]/10">
                <Text className="text-3xl">⚙️</Text>
              </View>
              <Text className="text-3xl font-semibold text-slate-900">Login to Account</Text>
              <Text className="mt-2 text-center text-sm text-slate-500 px-3">
                Access your staff/admin ERP workspace with secure credentials or Google sign-in.
              </Text>
            </View>

            <View className="space-y-4">
              {error ? (
                <View className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <Text className="text-rose-700 text-sm">{error}</Text>
                </View>
              ) : null}

              <View className="space-y-2">
                <Text className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Email</Text>
                <TextInput
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor="#0f80b8"
                />
              </View>

              <View className="space-y-2">
                <Text className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Password</Text>
                <TextInput
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry
                  selectionColor="#0f80b8"
                />
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="rounded-[28px] bg-gradient-to-r from-[#0f80b8] to-[#0ab1d3] py-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Login</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center justify-center gap-3">
                <View className="h-px flex-1 bg-slate-200" />
                <Text className="text-[10px] uppercase tracking-[0.36em] text-slate-400">or</Text>
                <View className="h-px flex-1 bg-slate-200" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={loading}
                className="flex-row items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white py-4"
              >
                <FontAwesome name="google" size={18} color="#DB4437" />
                <Text className="text-slate-900 font-semibold">Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-6 flex-row justify-center gap-1 px-2">
            <Text className="text-slate-500">Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text className="text-[#0f80b8] font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
