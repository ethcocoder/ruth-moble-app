import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';

const STAFF_KPIs = [
  { label: 'Total Products', value: '245', icon: '📦' },
  { label: 'Low Stock', value: '12', icon: '⚠️' },
  { label: 'Today\'s Sales', value: '18', icon: '💰' },
  { label: 'Daily Revenue', value: '$2,450', icon: '💵' },
];

const RECENT_SALES = [
  { id: '1', product: 'Chef Knife', qty: 2, amount: 179.98, time: '10:30 AM' },
  { id: '2', product: 'Pot Set', qty: 1, amount: 149.99, time: '09:45 AM' },
  { id: '3', product: 'Spatula Set', qty: 3, amount: 74.97, time: '09:15 AM' },
];

export default function StaffDashboardScreen() {
  const { user } = useAuthContext();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Staff Dashboard</Text>
          <Text className="text-muted">Welcome, {user?.email || 'Staff Member'}</Text>
        </View>

        {/* KPIs */}
        <View className="px-6 py-6 gap-3">
          <FlatList
            data={STAFF_KPIs}
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
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Quick Actions</Text>
          <View className="gap-2">
            <TouchableOpacity className="bg-primary rounded-lg py-3 items-center">
              <Text className="text-background font-semibold">Record Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 items-center">
              <Text className="text-foreground font-semibold">View Products</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 items-center">
              <Text className="text-foreground font-semibold">Export Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Sales */}
        <View className="px-6 py-6 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">Recent Sales</Text>
            <TouchableOpacity>
              <Text className="text-primary font-semibold text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={RECENT_SALES}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-lg p-4 mb-2 flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.product}</Text>
                  <Text className="text-muted text-xs mt-1">Qty: {item.qty}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary font-bold">${item.amount}</Text>
                  <Text className="text-muted text-xs">{item.time}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
