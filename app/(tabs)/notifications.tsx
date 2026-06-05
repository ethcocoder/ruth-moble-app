import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useNotificationContext } from '@/lib/notification-context';
import { format } from 'date-fns';
import { useAuthContext } from '@/lib/auth-context';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotificationContext();
  const { user, profile } = useAuthContext();
  const { t } = useTranslation();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'user_signup':
        return '👤';
      case 'product_created':
        return '📦';
      case 'product_approved':
        return '✅';
      case 'product_rejected':
        return '❌';
      case 'daily_sales_recorded':
        return '💰';
      case 'user_approved':
        return '🎉';
      case 'user_rejected':
        return '🚫';
      default:
        return '🔔';
    }
  };

  const handleNotificationPress = async (id: string) => {
    await markAsRead(id);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8 gap-2 bg-primary/10">
          <Text className="text-3xl font-bold text-foreground">{t('tab.notifications')}</Text>
          <Text className="text-muted">You have {unreadCount} unread notifications</Text>
        </View>

        <View className="px-6 py-4">
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="bg-surface border border-border rounded-lg py-3 items-center mb-4"
            >
              <Text className="text-foreground font-semibold">Mark all as read</Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#0a7ea4" />
            </View>
          ) : notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 gap-2">
              <Text className="text-4xl">🔔</Text>
              <Text className="text-muted text-lg text-center">No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleNotificationPress(item.id)}
                  className={`flex-row items-start gap-4 p-4 mb-3 rounded-lg border ${
                    !item.read ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border'
                  }`}
                >
                  <View className="text-3xl">{getIconForType(item.type)}</View>
                  <View className="flex-1 gap-1">
                    <Text className={`font-bold ${!item.read ? 'text-foreground' : 'text-muted'}`}>
                      {item.title}
                    </Text>
                    <Text className={!item.read ? 'text-foreground' : 'text-muted'}>
                      {item.message}
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {item.createdAt
                        ? format(item.createdAt.toDate(), 'MMM d, yyyy h:mm a')
                        : 'Just now'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
