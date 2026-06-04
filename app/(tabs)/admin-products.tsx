import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  approveProduct,
  createProduct,
  getPendingProducts,
  rejectProduct,
  getTotalProductsCount,
  getTotalStockCount,
  getTotalSalesCount,
  getTotalProfit,
  getTotalRevenue,
  Product,
} from '@/lib/_core/firestore';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';

const metricConfig = [
  { title: 'Total Products', color: 'text-cyan-300' },
  { title: 'Stock on Hand', color: 'text-emerald-300' },
  { title: 'Total Sold', color: 'text-violet-300' },
  { title: 'Revenue', color: 'text-amber-300' },
];

export default function AdminProductsScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number | null>(null);
  const [totalStock, setTotalStock] = useState<number | null>(null);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [totalProfit, setTotalProfit] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    stock: '',
    basePrice: '',
    cost: '',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [productsCount, stockCount, salesCount, profitCount, revenueCount, pending] = await Promise.all([
        getTotalProductsCount(),
        getTotalStockCount(),
        getTotalSalesCount(),
        getTotalProfit(),
        getTotalRevenue(),
        getPendingProducts(),
      ]);

      setTotalProducts(productsCount);
      setTotalStock(stockCount);
      setTotalSales(salesCount);
      setTotalProfit(profitCount);
      setRevenue(revenueCount);
      setPendingProducts(pending);
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

  const handleAction = async (productId: string, action: 'approve' | 'reject') => {
    setSaving(productId);
    try {
      if (action === 'approve') {
        await approveProduct(productId);
      } else {
        await rejectProduct(productId);
      }
      await load();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(null);
    }
  };

  const handleAddProduct = async () => {
    setFormError(null);
    const name = newProduct.name.trim();
    const category = newProduct.category.trim();
    const stock = Number(newProduct.stock);
    const basePrice = Number(newProduct.basePrice);
    const cost = Number(newProduct.cost);

    if (!name || !category || Number.isNaN(stock) || Number.isNaN(basePrice) || stock < 0 || basePrice < 0 || cost < 0) {
      setFormError('Please complete the product details with valid values.');
      return;
    }

    setSaving('new-product');
    try {
      await createProduct({
        name,
        category,
        stock,
        basePrice,
        cost: Number.isFinite(cost) ? cost : 0,
        description: newProduct.description.trim(),
        marketingPrice: basePrice,
        featured: false,
        createdBy: profile.uid,
        createdByName: profile.displayName ?? profile.email ?? 'Admin',
      });

      setNewProduct({ name: '', category: '', stock: '', basePrice: '', cost: '', description: '' });
      setShowAddProductModal(false);
      await load();
    } catch (err) {
      console.warn(err);
      setFormError('Unable to create product. Try again.');
    } finally {
      setSaving(null);
    }
  };

  if (!profile) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Loading admin console...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 space-y-6">
          <View className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a7ea4] p-6 shadow-xl">
            <Text className="text-sm uppercase tracking-[0.3em] text-cyan-200">Product Control</Text>
            <Text className="mt-4 text-3xl font-bold text-white">Catalog & approval HQ</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-200">Review pending products, add new inventory, and keep your profit dashboard current.</Text>
            <View className="mt-6 flex-row flex-wrap gap-3">
              <TouchableOpacity className="rounded-full bg-white/10 px-4 py-3">
                <Text className="text-sm text-white">Export</Text>
              </TouchableOpacity>
              <TouchableOpacity className="rounded-full bg-white/10 px-4 py-3">
                <Text className="text-sm text-white">Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddProductModal(true)} className="rounded-full bg-sky-500 px-4 py-3">
                <Text className="text-sm font-semibold text-slate-950">Add product</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4">
            {metricConfig.map((metric, index) => {
              const values = [totalProducts, totalStock, totalSales, revenue];
              const value = values[index] === null ? '--' : index === 3 ? `$${values[index]?.toFixed(2)}` : `${values[index]}`;
              return (
                <View key={metric.title} className="rounded-[28px] bg-surface border border-border p-5 shadow-sm">
                  <Text className="text-sm uppercase tracking-[0.18em] text-muted">{metric.title}</Text>
                  <Text className={`mt-4 text-3xl font-semibold ${metric.color}`}>{value}</Text>
                </View>
              );
            })}
          </View>

          <View className="rounded-[28px] border border-border bg-surface p-5 space-y-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">Pending Product Approvals</Text>
              <Text className="text-sm text-muted">{pendingProducts.length} items</Text>
            </View>
            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator color="#0a7ea4" />
              </View>
            ) : pendingProducts.length === 0 ? (
              <Text className="text-muted">No products are waiting for approval.</Text>
            ) : (
              <View className="space-y-3">
                {pendingProducts.map((item) => (
                  <View key={item.id} className="rounded-[26px] border border-border bg-background/80 p-4">
                    <View className="flex-row justify-between items-start gap-3">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-lg">{item.name}</Text>
                        <Text className="text-sm text-muted mt-1">{item.category}</Text>
                        <View className="mt-3 flex-row flex-wrap gap-2">
                          <View className="rounded-full bg-slate-950/80 px-3 py-1">
                            <Text className="text-[11px] uppercase tracking-[0.2em] text-slate-200">Stock: {item.stock}</Text>
                          </View>
                          <View className="rounded-full bg-amber-500/15 px-3 py-1">
                            <Text className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Pending</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-col gap-2">
                        <TouchableOpacity
                          onPress={() => handleAction(item.id, 'approve')}
                          disabled={saving === item.id}
                          className="rounded-full bg-emerald-500 px-4 py-2"
                        >
                          <Text className="text-xs font-semibold text-slate-950">Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleAction(item.id, 'reject')}
                          disabled={saving === item.id}
                          className="rounded-full border border-red-400 px-4 py-2"
                        >
                          <Text className="text-xs font-semibold text-red-400">Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="grid grid-cols-2 gap-4">
            <View className="rounded-[28px] border border-border bg-surface p-5">
              <Text className="text-sm uppercase tracking-[0.18em] text-muted">Total Stock</Text>
              <Text className="mt-4 text-3xl font-semibold text-foreground">{totalStock ?? '--'}</Text>
            </View>
            <View className="rounded-[28px] border border-border bg-surface p-5">
              <Text className="text-sm uppercase tracking-[0.18em] text-muted">Total Profit</Text>
              <Text className="mt-4 text-3xl font-semibold text-foreground">{totalProfit === null ? '--' : `$${totalProfit.toFixed(2)}`}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal transparent animationType="slide" visible={showAddProductModal}>
        <View className="flex-1 justify-end bg-black/40 px-6 py-8">
          <View className="rounded-[32px] bg-surface p-5 shadow-2xl">
            <Text className="text-xl font-semibold text-foreground mb-3">Add New Product</Text>
            <ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
              <View>
                <Text className="text-sm text-muted mb-1">Product Name</Text>
                <TextInput
                  value={newProduct.name}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, name: value }))}
                  placeholder="Enter product name"
                  placeholderTextColor="#8f99a6"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </View>
              <View>
                <Text className="text-sm text-muted mb-1">Category</Text>
                <TextInput
                  value={newProduct.category}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, category: value }))}
                  placeholder="e.g. Kitchen, Tools"
                  placeholderTextColor="#8f99a6"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </View>
              <View className="grid grid-cols-2 gap-3">
                <View>
                  <Text className="text-sm text-muted mb-1">Selling Price</Text>
                  <TextInput
                    value={newProduct.basePrice}
                    onChangeText={(value) => setNewProduct((prev) => ({ ...prev, basePrice: value }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#8f99a6"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </View>
                <View>
                  <Text className="text-sm text-muted mb-1">Cost Price</Text>
                  <TextInput
                    value={newProduct.cost}
                    onChangeText={(value) => setNewProduct((prev) => ({ ...prev, cost: value }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#8f99a6"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </View>
              </View>
              <View className="grid grid-cols-2 gap-3">
                <View>
                  <Text className="text-sm text-muted mb-1">Stock Quantity</Text>
                  <TextInput
                    value={newProduct.stock}
                    onChangeText={(value) => setNewProduct((prev) => ({ ...prev, stock: value }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#8f99a6"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </View>
                <View>
                  <Text className="text-sm text-muted mb-1">Description</Text>
                  <TextInput
                    value={newProduct.description}
                    onChangeText={(value) => setNewProduct((prev) => ({ ...prev, description: value }))}
                    placeholder="Enter product description"
                    placeholderTextColor="#8f99a6"
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                  />
                </View>
              </View>
              {formError ? <Text className="text-sm text-rose-500">{formError}</Text> : null}
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowAddProductModal(false)}
                  className="flex-1 rounded-3xl border border-border px-4 py-3 items-center"
                >
                  <Text className="text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddProduct}
                  disabled={saving === 'new-product'}
                  className="flex-1 rounded-3xl bg-primary px-4 py-3 items-center"
                >
                  <Text className="text-background font-semibold">Save Product</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
