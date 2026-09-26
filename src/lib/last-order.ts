import type { PublicOrderView } from "@/types/db";

const KEY = "arya-last-order-v1";

/** The freshly placed order is kept in session storage so the confirmation page can render it. */
export function saveLastOrder(order: PublicOrderView) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable */
  }
}

export function readLastOrder(): PublicOrderView | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PublicOrderView) : null;
  } catch {
    return null;
  }
}
