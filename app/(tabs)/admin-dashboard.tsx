import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';

const ADMIN_KPIs = [
  { label: 'Total Users', value: '342', icon: '👥' },
  { label: 'Pending Approvals', value: '5', icon: '⏳' },
  { label: 'Total Revenue', value: '$45,230', icon: '💰' },
  { label: 'Active Employees', value: '12', icon: '👔' },
];

const PENDING_APPROVALS = [
  { id: '1', name: 'John Smith', role: 'Staff', email: 'john@example.com' },
  { id: '2', name: 'Sarah Johnson', role: 'Staff', email: 'sarah@example.com' },
  { id: '3', name: 'Mike Davis', role: 'Customer', email: 'mike@example.com' },
];

export default function AdminDashboardScreen() {
  const { user } = useAuthContext();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Admin Dashboard</Text>
          <Text className="text-muted">System Overview</Text>
        </View>

        {/* KPIs */}
        <View className="px-6 py-6 gap-3">
          <FlatList
            data={ADMIN_KPIs}
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

        {/* Management Modules */}
        <View className="px-6 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Management</Text>
          <View className="gap-2">
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Users</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Products</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Orders</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Finance</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">HR</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">CMS</Text>
              <Text className="text-muted">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Approvals */}
        <View className="px-6 py-6 gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-foreground">Pending Approvals</Text>
            <TouchableOpacity>
              <Text className="text-primary font-semibold text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={PENDING_APPROVALS}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-lg p-4 mb-2">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{item.name}</Text>
                    <Text className="text-muted text-xs mt-1">{item.email}</Text>
                  </View>
                  <View className="bg-warning/20 px-2 py-1 rounded">
                    <Text className="text-warning text-xs font-semibold">{item.role}</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 bg-success rounded py-2">
                    <Text className="text-background text-center font-semibold text-xs">Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-error rounded py-2">
                    <Text className="text-background text-center font-semibold text-xs">Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
