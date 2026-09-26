import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Package, ShoppingBag, Users, Wallet } from "lucide-react";

import { OrderStatusBadge } from "@/components/store/OrderStatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatToman, formatNumber, toPersianDigits } from "@/lib/format";
import { getDashboardStats, LOW_STOCK_THRESHOLD } from "@/services/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: typeof Package;
  label: string;
  value: string;
  tone?: "primary" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-warning/15 text-warning-foreground"
      : tone === "success"
        ? "bg-success/15 text-success"
        : "bg-primary/10 text-primary";
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <span className={`grid size-10 place-items-center rounded-xl ${toneClass}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardStats,
  });

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (isError || !data)
    return (
      <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
        دریافت اطلاعات داشبورد با خطا مواجه شد.
      </p>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">داشبورد</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Package} label="تعداد محصولات" value={formatNumber(data.totalProducts)} />
        <StatCard
          icon={AlertTriangle}
          label="کالاهای کم‌موجود"
          value={formatNumber(data.lowStockProducts.length)}
          tone="warning"
        />
        <StatCard icon={ShoppingBag} label="کل سفارش‌ها" value={formatNumber(data.totalOrders)} />
        <StatCard
          icon={ShoppingBag}
          label="سفارش‌های در انتظار"
          value={formatNumber(data.pendingOrders)}
          tone="warning"
        />
        <StatCard icon={Users} label="مشتریان" value={formatNumber(data.totalCustomers)} />
      </div>

      <div className="surface-card flex items-center gap-3 p-4">
        <span className="grid size-10 place-items-center rounded-xl bg-success/15 text-success">
          <Wallet className="size-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">مجموع فروش (به‌جز سفارش‌های لغوشده)</p>
          <p className="text-lg font-bold">{formatToman(data.revenue)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">آخرین سفارش‌ها</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline">
              مشاهده همه
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold" dir="ltr">
                    {o.order_number}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.customers?.full_name} — {formatDate(o.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatToman(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              کالاهای کم‌موجود (کمتر یا مساوی {toPersianDigits(LOW_STOCK_THRESHOLD)} عدد)
            </h2>
            <Link to="/admin/products" className="text-xs text-primary hover:underline">
              مدیریت محصولات
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              همه کالاها موجودی کافی دارند.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                      {p.sku}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${p.stock === 0 ? "text-destructive" : "text-warning-foreground"}`}
                  >
                    {toPersianDigits(p.stock)} عدد
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
