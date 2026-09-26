import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  Tags,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin, isCurrentUserAdmin } from "@/services/admin";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "محصولات", icon: Package, exact: false },
  { to: "/admin/categories", label: "دسته‌بندی‌ها", icon: Tags, exact: false },
  { to: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag, exact: false },
  { to: "/admin/customers", label: "مشتریان", icon: Users, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: isCurrentUserAdmin });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-60 shrink-0 border-l border-border bg-sidebar p-4 md:block">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-5" />
          </span>
          <span className="font-bold">پنل آریا</span>
        </Link>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/">مشاهده فروشگاه</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="ml-1 size-4" /> خروج
          </Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 md:hidden">
          <span className="font-bold">پنل آریا</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            خروج
          </Button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 md:p-6">
          {admin.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : admin.data ? (
            <Outlet />
          ) : (
            <div className="surface-card mx-auto max-w-md p-6 text-center">
              <h2 className="text-lg font-bold">دسترسی مدیریت ندارید</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                این حساب کاربری نقش مدیر ندارد. اگر اولین کاربر فروشگاه هستید، می‌توانید نقش مدیر را
                دریافت کنید.
              </p>
              <Button
                className="mt-5"
                onClick={async () => {
                  await claimAdmin();
                  admin.refetch();
                }}
              >
                دریافت نقش مدیر
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
