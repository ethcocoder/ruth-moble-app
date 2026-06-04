import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import {
  createSale,
  getActiveProducts,
  getSalesByStaff,
  Product,
  SaleItem,
} from '@/lib/_core/firestore';

export default function StaffSalesScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, { quantity: string; salePrice: string; promotionCode: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentSales, setRecentSales] = useState([] as { id: string; totalAmount: number; createdAt: any }[]);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      setProducts(await getActiveProducts());
      const sales = await getSalesByStaff(profile.uid);
      setRecentSales(sales.slice(0, 5));
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

    if (userRole !== 'staff' || userStatus !== 'approved') {
      router.replace(userRole === 'admin' ? '/admin-dashboard' : '/auth/login');
      return;
    }

    load();
  }, [authLoading, profile?.uid, router, userRole, userStatus]);

  const selectedItems = useMemo(() => {
    return products
      .filter((product) => cart[product.id]?.quantity && Number(cart[product.id].quantity) > 0)
      .map((product) => {
        const item = cart[product.id];
        const quantity = Number(item.quantity || 0);
        const salePrice = Number(item.salePrice || product.basePrice);
        const profit = quantity * (salePrice - product.basePrice);
        return {
          product,
          quantity,
          salePrice,
          promotionCode: item.promotionCode,
          profit,
        };
      })
      .filter((item) => item.quantity > 0);
  }, [cart, products]);

  const totalAmount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity * item.salePrice, 0),
    [selectedItems],
  );
  const totalProfit = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.profit, 0),
    [selectedItems],
  );

  const handleSubmit = async () => {
    if (!profile) return;
    if (selectedItems.length === 0) return;

    setSaving(true);
    try {
      const saleItems: SaleItem[] = selectedItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        basePrice: item.product.basePrice,
        salePrice: item.salePrice,
        profit: item.profit,
        promotionCode: item.promotionCode || undefined,
      }));

      await createSale({
        staffId: profile.uid,
        staffName: profile.displayName || profile.email,
        totalAmount,
        totalProfit,
        items: saleItems,
      });
      setCart({});
      load();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="px-6 py-6 gap-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-foreground">Daily Sales Log</Text>
          <TouchableOpacity onPress={() => router.push('/staff-products')} className="bg-primary px-4 py-2 rounded-lg">
            <Text className="text-background font-semibold">Products</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Record Sale</Text>
          {loading ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : products.length === 0 ? (
            <Text className="text-muted">No active products available yet.</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const values = cart[item.id] || { quantity: '0', salePrice: item.basePrice.toString(), promotionCode: '' };
                return (
                  <View className="bg-surface rounded-xl p-4 mb-3">
                    <Text className="text-foreground font-semibold">{item.name}</Text>
                    <Text className="text-muted text-sm">Base price: ${item.basePrice.toFixed(2)}</Text>
                    <View className="flex-row gap-2 mt-3">
                      <TextInput
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                        value={values.quantity}
                        onChangeText={(value) => setCart((prev) => ({ ...prev, [item.id]: { ...values, quantity: value } }))}
                        keyboardType="numeric"
                        placeholder="Qty"
                        placeholderTextColor="#687076"
                      />
                      <TextInput
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                        value={values.salePrice}
                        onChangeText={(value) => setCart((prev) => ({ ...prev, [item.id]: { ...values, salePrice: value } }))}
                        keyboardType="numeric"
                        placeholder="Sale price"
                        placeholderTextColor="#687076"
                      />
                    </View>
                    <TextInput
                      className="mt-3 bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                      value={values.promotionCode}
                      onChangeText={(value) => setCart((prev) => ({ ...prev, [item.id]: { ...values, promotionCode: value } }))}
                      placeholder="Promo code (optional)"
                      placeholderTextColor="#687076"
                    />
                  </View>
                );
              }}
            />
          )}
        </View>

        <View className="bg-surface rounded-xl p-4 gap-3">
          <Text className="text-lg font-semibold text-foreground">Summary</Text>
          <Text className="text-foreground">Total amount: ${totalAmount.toFixed(2)}</Text>
          <Text className="text-foreground">Estimated profit: ${totalProfit.toFixed(2)}</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving || selectedItems.length === 0}
            className="bg-primary rounded-lg py-3 items-center"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-semibold">Save Sale</Text>}
          </TouchableOpacity>
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Recent Sales</Text>
          {recentSales.length === 0 ? (
            <Text className="text-muted">No sales recorded yet.</Text>
          ) : (
            recentSales.map((sale) => (
              <View key={sale.id} className="bg-surface rounded-xl p-4 mb-3">
                <Text className="text-foreground font-semibold">${sale.totalAmount.toFixed(2)}</Text>
                <Text className="text-muted text-sm">{sale.createdAt?.toDate?.()?.toLocaleString() ?? 'New sale'}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
