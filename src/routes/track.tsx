import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { OrderView } from "@/components/store/OrderView";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isCustomerCancellable } from "@/lib/order-status";
import { cancelOrder, getOrderByNumber } from "@/services/orders";
import type { PublicOrderView } from "@/types/db";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "پیگیری سفارش | فروشگاه آریا" },
      {
        name: "description",
        content: "با شماره سفارش و شماره موبایل، وضعیت سفارش خود را در فروشگاه آریا پیگیری کنید.",
      },
      { property: "og:title", content: "پیگیری سفارش | فروشگاه آریا" },
      {
        property: "og:description",
        content: "وضعیت و جزئیات سفارش خود را با شماره سفارش و موبایل ببینید.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<PublicOrderView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderByNumber(orderNumber.trim(), phone.trim());
      setOrder(result);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : "سفارش پیدا نشد.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await cancelOrder(order.order_number, phone.trim());
      setOrder(updated);
      toast.success("سفارش لغو شد و موجودی کالاها بازگردانده شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "لغو سفارش انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">پیگیری سفارش</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          شماره سفارش و شماره موبایل ثبت‌شده هنگام خرید را وارد کنید.
        </p>

        <form onSubmit={handleSearch} className="surface-card mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label htmlFor="orderNumber">شماره سفارش</Label>
            <Input
              id="orderNumber"
              dir="ltr"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ARYA-10001"
              className="mt-2 text-left"
            />
          </div>
          <div>
            <Label htmlFor="phone">شماره موبایل</Label>
            <Input
              id="phone"
              dir="ltr"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09121234567"
              className="mt-2 text-left"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
              {loading ? "در حال جستجو…" : "پیگیری"}
            </Button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
        )}

        {order && (
          <div className="mt-8 space-y-4">
            <OrderView order={order} />
            {isCustomerCancellable(order.status) && (
              <Button variant="destructive" disabled={loading} onClick={handleCancel}>
                لغو این سفارش
              </Button>
            )}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
