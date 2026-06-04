import { ScrollView, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/_core/firebase';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { createUserProfile, hasAdminUser, UserRole, UserStatus } from '@/lib/_core/firestore';
import { FontAwesome } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const isAdmin = !(await hasAdminUser());
      const role: UserRole = isAdmin ? 'admin' : 'staff';
      const status: UserStatus = isAdmin ? 'approved' : 'pending';

      await createUserProfile({
        uid: user.uid,
        email,
        displayName,
        role,
        status,
        language: 'en',
        theme: 'light',
      });

      router.replace(isAdmin ? '/admin-dashboard' : '/auth/pending');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="absolute inset-0 bg-gradient-to-b from-[#0f80b8] via-[#2aa1d7] to-[#e7f5fd]" />
      <View className="absolute -right-10 top-24 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
      <View className="absolute -left-10 top-32 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1 justify-center">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-semibold text-background">Create Account</Text>
            <Text className="mt-2 text-center text-sm text-background/80 px-3">
              Register a staff or admin account and begin managing operations securely.
            </Text>
          </View>

          <View className="rounded-[40px] bg-white/95 p-6 shadow-2xl shadow-slate-900/10">
            <View className="mb-6 items-center justify-center rounded-3xl bg-[#0f80b8]/10 py-4">
              <Text className="text-4xl">⚙️</Text>
            </View>

            <View className="space-y-4">
              {error ? (
                <View className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <Text className="text-rose-700 text-sm">{error}</Text>
                </View>
              ) : null}

              <View className="space-y-2">
                <Text className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Full Name</Text>
                <TextInput
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm"
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!loading}
                  selectionColor="#0f80b8"
                />
              </View>

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

              <Text className="text-sm text-slate-500">
                Staff users are created pending approval by default. You will be signed in automatically and shown the waiting page.
              </Text>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                className="rounded-[28px] bg-gradient-to-r from-[#0f80b8] to-[#0ab1d3] py-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Create Account</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center justify-center gap-3">
                <View className="h-px flex-1 bg-slate-200" />
                <Text className="text-[10px] uppercase tracking-[0.36em] text-slate-400">or</Text>
                <View className="h-px flex-1 bg-slate-200" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleSignUp}
                disabled={loading}
                className="flex-row items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white py-4"
              >
                <FontAwesome name="google" size={18} color="#DB4437" />
                <Text className="text-slate-900 font-semibold">Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-6 flex-row justify-center gap-1 px-2">
            <Text className="text-slate-500">Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text className="text-[#0f80b8] font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
