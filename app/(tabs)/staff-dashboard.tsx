import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { getActiveProducts, getSalesByStaff, Product, SaleRecord } from '@/lib/_core/firestore';

export default function StaffDashboardScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
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
    { label: 'Total Products', value: `${totalProducts}`, icon: '📦' },
    { label: 'Low Stock', value: `${lowStockCount}`, icon: '⚠️' },
    { label: "Today's Sales", value: `${salesToday}`, icon: '🧾' },
    { label: 'Daily Revenue', value: `$${revenueToday.toFixed(2)}`, icon: '💵' },
  ];

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Staff Dashboard</Text>
          <Text className="text-muted">Live sales and inventory insights.</Text>
        </View>

        <View className="px-6 py-6 gap-3">
          {loading ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : (
            <FlatList
              data={kpis}
              keyExtractor={(item) => item.label}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View className="flex-1 bg-surface rounded-lg p-4 items-center gap-2">
                  <Text className="text-3xl">{item.icon}</Text>
                  <Text className="text-muted text-xs text-center">{item.label}</Text>
                  <Text className="text-foreground font-bold text-lg">{item.value}</Text>
                </View>
              )}
            />
          )}
        </View>

        <View className="px-6 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Quick Actions</Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => router.push('/staff-sales')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">Record Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/staff-products')}
              className="bg-surface border border-border rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">Manage Products</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6 py-6 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">Recent Sales</Text>
            <TouchableOpacity>
              <Text className="text-primary font-semibold text-sm">View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : recentSalesList.length === 0 ? (
            <Text className="text-muted">No sales recorded yet.</Text>
          ) : (
            <FlatList
              data={recentSalesList}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const date = item.createdAt && typeof item.createdAt.toDate === 'function'
                  ? item.createdAt.toDate()
                  : item.createdAt
                    ? new Date(item.createdAt as any)
                    : null;
                return (
                  <View className="bg-surface rounded-lg p-4 mb-2 flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">{item.staffName || item.id}</Text>
                      <Text className="text-muted text-xs mt-1">Items: {item.items.length}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary font-bold">${item.totalAmount.toFixed(2)}</Text>
                      <Text className="text-muted text-xs">
                        {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
