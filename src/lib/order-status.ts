export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "ثبت سفارش",
  confirmed: "تأیید سفارش",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export const ALL_ORDER_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

/** Customers may cancel only before the order has been shipped. */
export function isCustomerCancellable(status: OrderStatus): boolean {
  return status === "pending" || status === "confirmed" || status === "processing";
}

export function statusTone(status: OrderStatus): "muted" | "primary" | "success" | "destructive" {
  if (status === "cancelled") return "destructive";
  if (status === "delivered") return "success";
  if (status === "pending") return "muted";
  return "primary";
}

/** Shipping cost is fixed in this demo store and mirrors the value used by the database. */
export const SHIPPING_COST = 49000;
