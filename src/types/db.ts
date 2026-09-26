import type { Database } from "@/integrations/supabase/types";
import type { OrderStatus } from "@/lib/order-status";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export type ProductWithCategory = Product & { categories: Pick<Category, "name" | "slug"> | null };
export type OrderWithCustomer = Order & { customers: Customer | null };
export type OrderWithDetails = OrderWithCustomer & { order_items: OrderItem[] };

/** Shape returned by the database functions get_order_by_number / create_order / cancel_order. */
export interface PublicOrderView {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: string;
  notes: string | null;
  customer: { full_name: string; phone: string; email: string | null };
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

/** Shape returned by get_customer_orders. */
export interface CustomerOrderSummary {
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  items_count: number;
}
