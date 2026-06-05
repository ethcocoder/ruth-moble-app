import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getActiveProducts, getSalesByStaff, Product, SaleRecord } from '@/lib/_core/firestore';
import { Card, CardHeader, CardTitle, CardContent, PressableCard } from '@/components/ui/card';

export default function StaffDashboardScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }

    if (userRole !== 'staff' || userStatus !== 'approved') {
      router.replace(userRole === 'admin' ? '/admin-dashboard' : '/auth/login');
      return;
    }
  }, [authLoading, router, userRole, userStatus]);

  const loadDashboard = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [activeProducts, sales] = await Promise.all([
        getActiveProducts(),
        getSalesByStaff(profile.uid),
      ]);
      setProducts(activeProducts);
      setRecentSales(sales);
    } catch (err) {
      console.warn('Failed to load staff dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [profile?.uid]);

  const todayStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const totalProducts = products.length;
  const lowStockCount = products.filter((item) => item.stock <= 5).length;

  const salesToday = useMemo(() => {
    return recentSales.filter((sale) => {
      if (!sale.createdAt) return false;
      const date = typeof sale.createdAt.toDate === 'function' ? sale.createdAt.toDate() : new Date(sale.createdAt as any);
      return date >= todayStart;
    }).length;
  }, [recentSales, todayStart]);

  const revenueToday = useMemo(() => {
    return recentSales.reduce((sum, sale) => {
      if (!sale.createdAt) return sum;
      const date = typeof sale.createdAt.toDate === 'function' ? sale.createdAt.toDate() : new Date(sale.createdAt as any);
      return date >= todayStart ? sum + sale.totalAmount : sum;
    }, 0);
  }, [recentSales, todayStart]);

  const recentSalesList = useMemo(() => recentSales.slice(0, 5), [recentSales]);

  const kpis = [
    { label: 'Products', value: `${totalProducts}`, icon: 'inventory' },
    { label: 'Low Stock', value: `${lowStockCount}`, icon: 'warning' },
    { label: 'Today Sales', value: `${salesToday}`, icon: 'shopping_cart' },
    { label: 'Today Revenue', value: `${revenueToday.toFixed(0)} ETB`, icon: 'attach_money' },
  ];

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-muted text-lg mt-1">Welcome back, {profile?.displayName || 'User'}!</Text>
        </View>

        {/* KPI Grid */}
        <View className="px-6 py-2">
          {loading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="var(--color-primary)" />
            </View>
          ) : (
            <FlatList
              data={kpis}
              keyExtractor={(item) => item.label}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <Card className="flex-1 items-center justify-center p-4">
                  <CardContent className="py-4 items-center">
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-3">
                      <Text className="text-primary text-2xl">{item.icon === 'inventory' ? '📦' : item.icon === 'warning' ? '⚠️' : item.icon === 'shopping_cart' ? '🧾' : '💵'}</Text>
                    </View>
                    <Text className="text-muted text-xs text-center mb-1">{item.label}</Text>
                    <Text className="text-foreground font-bold text-2xl">{item.value}</Text>
                  </CardContent>
                </Card>
              )}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground px-1">Quick Actions</Text>
          <View className="gap-3">
            <PressableCard
              onPress={() => router.push('/staff-sales')}
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 border-transparent"
            >
              <CardContent className="py-4 items-center">
                <Text className="text-background font-semibold text-lg">Record New Sale</Text>
              </CardContent>
            </PressableCard>
            <PressableCard onPress={() => router.push('/staff-products')}>
              <CardContent className="py-4 items-center">
                <Text className="text-foreground font-semibold text-lg">Manage Products</Text>
              </CardContent>
            </PressableCard>
          </View>
        </View>

        {/* Recent Sales */}
        <View className="px-6 py-4 gap-3">
          <View className="flex-row justify-between items-center px-1">
            <Text className="text-lg font-bold text-foreground">Recent Sales</Text>
            <TouchableOpacity onPress={() => router.push('/staff-sales-history')}>
              <Text className="text-primary font-semibold text-sm">View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="var(--color-primary)" />
            </View>
          ) : recentSalesList.length === 0 ? (
            <Card className="p-6 items-center justify-center">
              <Text className="text-muted text-center">No sales recorded yet</Text>
            </Card>
          ) : (
            <View className="gap-3">
              {recentSalesList.map((item) => {
                const date = item.createdAt && typeof item.createdAt.toDate === 'function'
                  ? item.createdAt.toDate()
                  : item.createdAt
                    ? new Date(item.createdAt as any)
                    : null;
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="py-4 flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-base">{item.staffName || 'Sale'}</Text>
                        <Text className="text-muted text-xs mt-1">Items: {item.items.length}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-primary font-bold text-lg">{item.totalAmount.toFixed(0)} ETB</Text>
                        <Text className="text-muted text-xs">
                          {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
