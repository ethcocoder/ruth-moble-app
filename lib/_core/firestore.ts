import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type UserRole = "staff" | "admin";
export type UserStatus = "pending" | "approved" | "rejected";
export type LanguagePreference = "en" | "am";
export type ThemePreference = "light" | "dark";

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
}

export async function rejectUser(uid: string): Promise<void> {
  await updateUserProfile(uid, {
    status: 'rejected',
  });
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<void> {
  const ref = doc(db, "users", profile.uid);
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function hasAdminUser(): Promise<boolean> {
  const q = query(collection(db, "users"), where("role", "==", "admin"), limit(1));

  try {
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.warn('hasAdminUser failed:', error);
    return true; // fallback to staff if permissions prevent the query
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

export async function getPendingProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) }));
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

export async function getTotalProductsCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.size;
}

export async function getTotalStockCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { stock?: number };
    return sum + (typeof data.stock === 'number' ? data.stock : 0);
  }, 0);
}

export async function getTotalSalesCount(): Promise<number> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.size;
}

export async function getTotalProfit(): Promise<number> {
  const snapshot = await getDocs(collection(db, "sales"));
  return snapshot.docs.reduce((sum, docSnap) => {
    const data = docSnap.data() as { totalProfit?: number };
    return sum + (typeof data.totalProfit === 'number' ? data.totalProfit : 0);
  }, 0);
}

export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt" | "status" | "active">): Promise<string> {
  const ref = await addDoc(collection(db, "products"), {
    ...product,
    cost: product.cost ?? 0,
    description: product.description ?? '',
    status: "pending",
    active: false,
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
  await updateDoc(ref, {
    status: "approved",
    active: true,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectProduct(productId: string): Promise<void> {
  const ref = doc(db, "products", productId);
  await updateDoc(ref, {
    status: "rejected",
    active: false,
    updatedAt: serverTimestamp(),
  });
}

export async function createSale(sale: Omit<SaleRecord, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "sales"), {
    ...sale,
    createdAt: serverTimestamp(),
  });
  return ref.id;
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
