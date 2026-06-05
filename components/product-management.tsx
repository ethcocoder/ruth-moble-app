import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  approveProduct,
  rejectProduct,
  createProduct,
  getActiveProducts,
  getPendingProducts,
  getProductsByCreator,
  getTotalProductsCount,
  getTotalStockCount,
  getTotalSalesCount,
  getTotalProfit,
  getTotalRevenue,
  Product,
  UserProfile,
} from '@/lib/_core/firestore';

const CATEGORIES = ['Knives', 'Cookware', 'Tools', 'Boards', 'Bowls'];

interface ProductManagementProps {
  profile: UserProfile;
  isAdmin: boolean;
}

export function ProductManagement({ profile, isAdmin }: ProductManagementProps) {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [createdProducts, setCreatedProducts] = useState<Product[]>([]);
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
    category: CATEGORIES[0],
    stock: '1',
    basePrice: '0',
    cost: '0',
    description: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [active, mine, pending, productsCount, stockCount, salesCount, profitCount, revenueCount] = await Promise.all([
        getActiveProducts(),
        getProductsByCreator(profile.uid),
        isAdmin ? getPendingProducts() : Promise.resolve([] as Product[]),
        isAdmin ? getTotalProductsCount() : Promise.resolve(0),
        isAdmin ? getTotalStockCount() : Promise.resolve(0),
        isAdmin ? getTotalSalesCount() : Promise.resolve(0),
        isAdmin ? getTotalProfit() : Promise.resolve(0),
        isAdmin ? getTotalRevenue() : Promise.resolve(0),
      ]);

      setActiveProducts(active);
      setCreatedProducts(mine);
      setPendingProducts(isAdmin ? pending : mine.filter((item) => item.status === 'pending'));
      setTotalProducts(isAdmin ? productsCount : null);
      setTotalStock(isAdmin ? stockCount : null);
      setTotalSales(isAdmin ? salesCount : null);
      setTotalProfit(isAdmin ? profitCount : null);
      setRevenue(isAdmin ? revenueCount : null);
    } catch (err) {
      console.warn('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [profile.uid, isAdmin]);

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
      await createProduct(
        {
          name,
          category,
          stock,
          basePrice,
          cost: Number.isFinite(cost) ? cost : 0,
          description: newProduct.description.trim(),
          marketingPrice: basePrice,
          featured: false,
          createdBy: profile.uid,
          createdByName: profile.displayName ?? profile.email ?? 'User',
        },
        isAdmin,
      );

      setNewProduct({ name: '', category: CATEGORIES[0], stock: '1', basePrice: '0', cost: '0', description: '' });
      setShowAddProductModal(false);
      await load();
    } catch (err) {
      console.warn(err);
      setFormError('Unable to create product. Try again.');
    } finally {
      setSaving(null);
    }
  };

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

  const pendingTitle = isAdmin ? 'Pending Product Approvals' : 'Your Pending Products';
  const pendingSubtitle = isAdmin ? `${pendingProducts.length} items waiting for review` : `${pendingProducts.length} submissions`; 

  const metrics = useMemo(() => {
    if (isAdmin) {
      return [
        { label: 'Total Products', value: totalProducts === null ? '--' : `${totalProducts}` },
        { label: 'Stock on Hand', value: totalStock === null ? '--' : `${totalStock}` },
        { label: 'Total Sold', value: totalSales === null ? '--' : `${totalSales}` },
        { label: 'Revenue', value: revenue === null ? '--' : totalProfit === null ? '--' : `$${revenue.toFixed(2)}` },
      ];
    }

    const lowStockCount = activeProducts.filter((item) => item.stock <= 5).length;
    return [
      { label: 'Active Products', value: `${activeProducts.length}` },
      { label: 'Pending Review', value: `${pendingProducts.length}` },
      { label: 'Low Stock', value: `${lowStockCount}` },
      { label: 'Your Catalog', value: `${createdProducts.filter((item) => item.status === 'approved').length}` },
    ];
  }, [isAdmin, activeProducts, createdProducts, pendingProducts, revenue, totalProducts, totalStock, totalSales, totalProfit]);

  const productCatalog = useMemo(() => activeProducts, [activeProducts]);
  const pendingList = useMemo(() => pendingProducts, [pendingProducts]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 space-y-6">
          <View className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0a7ea4] p-6 shadow-xl">
            <Text className="text-sm uppercase tracking-[0.3em] text-cyan-200">Product Control</Text>
            <Text className="mt-4 text-3xl font-bold text-white">Catalog & approval HQ</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-200">
              {isAdmin
                ? 'Review, approve, and manage staff submissions while keeping the live catalog updated.'
                : 'Submit products for approval, track your drafts, and see what is live in the catalog.'}
            </Text>
            <View className="mt-6 flex-row flex-wrap gap-3">
              {isAdmin ? (
                <>
                  <TouchableOpacity className="rounded-full bg-white/10 px-4 py-3">
                    <Text className="text-sm text-white">Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="rounded-full bg-white/10 px-4 py-3">
                    <Text className="text-sm text-white">Reports</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity onPress={() => setShowAddProductModal(true)} className="rounded-full bg-sky-500 px-4 py-3">
                <Text className="text-sm font-semibold text-slate-950">Add product</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <View key={metric.label} className="rounded-[28px] bg-surface border border-border p-5 shadow-sm">
                <Text className="text-sm uppercase tracking-[0.18em] text-muted">{metric.label}</Text>
                <Text className="mt-4 text-3xl font-semibold text-foreground">{metric.value}</Text>
              </View>
            ))}
          </View>

          <View className="rounded-[28px] border border-border bg-surface p-5 space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-semibold text-foreground">{pendingTitle}</Text>
                <Text className="text-sm text-muted">{pendingSubtitle}</Text>
              </View>
              {isAdmin ? <Text className="text-sm text-foreground">Admin approval queue</Text> : null}
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator color="#0a7ea4" />
              </View>
            ) : pendingList.length === 0 ? (
              <Text className="text-muted">No pending products found.</Text>
            ) : (
              <View className="space-y-3">
                {pendingList.map((item) => (
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
                            <Text className="text-[11px] uppercase tracking-[0.2em] text-amber-300">{item.status}</Text>
                          </View>
                        </View>
                      </View>
                      {isAdmin ? (
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
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="rounded-[28px] border border-border bg-surface p-5 space-y-3">
            <Text className="text-lg font-semibold text-foreground">Active Product Catalog</Text>
            {loading ? (
              <ActivityIndicator color="#0a7ea4" />
            ) : productCatalog.length === 0 ? (
              <Text className="text-muted">No active products available yet.</Text>
            ) : (
              <FlatList
                data={productCatalog}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="rounded-[26px] border border-border bg-background/80 p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-foreground font-semibold">{item.name}</Text>
                        <Text className="text-sm text-muted mt-1">{item.category}</Text>
                      </View>
                      <Text className="text-foreground font-bold">${item.basePrice.toFixed(2)}</Text>
                    </View>
                    <View className="mt-3 flex-row gap-3">
                      <View className="rounded-2xl bg-slate-950/80 px-3 py-2">
                        <Text className="text-xs text-slate-200">Stock {item.stock}</Text>
                      </View>
                      <View className="rounded-2xl bg-slate-950/80 px-3 py-2">
                        <Text className="text-xs text-slate-200">By {item.createdByName}</Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}
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
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowAddProductModal(false)}
                  className="flex-1 rounded-3xl border border-border bg-background py-3 items-center"
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddProduct}
                  disabled={saving === 'new-product'}
                  className="flex-1 rounded-3xl bg-primary py-3 items-center"
                >
                  {saving === 'new-product' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-background font-semibold">Create Product</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
