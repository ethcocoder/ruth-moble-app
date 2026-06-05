import {
  addDoc,
  writeBatch,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type UserRole = "staff" | "admin";
export type UserStatus = "pending" | "approved" | "rejected";
export type LanguagePreference = "en" | "am";
export type ThemePreference = "light" | "dark";
export type OrderStatus = "pending" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "partial";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  language: LanguagePreference;
  theme: ThemePreference;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type ProductStatus = "pending" | "approved" | "rejected";

export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  basePrice: number;
  cost?: number;
  description?: string;
  marketingPrice?: number;
  active: boolean;
  status: ProductStatus;
  featured: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type SaleItem = {
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  cost: number;
  salePrice: number;
  profit: number;
  promotionCode?: string;
};

export type SaleRecord = {
  id: string;
  staffId: string;
  staffName: string;
  createdAt: Timestamp | null;
  totalAmount: number;
  totalProfit: number;
  items: SaleItem[];
  note?: string;
};

export type EmployeeStatus = "active" | "inactive";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  salary: number;
  status: EmployeeStatus;
  joinedDate: string;
  phone?: string;
  department?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: Timestamp | null;
  completedDate?: Timestamp | null;
  notes?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type DailySales = {
  id: string;
  saleDate: string;
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  items: SaleItem[];
  createdAt: Timestamp | null;
};

export type StaffReportAction = "create_product" | "update_product" | "delete_product" | "record_sale" | "other";

export type StaffReport = {
  id: string;
  staffId: string;
  staffName: string;
  action: StaffReportAction;
  details: Record<string, any>;
  timestamp: Timestamp | null;
  type: "automatic" | "manual";
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<UserProfile, "uid">;
  return { uid: snap.id, ...data };
}

export async function getPendingUsers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, "uid">) }));
}

export async function getTotalUsersCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.size;
}

export async function getApprovedStaffCount(): Promise<number> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "staff"),
    where("status", "==", "approved"),
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function getTotalRevenue(): Promise<number> {
  const q = query(collection(db, "sales"));
  const snapshot = await getDocs(q);
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { totalAmount?: number };
    return sum + (typeof data.totalAmount === 'number' ? data.totalAmount : 0);
  }, 0);
}

export async function updateUserProfile(uid: string, values: Partial<Omit<UserProfile, "uid" | "createdAt">>): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function approveUser(uid: string): Promise<void> {
  await updateUserProfile(uid, {
    status: 'approved',
  });

  await createNotification({
    type: 'user_approved',
    title: 'Account Approved',
    message: 'Your account has been approved! You can now access the system.',
    userId: uid,
  });
}

export async function rejectUser(uid: string): Promise<void> {
  await updateUserProfile(uid, {
    status: 'rejected',
  });

  await createNotification({
    type: 'user_rejected',
    title: 'Account Rejected',
    message: 'Your account has been rejected.',
    userId: uid,
  });
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<void> {
  const ref = doc(db, "users", profile.uid);
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (profile.role === 'admin') {
    const bootstrapRef = doc(db, "meta", "adminBootstrap");
    await setDoc(
      bootstrapRef,
      {
        adminExists: true,
        createdBy: profile.uid,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export async function hasAdminUser(): Promise<boolean> {
  const bootstrapRef = doc(db, "meta", "adminBootstrap");

  try {
    const snap = await getDoc(bootstrapRef);
    if (snap.exists() && (snap.data() as { adminExists?: boolean }).adminExists === true) {
      return true;
    }
  } catch (error) {
    console.warn('hasAdminUser bootstrap read failed:', error);
  }

  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"), limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.warn('hasAdminUser fallback query failed:', error);
    return false;
  }
}

export async function getActiveProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("active", "==", true),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
}

export function listenToActiveProducts(onUpdate: (products: Product[]) => void): () => void {
  const q = query(
    collection(db, "products"),
    where("active", "==", true),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, 
    (snapshot) => {
      const products = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
      onUpdate(products);
    },
    (error) => {
      console.error("listenToActiveProducts error:", error);
    }
  );
}

export async function getProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
}

export async function getPendingProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
}

export function listenToPendingProducts(onUpdate: (products: Product[]) => void): () => void {
  const q = query(
    collection(db, "products"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, 
    (snapshot) => {
      const products = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
      onUpdate(products);
    },
    (error) => {
      console.error("listenToPendingProducts error:", error);
    }
  );
}

export async function getProductsByCreator(uid: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
}

export function listenToProductsByCreator(uid: string, onUpdate: (products: Product[]) => void): () => void {
  const q = query(
    collection(db, "products"),
    where("createdBy", "==", uid),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, 
    (snapshot) => {
      const products = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
      onUpdate(products);
    },
    (error) => {
      console.error("listenToProductsByCreator error:", error);
    }
  );
}

export async function getTotalProductsCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.size;
}

export function listenToTotalProductsCount(onUpdate: (count: number) => void): () => void {
  return onSnapshot(collection(db, "products"), 
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      console.error("listenToTotalProductsCount error:", error);
    }
  );
}

export async function getTotalStockCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { stock?: number };
    return sum + (typeof data.stock === 'number' ? data.stock : 0);
  }, 0);
}

export function listenToTotalStockCount(onUpdate: (count: number) => void): () => void {
  return onSnapshot(collection(db, "products"), 
    (snapshot) => {
      const total = snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data() as { stock?: number };
        return sum + (typeof data.stock === 'number' ? data.stock : 0);
      }, 0);
      onUpdate(total);
    },
    (error) => {
      console.error("listenToTotalStockCount error:", error);
    }
  );
}

export async function getTotalItemsSold(): Promise<number> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { items?: Array<{ quantity: number }> };
    const itemsSum = (data.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
    return sum + itemsSum;
  }, 0);
}

export function listenToTotalItemsSold(onUpdate: (count: number) => void): () => void {
  return onSnapshot(collection(db, "sales"), 
    (snapshot) => {
      const total = snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data() as { items?: Array<{ quantity: number }> };
        const itemsSum = (data.items || []).reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        return sum + itemsSum;
      }, 0);
      onUpdate(total);
    },
    (error) => {
      console.error("listenToTotalItemsSold error:", error);
    }
  );
}

export async function getTotalSalesCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.size;
}

export function listenToTotalSalesCount(onUpdate: (count: number) => void): () => void {
  return onSnapshot(collection(db, "sales"), 
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      console.error("listenToTotalSalesCount error:", error);
    }
  );
}

export async function getTotalProfit(): Promise<number> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { totalProfit?: number };
    return sum + (typeof data.totalProfit === 'number' ? data.totalProfit : 0);
  }, 0);
}

export function listenToTotalProfit(onUpdate: (profit: number) => void): () => void {
  return onSnapshot(collection(db, "sales"), 
    (snapshot) => {
      const total = snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data() as { totalProfit?: number };
        return sum + (typeof data.totalProfit === 'number' ? data.totalProfit : 0);
      }, 0);
      onUpdate(total);
    },
    (error) => {
      console.error("listenToTotalProfit error:", error);
    }
  );
}

export function listenToTotalRevenue(onUpdate: (revenue: number) => void): () => void {
  return onSnapshot(collection(db, "sales"), 
    (snapshot) => {
      const total = snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data() as { totalAmount?: number };
        return sum + (typeof data.totalAmount === 'number' ? data.totalAmount : 0);
      }, 0);
      onUpdate(total);
    },
    (error) => {
      console.error("listenToTotalRevenue error:", error);
    }
  );
}

export async function createProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt" | "status" | "active">,
  approveImmediately = false,
): Promise<string> {
  const ref = await addDoc(collection(db, "products"), {
    ...product,
    cost: product.cost ?? 0,
    description: product.description ?? '',
    status: approveImmediately ? 'approved' : 'pending',
    active: approveImmediately,
    featured: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(productId: string, values: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "createdBy" | "createdByName">>): Promise<void> {
  const ref = doc(db, "products", productId);
  await updateDoc(ref, {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function approveProduct(productId: string): Promise<void> {
  const ref = doc(db, "products", productId);
  const productSnap = await getDoc(ref);
  const productData = productSnap.data() as Product | undefined;
  
  await updateDoc(ref, {
    status: "approved",
    active: true,
    updatedAt: serverTimestamp(),
  });

  if (productData?.createdBy) {
    await createNotification({
      type: 'product_approved',
      title: 'Product Approved',
      message: `Your product "${productData.name}" has been approved.`,
      userId: productData.createdBy,
    });
  }
}

export async function rejectProduct(productId: string): Promise<void> {
  const ref = doc(db, "products", productId);
  const productSnap = await getDoc(ref);
  const productData = productSnap.data() as Product | undefined;
  
  await updateDoc(ref, {
    status: "rejected",
    active: false,
    updatedAt: serverTimestamp(),
  });

  if (productData?.createdBy) {
    await createNotification({
      type: 'product_rejected',
      title: 'Product Rejected',
      message: `Your product "${productData.name}" has been rejected.`,
      userId: productData.createdBy,
    });
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const ref = doc(db, "products", productId);
  await deleteDoc(ref);
}

export async function createSale(sale: Omit<SaleRecord, "id" | "createdAt">, customDate?: Date): Promise<string> {
  const ref = await addDoc(collection(db, "sales"), {
    ...sale,
    createdAt: customDate ? Timestamp.fromDate(customDate) : serverTimestamp(),
  });

  // Update product stock for each item in the sale
  for (const item of sale.items) {
    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const product = productSnap.data() as Product;
      await updateDoc(productRef, {
        stock: product.stock - item.quantity,
        updatedAt: serverTimestamp(),
      });
    }
  }

  return ref.id;
}

export async function updateSale(saleId: string, sale: Partial<Omit<SaleRecord, "id" | "createdAt">>): Promise<void> {
  const ref = doc(db, "sales", saleId);
  await updateDoc(ref, {
    ...sale,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSale(saleId: string): Promise<void> {
  const ref = doc(db, "sales", saleId);
  
  // First get the sale to restore stock
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const sale = snap.data() as SaleRecord;
    // Restore stock for each item
    for (const item of sale.items) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        await updateDoc(productRef, {
          stock: product.stock + item.quantity,
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
  
  // Then delete the sale
  await deleteDoc(ref);
}

export async function getSalesByStaff(staffId: string): Promise<SaleRecord[]> {
  const q = query(
    collection(db, "sales"),
    where("staffId", "==", staffId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, "id">) }));
}

export async function getSalesByStaffAndDate(staffId: string, startDate: Date, endDate: Date): Promise<SaleRecord[]> {
  const q = query(
    collection(db, "sales"),
    where("staffId", "==", staffId),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, "id">) }));
}

export async function getAllSales(): Promise<SaleRecord[]> {
  const q = query(
    collection(db, "sales"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, "id">) }));
}

export async function getAllSalesByDate(startDate: Date, endDate: Date): Promise<SaleRecord[]> {
  const q = query(
    collection(db, "sales"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<SaleRecord, "id">) }));
}

export async function getSalesSummary(period: "day" | "week" | "month", staffId?: string): Promise<{ totalAmount: number; totalProfit: number; saleCount: number; }> {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }

  let q = query(
    collection(db, "sales"),
    where("createdAt", ">=", start),
    orderBy("createdAt", "desc"),
  );

  if (staffId) {
    q = query(q, where("staffId", "==", staffId));
  }

  const snapshot = await getDocs(q);
  const sales = snapshot.docs.map((docSnap) => docSnap.data() as Omit<SaleRecord, "id">);
  return sales.reduce(
    (state, sale) => ({
      totalAmount: state.totalAmount + (sale.totalAmount ?? 0),
      totalProfit: state.totalProfit + (sale.totalProfit ?? 0),
      saleCount: state.saleCount + 1,
    }),
    { totalAmount: 0, totalProfit: 0, saleCount: 0 },
  );
}

// ==================== EMPLOYEES ====================
export async function createEmployee(employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "employees"), {
    ...employee,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getEmployees(): Promise<Employee[]> {
  const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Employee, "id">) }));
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const ref = doc(db, "employees", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Employee, "id">;
  return { id: snap.id, ...data };
}

export async function updateEmployee(id: string, values: Partial<Omit<Employee, "id" | "createdAt">>): Promise<void> {
  const ref = doc(db, "employees", id);
  await updateDoc(ref, {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  const ref = doc(db, "employees", id);
  await deleteDoc(ref);
}

export async function getTotalEmployeesCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "employees"));
  return snapshot.size;
}

export async function getActiveEmployeesCount(): Promise<number> {
  const q = query(collection(db, "employees"), where("status", "==", "active"));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export function listenToEmployees(onUpdate: (employees: Employee[]) => void): () => void {
  const q = query(collection(db, "employees"), orderBy("createdAt", "desc"));
  return onSnapshot(q, 
    (snapshot) => {
      const employees = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Employee, "id">) }));
      onUpdate(employees);
    },
    (error) => {
      console.error("listenToEmployees error:", error);
    }
  );
}

export function listenToTotalEmployeesCount(onUpdate: (count: number) => void): () => void {
  return onSnapshot(collection(db, "employees"), 
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      console.error("listenToTotalEmployeesCount error:", error);
    }
  );
}

export function listenToActiveEmployeesCount(onUpdate: (count: number) => void): () => void {
  const q = query(collection(db, "employees"), where("status", "==", "active"));
  return onSnapshot(q, 
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      console.error("listenToActiveEmployeesCount error:", error);
    }
  );
}

// ==================== ORDERS ====================
export async function createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Order, "id">) }));
}

export async function getOrder(id: string): Promise<Order | null> {
  const ref = doc(db, "orders", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Order, "id">;
  return { id: snap.id, ...data };
}

export async function updateOrder(id: string, values: Partial<Omit<Order, "id" | "createdAt">>): Promise<void> {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  const ref = doc(db, "orders", id);
  await deleteDoc(ref);
}

export async function getTotalOrdersCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "orders"));
  return snapshot.size;
}

// ==================== DAILY SALES ====================
export async function createDailySales(dailySales: Omit<DailySales, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "dailySales"), {
    ...dailySales,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDailySales(date: string): Promise<DailySales | null> {
  const q = query(collection(db, "dailySales"), where("saleDate", "==", date));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const data = docSnap.data() as Omit<DailySales, "id">;
  return { id: docSnap.id, ...data };
}

export async function getAllDailySales(): Promise<DailySales[]> {
  const q = query(collection(db, "dailySales"), orderBy("saleDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<DailySales, "id">) }));
}

// ==================== STAFF REPORTS ====================
export async function createStaffReport(report: Omit<StaffReport, "id" | "timestamp">): Promise<string> {
  const ref = await addDoc(collection(db, "staffReports"), {
    ...report,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function getStaffReports(staffId?: string): Promise<StaffReport[]> {
  let q = query(collection(db, "staffReports"), orderBy("timestamp", "desc"));
  if (staffId) {
    q = query(q, where("staffId", "==", staffId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<StaffReport, "id">) }));
}

// ==================== NOTIFICATIONS ====================
export type NotificationType =
  | "user_signup"
  | "product_created"
  | "product_approved"
  | "product_rejected"
  | "daily_sales_recorded"
  | "user_approved"
  | "user_rejected";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp | null;
};

export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt" | "read">,
): Promise<string> {
  const ref = await addDoc(collection(db, "notifications"), {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getNotifications(userId?: string): Promise<Notification[]> {
  let q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  if (userId) {
    q = query(q, where("userId", "==", userId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Notification, "id">) }));
}

export function listenToNotifications(
  userId: string | null,
  onUpdate: (notifications: Notification[]) => void,
): () => void {
  let q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  if (userId) {
    q = query(q, where("userId", "==", userId));
  }
  return onSnapshot(q, 
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Notification, "id">) }));
      onUpdate(notifications);
    },
    (error) => {
      console.error("listenToNotifications error:", error);
    }
  );
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const ref = doc(db, "notifications", notificationId);
  await updateDoc(ref, {
    read: true,
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("read", "==", false),
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });
  await batch.commit();
}
