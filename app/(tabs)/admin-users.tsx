import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { approveUser, getPendingUsers, rejectUser, UserProfile } from '@/lib/_core/firestore';

export default function AdminUsersScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [pending, setPending] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPending(await getPendingUsers());
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }

    if (userRole !== 'admin' || userStatus !== 'approved') {
      router.replace(userRole === 'staff' ? '/staff-dashboard' : '/auth/login');
      return;
    }

    load();
  }, [authLoading, router, userRole, userStatus]);

  const handleAction = async (uid: string, action: 'approve' | 'reject') => {
    setSaving(uid);
    try {
      if (action === 'approve') {
        await approveUser(uid);
      } else {
        await rejectUser(uid);
      }
      await load();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(null);
    }
  };

  if (!profile) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Loading user details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View className="px-6 py-6 gap-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-foreground">Pending Staff Approvals</Text>
          <TouchableOpacity onPress={() => router.push('/admin-reports')} className="bg-primary px-4 py-2 rounded-lg">
            <Text className="text-background font-semibold">Reports</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#0a7ea4" />
        ) : pending.length === 0 ? (
          <Text className="text-muted">No pending users at the moment.</Text>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl p-4 mb-3">
                <Text className="text-foreground font-semibold">{item.displayName || item.email}</Text>
                <Text className="text-muted text-sm">{item.email}</Text>
                <Text className="text-muted text-sm">Role: {item.role}</Text>
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    onPress={() => handleAction(item.uid, 'approve')}
                    disabled={saving === item.uid}
                    className="flex-1 bg-success rounded-lg py-2 items-center"
                  >
                    <Text className="text-background font-semibold">Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAction(item.uid, 'reject')}
                    disabled={saving === item.uid}
                    className="flex-1 bg-error rounded-lg py-2 items-center"
                  >
                    <Text className="text-background font-semibold">Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
