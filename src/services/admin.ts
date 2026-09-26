import { supabase } from "@/integrations/supabase/client";
import type { OrderStatus } from "@/lib/order-status";
import type {
  Category,
  Customer,
  OrderWithCustomer,
  OrderWithDetails,
  ProductWithCategory,
} from "@/types/db";

/**
 * Back-office data access. Requires an authenticated session with the `admin` role;
 * row level security rejects everything else.
 */

/* ---------- products ---------- */

export async function adminListProducts(search = ""): Promise<ProductWithCategory[]> {
  let query = supabase.from("products").select("*, categories(name, slug)");
  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export interface ProductInput {
  name: string;
  slug: string;
  sku: string;
  category_id: string | null;
  price: number;
  stock: number;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  active: boolean;
}

export async function createProduct(input: ProductInput) {
  const { error } = await supabase.from("products").insert(input);
  if (error) throw error;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- categories ---------- */

export async function adminListCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
}

export async function createCategory(input: CategoryInput) {
  const { error } = await supabase.from("categories").insert(input);
  if (error) throw error;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  const { error } = await supabase.from("categories").update(input).eq("id", id);
  if (error) throw error;
}

/* ---------- orders ---------- */

export async function adminListOrders(search = "", status?: OrderStatus): Promise<OrderWithCustomer[]> {
  let query = supabase.from("orders").select("*, customers(*)");
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  const rows = (data ?? []) as OrderWithCustomer[];
  const term = search.trim().toLowerCase();
  if (!term) return rows;
  return rows.filter(
    (o) =>
      o.order_number.toLowerCase().includes(term) ||
      (o.customers?.phone ?? "").includes(term) ||
      (o.customers?.full_name ?? "").toLowerCase().includes(term),
  );
}

export async function adminGetOrder(orderNumber: string): Promise<OrderWithDetails | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(*), order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  return (data as OrderWithDetails) ?? null;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

/* ---------- customers ---------- */

export async function adminListCustomers(search = ""): Promise<Customer[]> {
  let query = supabase.from("customers").select("*");
  if (search.trim()) {
    query = query.or(`full_name.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function adminCustomerOrders(customerId: string): Promise<OrderWithCustomer[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderWithCustomer[];
}

/* ---------- dashboard ---------- */

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: ProductWithCategory[];
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  recentOrders: OrderWithCustomer[];
  revenue: number;
}

export const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, orders, customers] = await Promise.all([
    supabase.from("products").select("*, categories(name, slug)"),
    supabase.from("orders").select("*, customers(*)").order("created_at", { ascending: false }),
    supabase.from("customers").select("id"),
  ]);
  if (products.error) throw products.error;
  if (orders.error) throw orders.error;
  if (customers.error) throw customers.error;

  const productRows = (products.data ?? []) as ProductWithCategory[];
  const orderRows = (orders.data ?? []) as OrderWithCustomer[];

  return {
    totalProducts: productRows.length,
    lowStockProducts: productRows
      .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock),
    totalOrders: orderRows.length,
    pendingOrders: orderRows.filter((o) => o.status === "pending").length,
    totalCustomers: customers.data?.length ?? 0,
    recentOrders: orderRows.slice(0, 8),
    revenue: orderRows
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0),
  };
}

/* ---------- auth helpers ---------- */

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin");
  if (error) return false;
  return (roles ?? []).length > 0;
}

/** Grants the admin role to the current user when the store has no admin yet. */
export async function claimAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("claim_admin");
  if (error) throw error;
  return Boolean(data);
}
