import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getAllSalesByDate,
  SaleRecord,
} from '@/lib/_core/firestore';

export default function AdminDailySalesScreen() {
  const { userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const fetchedSales = await getAllSalesByDate(startOfDay, endOfDay);
      setSales(fetchedSales);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
  }, [authLoading, router, userRole, userStatus, selectedDate]);

  // Calculate metrics from sales
  const metrics = useMemo(() => {
    let itemsSold = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount ?? 0;
      totalCost += (sale.totalAmount ?? 0) - (sale.totalProfit ?? 0);
      sale.items.forEach((item) => {
        itemsSold += item.quantity;
      });
    });

    const dailyProfit = totalRevenue - totalCost;

    return {
      itemsSold,
      totalRevenue,
      totalCost,
      dailyProfit,
      saleCount: sales.length,
    };
  }, [sales]);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Daily Sales Log</Text>
          <Text className="text-muted">View all sales from staff</Text>
        </View>

        {/* Buttons: Excel, PDF */}
        <View className="px-6 py-4 gap-3">
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-surface border border-border rounded-lg py-3 flex-row items-center justify-center gap-2">
              <Text className="text-foreground font-bold">Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-surface border border-border rounded-lg py-3 flex-row items-center justify-center gap-2">
              <Text className="text-foreground font-bold">PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Section */}
        <View className="px-6 py-3">
          <View className="bg-surface rounded-lg p-5 gap-4">
            <TouchableOpacity
              className="flex-row items-center gap-3"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="bg-surface border border-border p-2 rounded-lg">
                <Text className="text-2xl">📅</Text>
              </View>
              <View className="flex-1 bg-surface border border-border rounded-lg p-3">
                <Text className="text-foreground text-lg text-center font-semibold">{format(selectedDate, 'MM/dd/yyyy')}</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-muted text-lg">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
          </View>
        </View>

        {/* Metrics Grid (2x2) */}
        <View className="px-6 py-4">
          {loading ? (
            <ActivityIndicator size="large" color="#0a7ea4" />
          ) : (
            <FlatList
              data={[
                { label: 'Items Sold', value: `${metrics.itemsSold}` },
                { label: 'Sales Count', value: `${metrics.saleCount}` },
                { label: 'Revenue', value: `${metrics.totalRevenue.toFixed(0)} ETB` },
                { label: 'Cost', value: `${metrics.totalCost.toFixed(0)} ETB` },
              ]}
              keyExtractor={(item) => item.label}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View className="flex-1 bg-surface rounded-lg p-4 items-center gap-2">
                  <Text className="text-muted text-xs text-center">{item.label}</Text>
                  <Text className="text-foreground font-bold text-lg">{item.value}</Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Daily Profit */}
        <View className="px-6 py-3">
          <View className="bg-surface rounded-lg p-5 gap-2">
            <Text className="text-muted text-sm">Daily Profit</Text>
            <Text className="text-foreground text-4xl font-bold">{metrics.dailyProfit.toFixed(0)} ETB</Text>
          </View>
        </View>

        {/* Sales Records */}
        <View className="px-6 py-6 gap-3">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">Sales Records</Text>
            <Text className="text-muted">All sales recorded across all staff</Text>
          </View>
          <View className="bg-surface rounded-lg overflow-hidden">
            <View className="flex-row bg-surface border-b border-border p-3">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Staff</Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Product</Text>
              </View>
              <View className="w-16">
                <Text className="text-foreground font-semibold text-center">Qty</Text>
              </View>
              <View className="w-20">
                <Text className="text-foreground font-semibold text-center">Total</Text>
              </View>
            </View>
            {sales.length === 0 ? (
              <View className="p-8 items-center justify-center">
                <Text className="text-muted">No sales recorded yet</Text>
              </View>
            ) : (
              <FlatList
                data={sales}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="flex-row items-center p-3 border-t border-border">
                    <View className="flex-1">
                      <Text className="text-foreground">{item.staffName}</Text>
                    </View>
                    <View className="flex-1">
                      {item.items.length > 0 ? (
                        <Text className="text-muted">{item.items[0].name}</Text>
                      ) : (
                        <Text className="text-muted">Product</Text>
                      )}
                    </View>
                    <View className="w-16 items-center">
                      <Text className="text-muted">
                        {item.items.reduce((sum, i) => sum + i.quantity, 0)}
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-foreground font-semibold">{item.totalAmount.toFixed(0)} ETB</Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </ScreenContainer>
  );
}
