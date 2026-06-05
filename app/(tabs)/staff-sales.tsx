import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  createSale,
  getActiveProducts,
  getSalesByStaffAndDate,
  Product,
  SaleItem,
  SaleRecord,
} from '@/lib/_core/firestore';

export default function StaffSalesScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('0');
  const [unitCost, setUnitCost] = useState('0');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const today = useMemo(() => new Date(), []);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const [fetchedProducts, fetchedSales] = await Promise.all([
        getActiveProducts(),
        getSalesByStaffAndDate(profile.uid, startOfDay, endOfDay),
      ]);
      setProducts(fetchedProducts);
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

    if (userRole !== 'staff' || userStatus !== 'approved') {
      router.replace(userRole === 'admin' ? '/admin-dashboard' : '/auth/login');
      return;
    }

    load();
  }, [authLoading, profile?.uid, router, userRole, userStatus, selectedDate]);

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
      products: products.length,
      totalRevenue,
      totalCost,
      dailyProfit,
    };
  }, [sales, products.length]);

  const handleRecordSale = async () => {
    if (!profile || !selectedProduct) return;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const cost = Number(unitCost);

    if (!qty || qty <= 0 || !price || price <= 0) return;

    const profit = qty * (price - (cost || selectedProduct.basePrice));

    setSaving(true);
    try {
      const saleItems: SaleItem[] = [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: qty,
          basePrice: selectedProduct.basePrice,
          salePrice: price,
          profit,
        },
      ];

      // Create sale with selected date!
      const saleDate = new Date(selectedDate);
      saleDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
      
      await createSale(
        {
          staffId: profile.uid,
          staffName: profile.displayName || profile.email,
          totalAmount: qty * price,
          totalProfit: profit,
          items: saleItems,
        },
        saleDate
      );

      // Reset form
      setSelectedProduct(null);
      setShowProductDropdown(false);
      setQuantity('1');
      setUnitPrice('0');
      setUnitCost('0');
      setShowRecordModal(false);
      await load();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setUnitPrice(product.basePrice.toString());
    setUnitCost((product.cost || product.basePrice).toString());
    setShowProductDropdown(false);
  };

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
          <Text className="text-muted">Track daily sales and report to admin</Text>
        </View>

        {/* Buttons: Excel, PDF, Record Sale */}
        <View className="px-6 py-4 gap-3">
          <View className="flex-row gap-3">
            <TouchableOpacity className="flex-1 bg-surface border border-border rounded-lg py-3 flex-row items-center justify-center gap-2">
              <Text className="text-foreground font-bold">Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-surface border border-border rounded-lg py-3 flex-row items-center justify-center gap-2">
              <Text className="text-foreground font-bold">PDF</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowRecordModal(true)}
            className="bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-background font-bold text-lg">+ Record Sale</Text>
          </TouchableOpacity>
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
                { label: 'Products', value: `${metrics.products}` },
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
            <Text className="text-muted">All sales recorded for this date</Text>
          </View>
          <View className="bg-surface rounded-lg overflow-hidden">
            <View className="flex-row bg-surface border-b border-border p-3">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Product</Text>
              </View>
              <View className="w-16">
                <Text className="text-foreground font-semibold text-center">Qty</Text>
              </View>
              <View className="w-20">
                <Text className="text-foreground font-semibold text-center">Total</Text>
              </View>
              <View className="w-20">
                <Text className="text-foreground font-semibold text-center">Actions</Text>
              </View>
            </View>
            {sales.length === 0 ? (
              <View className="p-8 items-center justify-center">
                <Text className="text-muted">No sales recorded for this date</Text>
              </View>
            ) : (
              <FlatList
                data={sales}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="flex-row items-center p-3 border-t border-border">
                    <View className="flex-1">
                      {item.items.length > 0 ? (
                        <Text className="text-foreground">{item.items[0].name}</Text>
                      ) : (
                        <Text className="text-foreground">Product</Text>
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
                    <View className="w-20 items-center">
                      <TouchableOpacity className="bg-primary/10 px-3 py-1 rounded-lg">
                        <Text className="text-primary text-xs font-semibold">Edit</Text>
                      </TouchableOpacity>
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

      {/* Record Sale Modal */}
      <Modal
        visible={showRecordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-surface rounded-lg w-full max-w-md p-6 gap-4">
            <Text className="text-foreground text-2xl font-bold">Record New Sale</Text>

            {/* Product Selector */}
            <View className="gap-2">
              <Text className="text-muted font-semibold">Product *</Text>
              <TouchableOpacity
                className="bg-background border border-border rounded-lg p-4 flex-row items-center justify-between"
                onPress={() => setShowProductDropdown(!showProductDropdown)}
              >
                <Text className={selectedProduct ? "text-foreground" : "text-muted"}>
                  {selectedProduct
                    ? `${selectedProduct.name} (Stock: ${selectedProduct.stock})`
                    : "Select a product"}
                </Text>
                <Text className="text-foreground text-lg">{showProductDropdown ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {/* Dropdown */}
              {showProductDropdown && (
                <View className="bg-background border border-border rounded-lg overflow-hidden max-h-48 z-50">
                  <ScrollView>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        onPress={() => handleSelectProduct(product)}
                        className="p-4 border-b border-border active:bg-surface"
                      >
                        <Text className="text-foreground">{product.name} (Stock: {product.stock})</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Quantity */}
            <View className="gap-2">
              <Text className="text-muted font-semibold">Quantity *</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            {/* Unit Price */}
            <View className="gap-2">
              <Text className="text-muted font-semibold">Unit Price (ETB) *</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
              />
            </View>

            {/* Unit Cost */}
            <View className="gap-2">
              <Text className="text-muted font-semibold">Unit Cost (ETB)</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={unitCost}
                onChangeText={setUnitCost}
                keyboardType="numeric"
              />
            </View>

            {/* Buttons */}
            <View className="gap-3 mt-4">
              <TouchableOpacity
                className="bg-primary py-4 rounded-lg flex-row items-center justify-center"
                onPress={handleRecordSale}
                disabled={saving || !selectedProduct}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background font-bold text-lg">Record & Report Sale</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface border border-border py-4 rounded-lg flex-row items-center justify-center"
                onPress={() => {
                  setShowRecordModal(false);
                  setSelectedProduct(null);
                  setShowProductDropdown(false);
                }}
              >
                <Text className="text-foreground font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
