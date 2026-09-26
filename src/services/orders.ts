import { supabase } from "@/integrations/supabase/client";
import type { CustomerOrderSummary, PublicOrderView } from "@/types/db";

/**
 * Customer-facing order operations.
 * Every operation is a database function (SECURITY DEFINER) so the business rules —
 * stock checks, customer de-duplication, order numbering, cancellation rules — live in
 * PostgreSQL and stay available to any other client (e.g. the future AI agent).
 */

export interface CheckoutInput {
  fullName: string;
  phone: string;
  email?: string | undefined;
  shippingAddress: string;
  notes?: string | undefined;
  items: Array<{ product_id: string; quantity: number }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PHONE: "شماره موبایل معتبر نیست.",
  INVALID_NAME: "نام و نام خانوادگی را وارد کنید.",
  INVALID_ADDRESS: "آدرس تحویل را وارد کنید.",
  EMPTY_CART: "سبد خرید شما خالی است.",
  INVALID_QUANTITY: "تعداد انتخاب‌شده معتبر نیست.",
  PRODUCT_NOT_FOUND: "یکی از محصولات سبد خرید دیگر موجود نیست.",
  ORDER_NOT_FOUND: "سفارشی با این شماره و شماره موبایل پیدا نشد.",
  ALREADY_CANCELLED: "این سفارش قبلاً لغو شده است.",
  CANNOT_CANCEL: "سفارش‌های ارسال‌شده یا تحویل‌شده قابل لغو نیستند.",
  NOT_AUTHENTICATED: "ابتدا وارد حساب کاربری شوید.",
};

export function translateDbError(message: string): string {
  if (message.includes("OUT_OF_STOCK")) {
    const name = message.split("OUT_OF_STOCK:")[1]?.trim();
    return name
      ? `موجودی «${name}» کافی نیست.`
      : "موجودی یکی از محصولات کافی نیست.";
  }
  for (const [key, translated] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) return translated;
  }
  return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
}

export async function createOrder(input: CheckoutInput): Promise<PublicOrderView> {
  const { data, error } = await supabase.rpc("create_order", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email ?? "",
    p_shipping_address: input.shippingAddress,
    p_notes: input.notes ?? "",
    p_items: input.items,
  });
  if (error) throw new Error(translateDbError(error.message));
  return data as unknown as PublicOrderView;
}

export async function getOrderByNumber(
  orderNumber: string,
  phone: string,
): Promise<PublicOrderView> {
  const { data, error } = await supabase.rpc("get_order_by_number", {
    p_order_number: orderNumber,
    p_phone: phone,
  });
  if (error) throw new Error(translateDbError(error.message));
  return data as unknown as PublicOrderView;
}

export async function cancelOrder(orderNumber: string, phone: string): Promise<PublicOrderView> {
  const { data, error } = await supabase.rpc("cancel_order", {
    p_order_number: orderNumber,
    p_phone: phone,
  });
  if (error) throw new Error(translateDbError(error.message));
  return data as unknown as PublicOrderView;
}

export async function getCustomerOrders(phone: string): Promise<CustomerOrderSummary[]> {
  const { data, error } = await supabase.rpc("get_customer_orders", { p_phone: phone });
  if (error) throw new Error(translateDbError(error.message));
  return (data as unknown as CustomerOrderSummary[]) ?? [];
}
