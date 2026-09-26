import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatToman, toPersianDigits } from "@/lib/format";
import { getCustomerOrders } from "@/services/orders";
import type { CustomerOrderSummary } from "@/types/db";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "سفارش‌های من | فروشگاه آریا" },
      {
        name: "description",
        content: "تاریخچه سفارش‌های خود را با وارد کردن شماره موبایل در فروشگاه آریا ببینید.",
      },
      { property: "og:title", content: "سفارش‌های من | فروشگاه آریا" },
      { property: "og:description", content: "تاریخچه سفارش‌های مشتری در فروشگاه آریا." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<CustomerOrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setOrders(await getCustomerOrders(phone.trim()));
    } catch (err) {
      setOrders(null);
      setError(err instanceof Error ? err.message : "دریافت سفارش‌ها انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold">سفارش‌های من</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          شماره موبایلی که با آن خرید کرده‌اید را وارد کنید تا تاریخچه سفارش‌ها نمایش داده شود.
        </p>

        <form onSubmit={handleSubmit} className="surface-card mt-6 flex flex-wrap items-end gap-4 p-5">
          <div className="min-w-56 flex-1">
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
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "در حال دریافت…" : "مشاهده سفارش‌ها"}
          </Button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>
        )}

        {orders && orders.length === 0 && (
          <div className="surface-card mt-6 p-10 text-center">
            <p className="font-semibold">سفارشی یافت نشد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              با این شماره موبایل سفارشی ثبت نشده است.
            </p>
            <Button asChild className="mt-6">
              <Link to="/products">شروع خرید</Link>
            </Button>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className="surface-card mt-6 divide-y divide-border">
            {orders.map((o) => (
              <li key={o.order_number} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold" dir="ltr">
                    {o.order_number}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(o.created_at)} — {toPersianDigits(o.items_count)} کالا
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold">{formatToman(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StoreLayout>
  );
}
