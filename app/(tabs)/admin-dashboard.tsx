import { useEffect, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import {
  getPendingUsers,
  getTotalRevenue,
  getTotalUsersCount,
  getApprovedStaffCount,
  getTotalProductsCount,
  getTotalStockCount,
} from '@/lib/_core/firestore';

export default function AdminDashboardScreen() {
  const { userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [approvedEmployees, setApprovedEmployees] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!userRole || !userStatus) {
      router.replace('/auth/login');
      return;
    }

    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }

    if (userRole !== 'admin' || userStatus !== 'approved') {
      router.replace(userRole === 'staff' ? '/staff-dashboard' : '/auth/login');
      return;
    }

    const loadSummary = async () => {
      setLoading(true);
      try {
        const [usersCount, pendingUsers, approvedCount, revenue, productsCount, stockCount] = await Promise.all([
          getTotalUsersCount(),
          getPendingUsers(),
          getApprovedStaffCount(),
          getTotalRevenue(),
          getTotalProductsCount(),
          getTotalStockCount(),
        ]);

        setTotalUsers(usersCount);
        setPendingApprovals(pendingUsers.length);
        setApprovedEmployees(approvedCount);
        setTotalRevenue(revenue);
        setTotalProducts(productsCount);
        setTotalStock(stockCount);
      } catch (err) {
        console.warn('Failed to load admin summary', err);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [authLoading, router, userRole, userStatus]);

  const topStats = [
    {
      title: 'Total Users',
      value: totalUsers === null ? '--' : `${totalUsers}`,
      accent: 'text-cyan-300',
    },
    {
      title: 'Pending Approvals',
      value: pendingApprovals === null ? '--' : `${pendingApprovals}`,
      accent: 'text-amber-300',
    },
    {
      title: 'Revenue',
      value: totalRevenue === null ? '--' : `$${totalRevenue.toFixed(2)}`,
      accent: 'text-emerald-300',
    },
    {
      title: 'Employees',
      value: approvedEmployees === null ? '--' : `${approvedEmployees}`,
      accent: 'text-violet-300',
    },
  ];

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 space-y-6">
          <View className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 shadow-xl">
            <Text className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin Console</Text>
            <Text className="mt-4 text-3xl font-bold text-white">Master the business from one dashboard</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-300">Track product flow, staff approvals and revenue with premium controls designed for fast decision making.</Text>
            <View className="mt-6 flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={() => router.push('/admin-users')}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3"
              >
                <Text className="text-sm text-white">Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin-products')}
                className="rounded-full border border-white/10 bg-cyan-500 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-slate-950">Manage Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/admin-reports')}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-3"
              >
                <Text className="text-sm text-white">Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4">
            {topStats.map((item) => (
              <View key={item.title} className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
                <Text className="text-sm uppercase tracking-[0.2em] text-muted">{item.title}</Text>
                <Text className={`mt-4 text-3xl font-semibold ${item.accent}`}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View className="grid gap-4">
            <View className="rounded-[28px] border border-border bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">Approvals Overview</Text>
                <Text className="text-sm text-muted">Live updates in real time</Text>
              </View>
              <View className="mt-4 grid grid-cols-2 gap-4">
                <View className="rounded-3xl bg-[#111827] p-4">
                  <Text className="text-xs uppercase tracking-[0.2em] text-cyan-300">Pending Staff</Text>
                  <Text className="mt-3 text-3xl font-semibold text-white">{pendingApprovals === null ? '--' : pendingApprovals}</Text>
                </View>
                <View className="rounded-3xl bg-[#111827] p-4">
                  <Text className="text-xs uppercase tracking-[0.2em] text-emerald-300">Active Products</Text>
                  <Text className="mt-3 text-3xl font-semibold text-white">{totalProducts === null ? '--' : totalProducts}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/admin-users')}
                className="mt-5 rounded-full bg-primary px-4 py-3 items-center"
              >
                <Text className="text-background font-semibold">Review pending staff</Text>
              </TouchableOpacity>
            </View>

            <View className="rounded-[28px] border border-border bg-surface p-5">
              <Text className="text-lg font-semibold text-foreground mb-4">Business Health</Text>
              <View className="space-y-3">
                <View className="rounded-3xl border border-border bg-background/80 p-4 flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Revenue</Text>
                  <Text className="text-foreground font-semibold">{totalRevenue === null ? '--' : `$${totalRevenue.toFixed(2)}`}</Text>
                </View>
                <View className="rounded-3xl border border-border bg-background/80 p-4 flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Approved Staff</Text>
                  <Text className="text-foreground font-semibold">{approvedEmployees === null ? '--' : approvedEmployees}</Text>
                </View>
                <View className="rounded-3xl border border-border bg-background/80 p-4 flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Inventory</Text>
                  <Text className="text-foreground font-semibold">{totalStock === null ? '--' : `${totalStock} units`}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
