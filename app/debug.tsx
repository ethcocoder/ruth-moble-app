import { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { firebaseConfig } from '@/lib/_core/firebase';
import { getPendingUsers, getUserProfile } from '@/lib/_core/firestore';

export default function DebugScreen() {
  const { user, profile, logout, loading: authLoading } = useAuthContext();
  const [pendingResult, setPendingResult] = useState<string | null>(null);
  const [profileResult, setProfileResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDebug = async () => {
      if (authLoading) return;
      setLoading(true);
      setError(null);
      try {
        const currentProfile = await getUserProfile(user?.uid ?? '');
        setProfileResult(currentProfile ? JSON.stringify(currentProfile, null, 2) : 'No profile found');
      } catch (err) {
        setError(`Profile fetch failed: ${String(err)}`);
      }

      try {
        const pending = await getPendingUsers();
        setPendingResult(`pending users count: ${pending.length}`);
      } catch (err) {
        setError((prev) => `${prev ? prev + '\n' : ''}Pending query failed: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    runDebug();
  }, [authLoading, user]);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} className="px-6 py-6">
        <View className="rounded-3xl border border-white/10 bg-surface p-5 shadow-lg">
          <Text className="text-lg font-bold text-foreground">Firestore Debug</Text>
          <Text className="mt-3 text-sm text-muted">This screen helps confirm the active Firebase project and user permissions.</Text>

          <View className="mt-5 rounded-3xl bg-[#0f172a] p-4">
            <Text className="text-xs uppercase tracking-[0.28em] text-cyan-300">Firebase Project</Text>
            <Text className="mt-2 text-sm text-white">projectId: {firebaseConfig.projectId}</Text>
            <Text className="text-sm text-white">authDomain: {firebaseConfig.authDomain}</Text>
          </View>

          <View className="mt-5 rounded-3xl bg-[#111827] p-4">
            <Text className="text-xs uppercase tracking-[0.28em] text-amber-300">Current Auth</Text>
            <Text className="mt-2 text-sm text-white">uid: {user?.uid ?? 'not signed in'}</Text>
            <Text className="text-sm text-white">email: {user?.email ?? 'unknown'}</Text>
            <Text className="text-sm text-white">role: {profile?.role ?? 'unknown'}</Text>
            <Text className="text-sm text-white">status: {profile?.status ?? 'unknown'}</Text>
          </View>

          <View className="mt-5 rounded-3xl bg-[#111827] p-4">
            <Text className="text-xs uppercase tracking-[0.28em] text-emerald-300">Live Results</Text>
            {loading ? (
              <ActivityIndicator color="#65a30d" className="mt-3" />
            ) : (
              <>
                <Text className="mt-3 text-sm text-white">Profile fetch: {profileResult ?? 'waiting...'}</Text>
                <Text className="mt-3 text-sm text-white">Pending list: {pendingResult ?? 'waiting...'}</Text>
              </>
            )}
            {error ? <Text className="mt-3 text-sm text-red-400">{error}</Text> : null}
          </View>

          <TouchableOpacity onPress={logout} className="mt-6 rounded-2xl bg-primary px-4 py-3 items-center">
            <Text className="text-background font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
