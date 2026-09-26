import { Check, X } from "lucide-react";

import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { formatDateTime, formatToman, toPersianDigits } from "@/lib/format";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { PublicOrderView } from "@/types/db";

function Timeline({ order }: { order: PublicOrderView }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-4 text-destructive">
        <X className="size-5" />
        <div>
          <p className="text-sm font-semibold">این سفارش لغو شده است</p>
          <p className="text-xs">در صورت نیاز می‌توانید سفارش جدیدی ثبت کنید.</p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <ol className="space-y-0">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER_STATUS_FLOW.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border text-xs",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : toPersianDigits(index + 1)}
              </span>
              {!isLast && (
                <span className={cn("h-8 w-px", index < currentIndex ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <span
              className={cn(
                "pt-1 text-sm",
                done ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {ORDER_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderView({ order }: { order: PublicOrderView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <div className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">شماره سفارش</p>
              <p className="text-lg font-bold" dir="ltr">
                {order.order_number}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            تاریخ ثبت: {formatDateTime(order.created_at)}
          </p>
        </div>

        <div className="surface-card p-5">
          <h3 className="mb-4 text-sm font-bold">اقلام سفارش</h3>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.product_name} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {toPersianDigits(item.quantity)} × {formatToman(item.unit_price)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatToman(item.total_price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>جمع کالاها</dt>
              <dd>{formatToman(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>هزینه ارسال</dt>
              <dd>{formatToman(order.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{formatToman(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="space-y-6">
        <div className="surface-card p-5">
          <h3 className="mb-4 text-sm font-bold">وضعیت سفارش</h3>
          <Timeline order={order} />
        </div>
        <div className="surface-card p-5 text-sm">
          <h3 className="mb-3 text-sm font-bold">اطلاعات خریدار</h3>
          <p>{order.customer.full_name}</p>
          <p className="mt-1 text-muted-foreground" dir="ltr">
            {toPersianDigits(order.customer.phone)}
          </p>
          {order.customer.email && (
            <p className="mt-1 text-muted-foreground" dir="ltr">
              {order.customer.email}
            </p>
          )}
          <h3 className="mb-2 mt-4 text-sm font-bold">آدرس تحویل</h3>
          <p className="leading-6 text-muted-foreground">{order.shipping_address}</p>
          {order.notes && (
            <>
              <h3 className="mb-2 mt-4 text-sm font-bold">توضیحات</h3>
              <p className="leading-6 text-muted-foreground">{order.notes}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
