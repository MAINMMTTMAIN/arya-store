import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatToman, toPersianDigits } from "@/lib/format";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-status";
import { adminGetOrder, adminListOrders, updateOrderStatus } from "@/services/admin";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [selected, setSelected] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin", "orders", search, status],
    queryFn: () => adminListOrders(search, status || undefined),
  });

  const detail = useQuery({
    queryKey: ["admin", "order", selected],
    queryFn: () => adminGetOrder(selected!),
    enabled: Boolean(selected),
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => updateOrderStatus(id, next),
    onSuccess: () => {
      toast.success("وضعیت سفارش به‌روزرسانی شد");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("تغییر وضعیت انجام نشد."),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">سفارش‌ها</h1>

      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(term);
          }}
        >
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="شماره سفارش، نام یا موبایل مشتری"
            className="w-72"
          />
          <Button type="submit" variant="secondary">
            جستجو
          </Button>
        </form>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="فیلتر وضعیت"
        >
          <option value="">همه وضعیت‌ها</option>
          {ALL_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {orders.isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">شماره سفارش</th>
                <th className="p-3 font-medium">مشتری</th>
                <th className="p-3 font-medium">تاریخ</th>
                <th className="p-3 font-medium">مبلغ</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.data?.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-semibold" dir="ltr">
                    {o.order_number}
                  </td>
                  <td className="p-3">
                    <p>{o.customers?.full_name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {toPersianDigits(o.customers?.phone ?? "")}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(o.created_at)}</td>
                  <td className="p-3">{formatToman(o.total)}</td>
                  <td className="p-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          changeStatus.mutate({ id: o.id, next: e.target.value as OrderStatus })
                        }
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        aria-label="تغییر وضعیت"
                      >
                        {ALL_ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(o.order_number)}>
                        جزئیات
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.data?.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">سفارشی یافت نشد.</p>
          )}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>جزئیات سفارش</DialogTitle>
          </DialogHeader>
          {detail.isLoading || !detail.data ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold" dir="ltr">
                  {detail.data.order_number}
                </span>
                <OrderStatusBadge status={detail.data.status} />
              </div>
              <p className="text-muted-foreground">{formatDateTime(detail.data.created_at)}</p>
              <div className="rounded-lg border border-border p-3">
                <p className="font-semibold">{detail.data.customers?.full_name}</p>
                <p className="text-muted-foreground" dir="ltr">
                  {toPersianDigits(detail.data.customers?.phone ?? "")}
                </p>
                {detail.data.customers?.email && (
                  <p className="text-muted-foreground" dir="ltr">
                    {detail.data.customers.email}
                  </p>
                )}
                <p className="mt-2 leading-6 text-muted-foreground">
                  {detail.data.shipping_address}
                </p>
                {detail.data.notes && (
                  <p className="mt-2 text-muted-foreground">توضیحات: {detail.data.notes}</p>
                )}
              </div>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {detail.data.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 p-3">
                    <span>
                      {item.product_name} × {toPersianDigits(item.quantity)}
                    </span>
                    <span className="font-semibold">{formatToman(item.total_price)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <dt>جمع کالاها</dt>
                  <dd>{formatToman(detail.data.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>هزینه ارسال</dt>
                  <dd>{formatToman(detail.data.shipping_cost)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt>مبلغ کل</dt>
                  <dd>{formatToman(detail.data.total)}</dd>
                </div>
              </dl>
              {detail.data.status !== "cancelled" && detail.data.status !== "delivered" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() =>
                    changeStatus.mutate({ id: detail.data!.id, next: "cancelled" })
                  }
                >
                  لغو سفارش و بازگرداندن موجودی
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
