import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { getSalesSummary } from '@/lib/_core/firestore';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AdminReportsScreen() {
  const { userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [daily, setDaily] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [weekly, setWeekly] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [monthly, setMonthly] = useState({ totalAmount: 0, totalProfit: 0, saleCount: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setDaily(await getSalesSummary('day'));
      setWeekly(await getSalesSummary('week'));
      setMonthly(await getSalesSummary('month'));
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

  return (
    <ScreenContainer className="bg-background">
      <View className="px-6 py-6 gap-4">
        <Text className="text-2xl font-bold text-foreground">Sales Reports</Text>

        {loading ? (
          <ActivityIndicator color="#0a7ea4" />
        ) : (
          <View className="gap-4">
            {[
              { title: 'Today', stats: daily },
              { title: 'This Week', stats: weekly },
              { title: 'This Month', stats: monthly },
            ].map((section) => (
              <View key={section.title} className="bg-surface rounded-xl p-4">
                <Text className="text-lg font-semibold text-foreground">{section.title}</Text>
                <Text className="text-muted text-sm">Sales: {section.stats.saleCount}</Text>
                <Text className="text-foreground font-semibold">Revenue: {section.stats.totalAmount.toFixed(2)} ETB</Text>
                <Text className="text-foreground font-semibold">Profit: {section.stats.totalProfit.toFixed(2)} ETB</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={load} className="bg-primary rounded-lg py-3 items-center">
          <Text className="text-background font-semibold">Refresh Report</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
