import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { OrderView } from "@/components/store/OrderView";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { readLastOrder } from "@/lib/last-order";
import type { PublicOrderView } from "@/types/db";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({
    meta: [
      { title: "تأیید سفارش | فروشگاه آریا" },
      { name: "description", content: "جزئیات سفارش ثبت‌شده شما در فروشگاه آریا." },
      { property: "og:title", content: "تأیید سفارش | فروشگاه آریا" },
      { property: "og:description", content: "جزئیات سفارش ثبت‌شده شما در فروشگاه آریا." },
    ],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const [order, setOrder] = useState<PublicOrderView | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOrder(readLastOrder());
    setReady(true);
  }, []);

  if (!ready) return <StoreLayout>{null}</StoreLayout>;

  if (!order) {
    return (
      <StoreLayout>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">سفارشی برای نمایش وجود ندارد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            برای مشاهده وضعیت سفارش، از صفحه پیگیری سفارش استفاده کنید.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/track">پیگیری سفارش</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/products">مشاهده محصولات</Link>
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="surface-card mb-6 flex items-center gap-4 border-success/30 bg-success/10 p-5">
          <CheckCircle2 className="size-8 text-success" />
          <div>
            <h1 className="text-lg font-bold">سفارش شما با موفقیت ثبت شد</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              شماره سفارش خود را برای پیگیری نگه دارید. همکاران ما به‌زودی با شما تماس می‌گیرند.
            </p>
          </div>
        </div>

        <OrderView order={order} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/track">پیگیری سفارش</Link>
          </Button>
          <Button asChild>
            <Link to="/products">ادامه خرید</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
