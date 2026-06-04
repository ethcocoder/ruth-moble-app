import { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useAuthContext } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import {
  createProduct,
  getActiveProducts,
  getProductsByCreator,
  Product,
} from '@/lib/_core/firestore';

const CATEGORIES = ['Knives', 'Cookware', 'Tools', 'Boards', 'Bowls'];

export default function StaffProductsScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [stock, setStock] = useState('1');
  const [price, setPrice] = useState('0');
  const [cost, setCost] = useState('0');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [active, mine] = await Promise.all([
        getActiveProducts(),
        getProductsByCreator(profile.uid),
      ]);
      setProducts(active);
      setMyProducts(mine);
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

    refresh();
  }, [authLoading, profile?.uid, router, userRole, userStatus]);

  const handleCreate = async () => {
    if (!name.trim() || !price || Number(price) <= 0 || Number(stock) < 0 || Number(cost) < 0) {
      setError('Please enter valid product name, price, cost, and stock.');
      return;
    }

    if (!profile) return;

    setSaving(true);
    setError('');

    try {
      await createProduct({
        name: name.trim(),
        category,
        stock: Number(stock),
        basePrice: Number(price),
        cost: Number(cost),
        description: description.trim(),
        createdBy: profile.uid,
        createdByName: profile.displayName || profile.email,
        featured: false,
      });
      setName('');
      setStock('1');
      setPrice('0');
      setCost('0');
      setDescription('');
      await refresh();
    } catch (err) {
      console.warn(err);
      setError('Unable to create product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pendingProducts = useMemo(
    () => myProducts.filter((item) => item.status === 'pending'),
    [myProducts],
  );

  const activeProducts = useMemo(
    () => products.filter((item) => item.active),
    [products],
  );

  return (
    <ScreenContainer className="bg-background">
      <View className="px-6 py-6 space-y-6">
        <View className="rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 shadow-xl">
          <Text className="text-sm uppercase tracking-[0.3em] text-cyan-300">Staff Workspace</Text>
          <Text className="mt-4 text-3xl font-bold text-white">Submit products for approval</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-300">Create product drafts, track pending items, and see live inventory at a glance.</Text>
        </View>

        <View className="grid gap-4">
          <View className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
            <Text className="text-lg font-semibold text-foreground">New product submission</Text>
            <Text className="text-sm text-muted mt-1">Products are reviewed by admin before they appear in the catalog.</Text>
            <View className="mt-5 space-y-4">
              <View>
                <Text className="text-sm text-muted mb-1">Product name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter product name"
                  placeholderTextColor="#687076"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </View>
              <View>
                <Text className="text-sm text-muted mb-1">Description</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter product description"
                  placeholderTextColor="#687076"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </View>
              <View className="grid grid-cols-2 gap-3">
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="Selling price"
                  placeholderTextColor="#687076"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <TextInput
                  value={cost}
                  onChangeText={setCost}
                  keyboardType="numeric"
                  placeholder="Cost price"
                  placeholderTextColor="#687076"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </View>
              <View className="grid grid-cols-2 gap-3">
                <TextInput
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="numeric"
                  placeholder="Stock quantity"
                  placeholderTextColor="#687076"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-foreground"
                />
                <View className="rounded-2xl border border-border bg-background px-4 py-3 justify-center">
                  <Text className="text-sm text-muted">Profit margin</Text>
                  <Text className="text-foreground font-semibold mt-1">
                    {Number(price) > 0 ? `${Math.max(0, Math.round(((Number(price) - Number(cost || '0')) / Number(price)) * 100))}%` : '0%'}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`rounded-full border px-3 py-2 ${category === cat ? 'bg-primary border-primary' : 'bg-border border-border'}`}
                  >
                    <Text className={category === cat ? 'text-background' : 'text-foreground'}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {error ? <Text className="text-sm text-rose-500">{error}</Text> : null}
              <TouchableOpacity
                onPress={handleCreate}
                disabled={saving}
                className="rounded-3xl bg-primary py-3 items-center"
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-background font-semibold">Submit for Approval</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4">
            <View className="rounded-[28px] border border-border bg-surface p-5">
              <Text className="text-sm uppercase tracking-[0.18em] text-muted">Approved Inventory</Text>
              <Text className="mt-4 text-3xl font-semibold text-foreground">{activeProducts.length}</Text>
            </View>
            <View className="rounded-[28px] border border-border bg-surface p-5">
              <Text className="text-sm uppercase tracking-[0.18em] text-muted">Pending Review</Text>
              <Text className="mt-4 text-3xl font-semibold text-foreground">{pendingProducts.length}</Text>
            </View>
          </View>

          <View className="rounded-[28px] border border-border bg-surface p-5 space-y-4">
            <Text className="text-lg font-semibold text-foreground">Your Pending Products</Text>
            {loading ? (
              <ActivityIndicator color="#0a7ea4" />
            ) : pendingProducts.length === 0 ? (
              <Text className="text-muted">No pending submissions.</Text>
            ) : (
              <View className="space-y-3">
                {pendingProducts.map((item) => (
                  <View key={item.id} className="rounded-[26px] border border-border bg-background/80 p-4">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-foreground font-semibold">{item.name}</Text>
                        <Text className="text-sm text-muted mt-1">{item.category}</Text>
                      </View>
                      <View className="rounded-full bg-amber-500/15 px-3 py-1">
                        <Text className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Pending</Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row gap-3">
                      <View className="rounded-2xl bg-slate-950/80 px-3 py-2">
                        <Text className="text-xs text-slate-200">Stock {item.stock}</Text>
                      </View>
                      <View className="rounded-2xl bg-slate-950/80 px-3 py-2">
                        <Text className="text-xs text-slate-200">Cost ${item.cost ?? 0}</Text>
                      </View>
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
            ) : activeProducts.length === 0 ? (
              <Text className="text-muted">No active products available yet.</Text>
            ) : (
              <FlatList
                data={activeProducts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="rounded-[26px] border border-border bg-background/80 p-4 mb-3">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-foreground font-semibold">{item.name}</Text>
                        <Text className="text-sm text-muted mt-1">{item.category}</Text>
                      </View>
                      <Text className="text-foreground font-semibold">${item.basePrice.toFixed(2)}</Text>
                    </View>
                    <Text className="mt-3 text-sm text-muted">Stock: {item.stock}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
