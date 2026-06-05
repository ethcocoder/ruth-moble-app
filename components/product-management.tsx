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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer } from './screen-container';
import { useTranslation } from 'react-i18next';
import {
  approveProduct,
  rejectProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listenToActiveProducts,
  listenToPendingProducts,
  listenToProductsByCreator,
  listenToTotalProductsCount,
  listenToTotalStockCount,
  listenToTotalItemsSold,
  listenToTotalProfit,
  listenToTotalRevenue,
  getUserProfile,
  createNotification,
  Product,
  UserProfile,
} from '@/lib/_core/firestore';
import { useNetworkValidation } from '@/lib/use-network-validation';

const CATEGORIES = ['Knives', 'Cookware', 'Tools', 'Boards', 'Bowls'];

interface ProductManagementProps {
  profile: UserProfile;
  isAdmin: boolean;
}

export function ProductManagement({ profile, isAdmin }: ProductManagementProps) {
  const { t } = useTranslation();
  const { validateNetwork } = useNetworkValidation();
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
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: CATEGORIES[0],
    stock: '1',
    basePrice: '0',
    cost: '0',
    description: '',
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribers: (() => void)[] = [];

    // Listen to active products
    unsubscribers.push(listenToActiveProducts((products) => {
      setActiveProducts(products);
    }));

    // Listen to created products
    unsubscribers.push(listenToProductsByCreator(profile.uid, (products) => {
      setCreatedProducts(products);
      if (!isAdmin) {
        setPendingProducts(products.filter((item) => item.status === 'pending'));
      }
    }));

    // Listen to pending products if admin
    if (isAdmin) {
      unsubscribers.push(listenToPendingProducts((products) => {
        setPendingProducts(products);
      }));

      // Listen to aggregate data
      unsubscribers.push(listenToTotalProductsCount((count) => {
        setTotalProducts(count);
      }));

      unsubscribers.push(listenToTotalStockCount((count) => {
        setTotalStock(count);
      }));

      unsubscribers.push(listenToTotalItemsSold((count) => {
        setTotalSales(count);
      }));

      unsubscribers.push(listenToTotalProfit((profit) => {
        setTotalProfit(profit);
      }));

      unsubscribers.push(listenToTotalRevenue((rev) => {
        setRevenue(rev);
      }));
    }

    // Set loading to false after initial setup
    setTimeout(() => setLoading(false), 500);

    // Cleanup listeners on unmount
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [profile.uid, isAdmin]);

  const handleAddProduct = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Create Product');
    if (!isOnline) return;

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

      // Send notification if not admin
      if (!isAdmin) {
        await createNotification({
          type: 'product_created',
          title: 'New Product Submitted',
          message: `${profile.displayName ?? profile.email ?? 'User'} submitted a new product "${name}" for approval.`,
        });
      }

      setNewProduct({ name: '', category: CATEGORIES[0], stock: '1', basePrice: '0', cost: '0', description: '' });
      setShowAddProductModal(false);
    } catch (err) {
      console.warn(err);
      setFormError('Unable to create product. Try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleAction = async (productId: string, action: 'approve' | 'reject') => {
    // Validate network before operation
    const isOnline = await validateNetwork(action === 'approve' ? 'Approve Product' : 'Reject Product');
    if (!isOnline) return;

    setSaving(productId);
    try {
      if (action === 'approve') {
        await approveProduct(productId);
      } else {
        await rejectProduct(productId);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setSaving(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      stock: product.stock.toString(),
      basePrice: product.basePrice.toString(),
      cost: product.cost != null ? product.cost.toString() : '0',
      description: product.description || '',
    });
    setShowEditProductModal(true);
  };

  const handleSaveEditProduct = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Save Product');
    if (!isOnline) return;

    if (!editingProduct) return;
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

    setSaving(editingProduct.id);
    try {
      await updateProduct(editingProduct.id, {
        name,
        category,
        stock,
        basePrice,
        cost: Number.isFinite(cost) ? cost : 0,
        description: newProduct.description.trim(),
      });

      setEditingProduct(null);
      setNewProduct({ name: '', category: CATEGORIES[0], stock: '1', basePrice: '0', cost: '0', description: '' });
      setShowEditProductModal(false);
    } catch (err) {
      console.warn(err);
      setFormError('Unable to update product. Try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    console.log('handleDeleteProduct called with productId:', productId);
    setDeletingProductId(productId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    // Validate network before operation
    const isOnline = await validateNetwork('Delete Product');
    if (!isOnline) return;

    if (!deletingProductId) return;
    setSaving(deletingProductId);
    try {
      await deleteProduct(deletingProductId);
    } catch (err) {
      console.warn('Error deleting product:', err);
    } finally {
      setSaving(null);
      setShowDeleteModal(false);
      setDeletingProductId(null);
    }
  };

  // Fetch user profiles for all products
  useEffect(() => {
    const allProducts = [...activeProducts, ...pendingProducts, ...createdProducts];
    const uniqueUserIds = [...new Set(allProducts.map(p => p.createdBy))].filter(Boolean);

    const fetchProfiles = async () => {
      const newProfiles: Record<string, UserProfile> = {};
      for (const uid of uniqueUserIds) {
        if (!userProfiles[uid]) {
          try {
            const user = await getUserProfile(uid);
            if (user) {
              newProfiles[uid] = user;
            }
          } catch (err) {
            console.warn(`Failed to fetch profile for ${uid}:`, err);
          }
        }
      }

      if (Object.keys(newProfiles).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...newProfiles }));
      }
    };

    fetchProfiles();
  }, [activeProducts, pendingProducts, createdProducts, userProfiles]);

  // Normalize products to ensure createdByName always exists
  const normalizeProduct = (p: Product): Product => {
    const user = userProfiles[p.createdBy];
    return {
      ...p,
      createdByName: p.createdByName || user?.displayName || user?.email || p.createdBy || 'Unknown User',
    };
  };

  // Normalized product lists (declare first, before using them anywhere)
  const productCatalog = useMemo(() => activeProducts.map(normalizeProduct), [activeProducts, userProfiles]);
  const pendingList = useMemo(() => pendingProducts.map(normalizeProduct), [pendingProducts, userProfiles]);
  const createdProductsList = useMemo(() => createdProducts.map(normalizeProduct), [createdProducts, userProfiles]);

  const pendingTitle = isAdmin 
    ? t('tab.products') 
    : t('products.title'); 
  const pendingSubtitle = isAdmin 
    ? `${pendingList.length} items waiting for review` 
    : `${pendingList.length} submissions`; 

  const metrics = useMemo(() => {
    if (isAdmin) {
      return [
        { label: t('employees.totalEmployees'), value: totalProducts === null ? '--' : `${totalProducts}` },
        { label: 'Stock on Hand', value: totalStock === null ? '--' : `${totalStock}` },
        { label: 'Total Sold', value: totalSales === null ? '--' : `${totalSales}` },
        { label: t('finance.revenue'), value: revenue === null ? '--' : totalProfit === null ? '--' : `${revenue.toFixed(0)} ETB` },
      ];
    }

    const lowStockCount = productCatalog.filter((item) => item.stock <= 5).length;
    return [
      { label: t('products.title'), value: `${productCatalog.length}` },
      { label: 'Pending Review', value: `${pendingList.length}` },
      { label: t('products.lowStock'), value: `${lowStockCount}` },
      { label: 'Your Catalog', value: `${createdProductsList.filter((item) => item.status === 'approved').length}` },
    ];
  }, [isAdmin, productCatalog, createdProductsList, pendingList, revenue, totalProducts, totalStock, totalSales, totalProfit, t]);

  // Export to Excel
  const exportToExcel = () => {
    // Combine active and pending products
    const allProducts = [...productCatalog, ...pendingList];
    
    // Create CSV content
    const headers = [
      'ID',
      'Name',
      'Category',
      'Stock',
      'Base Price',
      'Cost',
      'Status',
      'Description',
      'Created By',
      'Created Date'
    ];
    
    const rows = allProducts.map(product => [
      product.id,
      product.name,
      product.category,
      product.stock,
      product.basePrice,
      product.cost || 0,
      product.status,
      product.description || '',
      product.createdByName,
      product.createdAt ? new Date().toLocaleDateString() : ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `products_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    // Combine all products
    const allProducts = [...productCatalog, ...pendingList];
    
    // Create HTML content for PDF
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Products Report</title>
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
            margin-bottom: 30px;
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
        <h1>Product Management Report</h1>
        <div class="report-meta">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Products</h3>
            <p>${totalProducts ?? 0}</p>
          </div>
          <div class="summary-card">
            <h3>Total Stock</h3>
            <p>${totalStock ?? 0}</p>
          </div>
          <div class="summary-card">
            <h3>Total Items Sold</h3>
            <p>${totalSales ?? 0}</p>
          </div>
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <p>${(revenue?.toFixed(0) ?? 0)} ETB</p>
          </div>
        </div>
        
        <h2>Product List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Price (ETB)</th>
              <th>Cost (ETB)</th>
              <th>Status</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            ${allProducts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.stock}</td>
                <td>${p.basePrice}</td>
                <td>${p.cost || 0}</td>
                <td>${p.status}</td>
                <td>${p.createdByName}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    // Create a Blob and open in new tab for printing
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

  return (
    <ScreenContainer className="bg-background">
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
                  <TouchableOpacity onPress={() => setShowExportModal(true)} className="rounded-full bg-white/10 px-4 py-3">
                    <Text className="text-sm text-white">Export</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowReportsModal(true)} className="rounded-full bg-white/10 px-4 py-3">
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
            <View>
              <Text className="text-xl font-semibold text-foreground">{pendingTitle}</Text>
              <Text className="text-sm text-muted">{pendingSubtitle}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 450 }}>
                {/* Table Header */}
                <View className="flex-row bg-slate-700 rounded-lg p-3 mt-2 gap-2">
                  <View className="flex-1 min-w-0">
                    <Text className="text-cyan-300 font-bold">Product</Text>
                  </View>
                  <View className="w-20 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Stock</Text>
                  </View>
                  <View className="w-24 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Status</Text>
                  </View>
                  <View className="w-32 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Actions</Text>
                  </View>
                </View>

                {loading ? (
                  <View className="py-12 items-center justify-center">
                    <ActivityIndicator color="#0a7ea4" />
                  </View>
                ) : pendingList.length === 0 ? (
                  <Text className="text-muted">No pending products found.</Text>
                ) : (
                  <FlatList
                    data={pendingList}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View className="flex-row items-center bg-background/60 border-b border-border p-3 rounded-lg mb-2 gap-2">
                        <View className="flex-1 min-w-0">
                          <Text className="text-foreground font-semibold" numberOfLines={1} ellipsizeMode="tail">
                            {item.name}
                          </Text>
                        </View>
                        <View className="w-20 items-center flex-shrink-0">
                          <View className={`rounded-lg px-2 py-1 ${
                            item.stock <= 5 ? 'bg-red-500/20' : 'bg-blue-500/20'
                          }`}>
                            <Text className={`text-sm font-semibold ${
                              item.stock <= 5 ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {item.stock}
                            </Text>
                          </View>
                        </View>
                        <View className="w-24 items-center flex-shrink-0">
                          <View className="rounded-lg bg-amber-500/20 px-2 py-1">
                            <Text className="text-xs font-semibold text-amber-400 uppercase">
                              {item.status}
                            </Text>
                          </View>
                        </View>
                        <View className="w-32 flex-row gap-1 justify-center flex-shrink-0">
                          {isAdmin ? (
                            <>
                              <TouchableOpacity
                                onPress={() => handleAction(item.id, 'approve')}
                                disabled={saving === item.id}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                className="w-8 h-8 rounded-full bg-emerald-500/30 items-center justify-center"
                              >
                                <Text className="text-emerald-400 font-semibold text-lg">✅</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleAction(item.id, 'reject')}
                                disabled={saving === item.id}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                className="w-8 h-8 rounded-full bg-red-500/30 items-center justify-center"
                              >
                                <Text className="text-red-400 font-semibold text-lg">❌</Text>
                              </TouchableOpacity>
                            </>
                          ) : null}
                          <TouchableOpacity
                            onPress={() => handleEditProduct(item)}
                            disabled={saving === item.id}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="w-8 h-8 rounded-full bg-blue-500/30 items-center justify-center"
                          >
                            <Text className="text-blue-400 font-semibold text-lg">✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteProduct(item.id)}
                            disabled={saving === item.id}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="w-8 h-8 rounded-full bg-red-500/30 items-center justify-center"
                          >
                            <Text className="text-red-400 font-semibold text-lg">🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            </ScrollView>
          </View>

          <View className="rounded-[28px] border border-border bg-surface p-5 space-y-3">
            <Text className="text-2xl font-bold text-cyan-400">Product Inventory</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={{ minWidth: 400 }}>
                {/* Table Header */}
                <View className="flex-row bg-slate-700 rounded-lg p-3 mt-4 gap-2">
                  <View className="flex-1 min-w-0">
                    <Text className="text-cyan-300 font-bold">Product</Text>
                  </View>
                  <View className="w-20 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Stock</Text>
                  </View>
                  <View className="w-24 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Status</Text>
                  </View>
                  <View className="w-28 items-center flex-shrink-0">
                    <Text className="text-cyan-300 font-bold">Actions</Text>
                  </View>
                </View>

                {loading ? (
                  <ActivityIndicator color="#0a7ea4" />
                ) : productCatalog.length === 0 ? (
                  <Text className="text-muted">No active products available yet.</Text>
                ) : (
                  <FlatList
                    data={productCatalog}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <View className="flex-row items-center bg-background/60 border-b border-border p-3 rounded-lg mb-2 gap-2">
                        <View className="flex-1 min-w-0">
                          <Text className="text-foreground font-semibold" numberOfLines={1} ellipsizeMode="tail">
                            {item.name}
                          </Text>
                        </View>
                        <View className="w-20 items-center flex-shrink-0">
                          <View className={`rounded-lg px-2 py-1 ${
                            item.stock <= 5 ? 'bg-red-500/20' : 'bg-blue-500/20'
                          }`}>
                            <Text className={`text-sm font-semibold ${
                              item.stock <= 5 ? 'text-red-400' : 'text-blue-400'
                            }`}>
                              {item.stock}
                            </Text>
                          </View>
                        </View>
                        <View className="w-24 items-center flex-shrink-0">
                          <View className="rounded-lg bg-emerald-500/20 px-2 py-1">
                            <Text className="text-xs font-semibold text-emerald-400 uppercase">
                              {item.status}
                            </Text>
                          </View>
                        </View>
                        <View className="w-28 flex-row gap-1 justify-center flex-shrink-0">
                          <TouchableOpacity
                            onPress={() => handleEditProduct(item)}
                            disabled={saving === item.id}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="w-8 h-8 rounded-full bg-blue-500/30 items-center justify-center"
                          >
                            <Text className="text-blue-400 font-semibold text-lg">✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteProduct(item.id)}
                            disabled={saving === item.id}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="w-8 h-8 rounded-full bg-red-500/30 items-center justify-center"
                          >
                            <Text className="text-red-400 font-semibold text-lg">🗑️</Text>
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

      <Modal 
        visible={showEditProductModal}
        animationType="slide"
        onRequestClose={() => {
          setShowEditProductModal(false);
          setEditingProduct(null);
        }}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            <View className="p-6">
              <Text className="text-2xl font-bold text-foreground mb-6">Edit Product</Text>
            </View>
            
            <ScrollView className="flex-1 px-6 space-y-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Product Name */}
              <View>
                <Text className="text-muted font-semibold mb-2">Product Name *</Text>
                <TextInput
                  value={newProduct.name}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, name: value }))}
                  placeholder="Enter product name"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {/* Category */}
              <View>
                <Text className="text-muted font-semibold mb-2">Category *</Text>
                <TextInput
                  value={newProduct.category}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, category: value }))}
                  placeholder="Enter category"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {/* Price */}
              <View>
                <Text className="text-muted font-semibold mb-2">Price (ETB) *</Text>
                <TextInput
                  value={newProduct.basePrice}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, basePrice: value }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {/* Cost */}
              <View>
                <Text className="text-muted font-semibold mb-2">Cost (ETB)</Text>
                <TextInput
                  value={newProduct.cost}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, cost: value }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {/* Stock */}
              <View>
                <Text className="text-muted font-semibold mb-2">Stock Quantity</Text>
                <TextInput
                  value={newProduct.stock}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, stock: value }))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {/* Description */}
              <View>
                <Text className="text-muted font-semibold mb-2">Description</Text>
                <TextInput
                  value={newProduct.description}
                  onChangeText={(value) => setNewProduct((prev) => ({ ...prev, description: value }))}
                  placeholder="Enter product description"
                  placeholderTextColor="#8f99a6"
                  className="w-full rounded-lg bg-surface border border-border px-4 py-3 text-foreground"
                />
              </View>

              {formError ? <Text className="text-rose-500 text-sm">{formError}</Text> : null}
            </ScrollView>

            {/* Buttons - Fixed at bottom */}
            <View className="p-6">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowEditProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 rounded-3xl bg-background border border-border py-3 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-foreground font-bold text-lg">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSaveEditProduct}
                  disabled={saving === editingProduct?.id}
                  className="flex-1 rounded-3xl bg-primary py-3 items-center"
                  activeOpacity={0.8}
                >
                  {saving === editingProduct?.id ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-background font-bold text-lg">Update Product</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent
      >
        <View className="flex-1 justify-center items-center bg-black/70 px-6">
          <View className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-foreground mb-2">Delete Product</Text>
            <Text className="text-muted mb-6">Are you sure you want to delete this product?</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletingProductId(null);
                }}
                className="flex-1 rounded-3xl bg-background border border-border py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-foreground font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  confirmDeleteProduct();
                }}
                className="flex-1 rounded-3xl bg-rose-500 py-3 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent
      >
        <View className="flex-1 justify-end bg-black/70 px-6 pb-8 pt-4">
          <View className="w-full bg-surface rounded-2xl p-6 shadow-2xl border border-border">
            <Text className="text-xl font-bold text-foreground mb-1">Export Products</Text>
            <Text className="text-muted mb-6">Choose a format to export</Text>
            
            <View className="space-y-3 mb-6">
              {/* PDF Option */}
              <TouchableOpacity
                onPress={exportToPDF}
                className="flex-row items-center gap-4 p-4 border border-border rounded-xl bg-background"
              >
                <View className="w-12 h-12 bg-rose-500/20 rounded-xl items-center justify-center">
                  <Text className="text-2xl">📄</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">PDF</Text>
                  <Text className="text-sm text-muted">Export as professional PDF report</Text>
                </View>
              </TouchableOpacity>
              
              {/* Excel Option */}
              <TouchableOpacity
                onPress={exportToExcel}
                className="flex-row items-center gap-4 p-4 border border-border rounded-xl bg-background"
              >
                <View className="w-12 h-12 bg-emerald-500/20 rounded-xl items-center justify-center">
                  <Text className="text-2xl">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Excel (CSV)</Text>
                  <Text className="text-sm text-muted">Export as Excel compatible spreadsheet</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setShowExportModal(false)}
              className="w-full rounded-3xl bg-background border border-border py-3 items-center"
            >
              <Text className="text-foreground font-semibold text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reports Modal */}
      <Modal
        visible={showReportsModal}
        animationType="slide"
      >
        <View className="flex-1 bg-background">
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-foreground">Product Reports</Text>
              <TouchableOpacity
                onPress={() => setShowReportsModal(false)}
                className="p-2 bg-surface border border-border rounded-full"
              >
                <Text className="text-xl text-foreground">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4">
              {/* Total Products Report */}
              <View className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <Text className="text-lg font-semibold text-foreground mb-2">Total Products</Text>
                <Text className="text-3xl font-bold text-cyan-400">
                  {totalProducts ?? 0}
                </Text>
              </View>

              {/* Stock Report */}
              <View className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <Text className="text-lg font-semibold text-foreground mb-2">Total Stock</Text>
                <Text className="text-3xl font-bold text-blue-400">
                  {totalStock ?? 0}
                </Text>
              </View>

              {/* Total Items Sold */}
              <View className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <Text className="text-lg font-semibold text-foreground mb-2">Total Items Sold</Text>
                <Text className="text-3xl font-bold text-green-400">
                  {totalSales ?? 0}
                </Text>
              </View>

              {/* Revenue Report */}
              <View className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                <Text className="text-lg font-semibold text-foreground mb-2">Total Revenue</Text>
                <Text className="text-3xl font-bold text-emerald-400">
                  {revenue?.toFixed(0) ?? '0'} ETB
                </Text>
              </View>

              {/* Low Stock Alert */}
              {activeProducts.filter(p => p.stock <= 5).length > 0 && (
                <View className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                  <Text className="text-lg font-semibold text-rose-400 mb-2">⚠️ Low Stock Alert</Text>
                  <FlatList
                    data={activeProducts.filter(p => p.stock <= 5)}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View className="flex-row justify-between items-center py-2 border-b border-rose-500/10">
                        <Text className="text-foreground font-medium">{item.name}</Text>
                        <Text className="text-rose-400 font-bold">Stock: {item.stock}</Text>
                      </View>
                    )}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
