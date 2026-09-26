import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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
import { formatDate, formatToman, toPersianDigits } from "@/lib/format";
import { adminCustomerOrders, adminListCustomers } from "@/services/admin";
import type { Customer } from "@/types/db";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const customers = useQuery({
    queryKey: ["admin", "customers", search],
    queryFn: () => adminListCustomers(search),
  });

  const orders = useQuery({
    queryKey: ["admin", "customer-orders", selected?.id],
    queryFn: () => adminCustomerOrders(selected!.id),
    enabled: Boolean(selected),
  });

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">مشتریان</h1>

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
          placeholder="جستجو بر اساس نام یا شماره موبایل"
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          جستجو
        </Button>
      </form>

      {customers.isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">نام</th>
                <th className="p-3 font-medium">موبایل</th>
                <th className="p-3 font-medium">ایمیل</th>
                <th className="p-3 font-medium">تاریخ عضویت</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.data?.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-medium">{c.full_name}</td>
                  <td className="p-3" dir="ltr">
                    {toPersianDigits(c.phone)}
                  </td>
                  <td className="p-3 text-muted-foreground" dir="ltr">
                    {c.email ?? "-"}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(c)}>
                      تاریخچه سفارش‌ها
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.data?.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">مشتری‌ای یافت نشد.</p>
          )}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>سفارش‌های {selected?.full_name}</DialogTitle>
          </DialogHeader>
          {orders.isLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : orders.data && orders.data.length > 0 ? (
            <ul className="divide-y divide-border">
              {orders.data.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold" dir="ltr">
                      {o.order_number}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatToman(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">سفارشی ثبت نشده است.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
