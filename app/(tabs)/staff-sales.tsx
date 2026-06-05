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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTranslation } from 'react-i18next';
import {
  createSale,
  listenToActiveProducts,
  getSalesByStaffAndDate,
  updateSale,
  deleteSale,
  createNotification,
  Product,
  SaleItem,
  SaleRecord,
} from '@/lib/_core/firestore';
import { useNetworkValidation } from '@/lib/use-network-validation';

export default function StaffSalesScreen() {
  const { profile, userRole, userStatus, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const { t } = useTranslation();
  const { validateNetwork } = useNetworkValidation();
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
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const loadSales = async () => {
    if (!profile) return;
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const fetchedSales = await getSalesByStaffAndDate(profile.uid, startOfDay, endOfDay);
      setSales(fetchedSales);
    } catch (err) {
      console.warn(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSales();
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

    // Listen to products in real-time
    const unsubscribeProducts = listenToActiveProducts((fetchedProducts) => {
      setProducts(fetchedProducts);
      setLoading(false);
    });

    // Load sales
    loadSales();

    // Cleanup listener
    return () => {
      unsubscribeProducts();
    };
  }, [authLoading, profile?.uid, router, userRole, userStatus]);

  // Reload sales when selected date changes
  useEffect(() => {
    if (profile) {
      loadSales();
    }
  }, [selectedDate, profile?.uid]);

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

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setUnitPrice(product.basePrice.toString());
    setUnitCost((product.cost || product.basePrice).toString());
    setShowProductDropdown(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(Platform.OS === 'ios');
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleEditSale = (sale: SaleRecord) => {
    setEditingSale(sale);
    const item = sale.items[0];
    const product = products.find(p => p.id === item.productId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(item.quantity.toString());
      setUnitPrice(item.salePrice.toString());
      // Use stored cost from sale item, fallback to product.cost or product.basePrice
      setUnitCost((item.cost ?? product.cost ?? product.basePrice).toString());
      setShowRecordModal(true);
    }
  };

  const handleDeleteSale = (saleId: string) => {
    setDeletingSaleId(saleId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSale = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Delete Sale');
    if (!isOnline) return;

    if (!deletingSaleId) return;
    setSaving(true);
    try {
      await deleteSale(deletingSaleId);
      await loadSales();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeletingSaleId(null);
    }
  };

  // Export to Excel/CSV
  const exportToExcel = () => {
    const headers = [
      'Date',
      'Product',
      'Quantity',
      'Unit Price (ETB)',
      'Total (ETB)',
      'Cost (ETB)',
      'Profit (ETB)',
    ];

    const rows = sales.map(sale => {
      const item = sale.items[0];
      const date = sale.createdAt ? new Date(sale.createdAt.toDate()).toLocaleDateString() : '';
      return [
        date,
        item.name,
        item.quantity,
        item.salePrice,
        item.quantity * item.salePrice,
        item.quantity * item.basePrice,
        sale.totalProfit,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daily-sales-${format(selectedDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Sales Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            color: #0a7ea4;
            text-align: center;
            margin-bottom: 10px;
          }
          h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
          }
          .report-meta {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: #0a7ea4;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            border: 1px solid #ddd;
            padding: 10px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #0a7ea4;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .summary-card p {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #0a7ea4;
          }
        </style>
      </head>
      <body>
        <h1>Daily Sales Report</h1>
        <div class="report-meta">
          <h2>${format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Items Sold</h3>
            <p>${metrics.itemsSold}</p>
          </div>
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <p>${metrics.totalRevenue.toFixed(0)} ETB</p>
          </div>
          <div class="summary-card">
            <h3>Total Cost</h3>
            <p>${metrics.totalCost.toFixed(0)} ETB</p>
          </div>
          <div class="summary-card">
            <h3>Daily Profit</h3>
            <p>${metrics.dailyProfit.toFixed(0)} ETB</p>
          </div>
        </div>

        <h2>Sales Records</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(sale => {
              const item = sale.items[0];
              return `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.salePrice} ETB</td>
                  <td>${item.quantity * item.salePrice} ETB</td>
                  <td>${sale.totalProfit} ETB</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([pdfHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.print();
      };
    }
    setShowExportModal(false);
  };

  const handleSaveSale = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork(editingSale ? 'Save Sale' : 'Record Sale');
    if (!isOnline) return;

    if (!profile || !selectedProduct) return;

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const cost = Number(unitCost);

    if (!qty || qty <= 0 || !price || price <= 0) return;

    // Check if enough stock is available
    if (qty > selectedProduct.stock && !editingSale) {
      alert(`Not enough stock! Available: ${selectedProduct.stock}`);
      return;
    }

    const profit = qty * (price - (cost || selectedProduct.basePrice));
    const totalAmount = qty * price;

    setSaving(true);
    try {
      const saleItems: SaleItem[] = [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: qty,
          basePrice: selectedProduct.basePrice,
          cost: cost,
          salePrice: price,
          profit,
        },
      ];

      if (editingSale) {
        // If editing, we need to handle stock adjustment
        await updateSale(editingSale.id, {
          staffId: profile.uid,
          staffName: profile.displayName || profile.email,
          totalAmount,
          totalProfit: profit,
          items: saleItems,
        });
      } else {
        const saleDate = new Date(selectedDate);
        saleDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
        
        await createSale(
          {
            staffId: profile.uid,
            staffName: profile.displayName || profile.email,
            totalAmount,
            totalProfit: profit,
            items: saleItems,
          },
          saleDate
        );

        // Send notification to admin
        await createNotification({
          type: 'daily_sales_recorded',
          title: 'New Daily Sale Recorded',
          message: `${profile.displayName || profile.email} recorded a new sale of ${qty}x ${selectedProduct.name} for ${totalAmount.toFixed(0)} ETB.`,
        });
      }

      setSelectedProduct(null);
      setShowProductDropdown(false);
      setQuantity('1');
      setUnitPrice('0');
      setUnitCost('0');
      setShowRecordModal(false);
      setEditingSale(null);
      await loadSales();
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-6 py-6 gap-2 bg-primary/10">
          <Text className="text-2xl font-bold text-foreground">Daily Sales Log</Text>
          <Text className="text-muted">Track daily sales and report to admin</Text>
        </View>

        <View className="px-6 py-4 gap-3">
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => setShowExportModal(true)}
              className="flex-1 bg-surface border border-border rounded-lg py-3 flex-row items-center justify-center gap-2"
            >
              <Text className="text-foreground font-bold">Excel/PDF</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              setEditingSale(null);
              setSelectedProduct(null);
              setQuantity('1');
              setUnitPrice('0');
              setUnitCost('0');
              setShowRecordModal(true);
            }}
            className="bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <IconSymbol name="add" size={20} color="white" />
            <Text className="text-background font-bold text-lg">Record Sale</Text>
          </TouchableOpacity>
        </View>

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

        <View className="px-6 py-3">
          <View className="bg-surface rounded-lg p-5 gap-2">
            <Text className="text-muted text-sm">Daily Profit</Text>
            <Text className="text-foreground text-4xl font-bold">{metrics.dailyProfit.toFixed(0)} ETB</Text>
          </View>
        </View>

        <View className="px-6 py-6 gap-3">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">Sales Records</Text>
            <Text className="text-muted">All sales recorded for this date</Text>
          </View>
          <View className="bg-surface rounded-lg overflow-hidden">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 400 }}>
                <View className="flex-row bg-surface border-b border-border p-3">
                  <View className="flex-1 min-w-0">
                    <Text className="text-foreground font-semibold">Product</Text>
                  </View>
                  <View className="w-16 flex-shrink-0 items-center">
                    <Text className="text-foreground font-semibold text-center">Qty</Text>
                  </View>
                  <View className="w-24 flex-shrink-0 items-center">
                    <Text className="text-foreground font-semibold text-center">Total</Text>
                  </View>
                  <View className="w-32 flex-shrink-0 items-center">
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
                        <View className="flex-1 min-w-0">
                          {item.items.length > 0 ? (
                            <Text className="text-foreground" numberOfLines={1} ellipsizeMode="tail">{item.items[0].name}</Text>
                          ) : (
                            <Text className="text-foreground">Product</Text>
                          )}
                        </View>
                        <View className="w-16 flex-shrink-0 items-center">
                          <Text className="text-muted">
                            {item.items.reduce((sum, i) => sum + i.quantity, 0)}
                          </Text>
                        </View>
                        <View className="w-24 flex-shrink-0 items-center">
                          <Text className="text-foreground font-semibold">{item.totalAmount.toFixed(0)} ETB</Text>
                        </View>
                        <View className="w-32 flex-shrink-0 flex-row gap-1 justify-center">
                          <TouchableOpacity 
                            className="bg-emerald-500/10 px-3 py-1 rounded-lg"
                            onPress={() => handleEditSale(item)}
                          >
                            <Text className="text-emerald-500 text-xs font-semibold">Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="bg-red-500/10 px-3 py-1 rounded-lg"
                            onPress={() => handleDeleteSale(item.id)}
                          >
                            <Text className="text-red-500 text-xs font-semibold">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {Platform.OS === 'web' ? (
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 p-6">
            <View className="bg-surface rounded-lg w-full max-w-md p-6 gap-4">
              <Text className="text-foreground text-2xl font-bold">Select Date</Text>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                className="w-full bg-background border border-border rounded-lg p-3 text-foreground"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-lg py-3 items-center"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-foreground font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-lg py-3 items-center"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-background font-semibold">OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )
      )}

      <Modal
        visible={showRecordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecordModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-surface rounded-lg w-full max-w-md p-6 gap-4">
            <Text className="text-foreground text-2xl font-bold">
              {editingSale ? "Edit Sale" : "Record New Sale"}
            </Text>

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
              {showProductDropdown && (
                <View className="bg-background border border-border rounded-lg overflow-hidden max-h-48 z-50">
                  <ScrollView>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        onPress={() => product.stock > 0 ? handleSelectProduct(product) : null}
                        disabled={product.stock <= 0}
                        className={`p-4 border-b border-border active:bg-surface ${product.stock <= 0 ? "opacity-50" : ""}`}
                      >
                        <View className="flex-row justify-between items-center">
                          <Text className={product.stock <= 0 ? "text-muted" : "text-foreground"}>
                            {product.name}
                          </Text>
                          <Text className={product.stock <= 0 ? "text-red-500" : "text-foreground"}>
                            (Stock: {product.stock})
                            {product.stock <= 0 ? " - Out of stock" : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View className="gap-2">
              <Text className="text-muted font-semibold">Quantity *</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            <View className="gap-2">
              <Text className="text-muted font-semibold">Unit Price (ETB) *</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
              />
            </View>

            <View className="gap-2">
              <Text className="text-muted font-semibold">Unit Cost (ETB)</Text>
              <TextInput
                className="bg-background border border-border rounded-lg p-4 text-foreground"
                value={unitCost}
                onChangeText={setUnitCost}
                keyboardType="numeric"
              />
            </View>

            <View className="gap-3 mt-4">
              <TouchableOpacity
                className="bg-primary py-4 rounded-lg flex-row items-center justify-center"
                onPress={handleSaveSale}
                disabled={saving || !selectedProduct}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background font-bold text-lg">
                    {editingSale ? "Update Sale" : "Record & Report Sale"}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-surface border border-border py-4 rounded-lg flex-row items-center justify-center"
                onPress={() => {
                  setShowRecordModal(false);
                  setSelectedProduct(null);
                  setShowProductDropdown(false);
                  setEditingSale(null);
                }}
              >
                <Text className="text-foreground font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-surface rounded-lg w-full max-w-md p-6 gap-4">
            <Text className="text-foreground text-2xl font-bold">Delete Sale</Text>
            <Text className="text-muted">Are you sure you want to delete this sale?</Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 bg-surface border border-border py-3 rounded-lg items-center"
              >
                <Text className="text-foreground font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteSale}
                disabled={saving}
                className="flex-1 bg-red-500 py-3 rounded-lg items-center"
              >
                {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExportModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50 p-6">
          <View className="bg-surface rounded-t-3xl w-full p-6 gap-4">
            <Text className="text-foreground text-2xl font-bold">Export Sales</Text>
            <Text className="text-muted">Choose an export format</Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={exportToExcel} className="flex-row items-center gap-4 p-4 border border-border rounded-xl"
              >
                <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center">
                  <Text className="text-2xl">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Excel</Text>
                  <Text className="text-sm text-muted">Export as Excel spreadsheet</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={exportToPDF} className="flex-row items-center gap-4 p-4 border border-border rounded-xl"
              >
                <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center">
                  <Text className="text-2xl">📄</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">PDF</Text>
                  <Text className="text-sm text-muted">Export as PDF document</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowExportModal(false)}
              className="w-full rounded-xl bg-surface border border-border py-3 items-center">
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}