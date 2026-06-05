import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  getSalesSummary, getTotalRevenue, getTotalProfit, getAllSales, SaleRecord, getTotalSalesCount } from '@/lib/_core/firestore';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AdminFinanceScreen() {
  const { userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailySummary, setDailySummary] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [weeklySummary, setWeeklySummary] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [monthlySummary, setMonthlySummary] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [allTimeRevenue, setAllTimeRevenue] = useState(0);
  const [allTimeProfit, setAllTimeProfit] = useState(0);
  const [allTimeSalesCount, setAllTimeSalesCount] = useState(0);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [daily, weekly, monthly, revenue, profit, salesCount, salesData] = await Promise.all([
        getSalesSummary('day'),
        getSalesSummary('week'),
        getSalesSummary('month'),
        getTotalRevenue(),
        getTotalProfit(),
        getTotalSalesCount(),
        getAllSales(),
      ]);
      setDailySummary(daily);
      setWeeklySummary(weekly);
      setMonthlySummary(monthly);
      setAllTimeRevenue(revenue);
      setAllTimeProfit(profit);
      setAllTimeSalesCount(salesCount);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

    loadData();
  }, [authLoading, router, userRole, userStatus]);

  if (loading) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        {/* Header */}
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Finance Dashboard</Text>
        </View>

        <View className="px-6 py-4 gap-4">
          {/* Daily KPIs */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Daily</Text>
            <FlatList
              data={[
                { label: 'Revenue', value: `${dailySummary.totalAmount.toFixed(2)} ETB` },
                { label: 'Profit', value: `${dailySummary.totalProfit.toFixed(2)} ETB` },
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
          </View>

          {/* Weekly KPIs */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Weekly</Text>
            <FlatList
              data={[
                { label: 'Revenue', value: `${weeklySummary.totalAmount.toFixed(2)} ETB` },
                { label: 'Profit', value: `${weeklySummary.totalProfit.toFixed(2)} ETB` },
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
          </View>

          {/* Monthly KPIs */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Monthly</Text>
            <FlatList
              data={[
                { label: 'Revenue', value: `${monthlySummary.totalAmount.toFixed(2)} ETB` },
                { label: 'Profit', value: `${monthlySummary.totalProfit.toFixed(2)} ETB` },
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
          </View>

          {/* All Time KPIs */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">All Time</Text>
            <FlatList
              data={[
                { label: 'Revenue', value: `${allTimeRevenue.toFixed(2)} ETB` },
                { label: 'Profit', value: `${allTimeProfit.toFixed(2)} ETB` },
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
          </View>

          {/* Total Sales KPI */}
          <View className="bg-surface rounded-lg p-4 items-center gap-2">
            <Text className="text-muted text-xs text-center">Total Sales</Text>
            <Text className="text-primary font-bold text-lg">{allTimeSalesCount}</Text>
          </View>

          {/* Daily Sales Section */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">Daily Sales</Text>
            {sales.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-muted">No sales records yet.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {(() => {
                  // Group sales by date
                  const groupedByDate = sales.reduce((groups, sale) => {
                    let dateStr = 'Unknown Date';
                    if (sale.createdAt) {
                      const date = sale.createdAt.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
                      dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                    }
                    if (!groups[dateStr]) {
                      groups[dateStr] = [];
                    }
                    groups[dateStr].push(sale);
                    return groups;
                  }, {} as Record<string, SaleRecord[]>);

                  // Calculate totals per date
                  const dateTotals = Object.entries(groupedByDate).map(([date, dateSales]) => {
                    const totalAmount = dateSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                    const totalProfit = dateSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
                    return { date, totalAmount, totalProfit, count: dateSales.length };
                  });

                  // Sort dates in descending order
                  dateTotals.sort((a, b) => b.date.localeCompare(a.date));

                  return dateTotals.map(({ date, totalAmount, totalProfit, count }) => (
                    <View key={date} className="bg-surface rounded-lg p-4 gap-2">
                      <Text className="text-foreground font-semibold">{date}</Text>
                      <Text className="text-muted text-sm">{count} sale{count !== 1 ? 's' : ''}</Text>
                      <View className="flex-row justify-between">
                        <Text className="text-primary font-bold">{totalAmount.toFixed(2)} ETB</Text>
                        <Text className="text-green-600 font-bold">+{totalProfit.toFixed(2)} ETB</Text>
                      </View>
                    </View>
                  ));
                })()}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
