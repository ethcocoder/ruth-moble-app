import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/lib/auth-context';
import { useColors } from '@/hooks/use-colors';
import { getSalesByStaff, getProducts, SaleRecord, Product } from '@/lib/_core/firestore';
import { format } from 'date-fns';

export default function StaffSalesHistoryScreen() {
  const { user } = useAuthContext();
  const colors = useColors();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterProduct, setFilterProduct] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (!user) return;
      const [fetchedSales, fetchedProducts] = await Promise.all([
        getSalesByStaff(user.uid),
        getProducts(),
      ]);
      setSales(fetchedSales);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const filteredSales = sales.filter((sale) => {
    let passesProduct = true;
    let passesDate = true;

    if (filterProduct) {
      passesProduct = sale.items.some(item => item.productId === filterProduct);
    }

    if (filterDate && sale.createdAt) {
      const saleDateStr = format(sale.createdAt.toDate(), 'yyyy-MM-dd');
      passesDate = saleDateStr === filterDate;
    }

    return passesProduct && passesDate;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sales History</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.tint} />
        }
      >
        <View style={styles.filtersContainer}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface },
                !filterProduct && { borderColor: colors.tint, borderWidth: 2 },
              ]}
              onPress={() => setFilterProduct(null)}
            >
              <Text style={[styles.filterChipText, { color: !filterProduct ? colors.tint : colors.text }]}>
                All Products
              </Text>
            </TouchableOpacity>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surface },
                  filterProduct === product.id && { borderColor: colors.tint, borderWidth: 2 },
                ]}
                onPress={() => setFilterProduct(product.id)}
              >
                <Text style={[styles.filterChipText, { color: filterProduct === product.id ? colors.tint : colors.text }]}>
                  {product.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredSales.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.muted }]}>
              No sales found.
            </Text>
          </View>
        ) : (
          <View style={styles.salesList}>
            {filteredSales.map((sale) => (
              <View key={sale.id} style={[styles.saleCard, { backgroundColor: colors.surface }]}>
                <View style={styles.saleHeader}>
                  <Text style={[styles.saleDate, { color: colors.text }]}>
                    {sale.createdAt ? format(sale.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'No date'}
                  </Text>
                  <Text style={[styles.saleTotal, { color: colors.tint }]}>
                    ${sale.totalAmount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.saleItems}>
                  {sale.items.map((item, index) => (
                    <Text key={index} style={[styles.saleItem, { color: colors.textLight }]}>
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  filtersContainer: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
  },
  salesList: {
    gap: 12,
  },
  saleCard: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  saleItems: {
    gap: 4,
  },
  saleItem: {
    fontSize: 13,
  },
});