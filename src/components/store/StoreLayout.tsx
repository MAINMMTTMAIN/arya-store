import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, PackageSearch, User } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { toPersianDigits } from "@/lib/format";

const NAV = [
  { to: "/products", label: "همه محصولات" },
  { to: "/track", label: "پیگیری سفارش" },
  { to: "/account", label: "سفارش‌های من" },
] as const;

function SearchBox({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/products", search: { q: term || undefined, category: undefined } });
        onDone?.();
      }}
    >
      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="جستجوی محصول، برند یا کد کالا…"
        className="pr-9"
        aria-label="جستجوی محصول"
      />
    </form>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="منو">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6">
                <SearchBox onDone={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <PackageSearch className="size-5" />
            </span>
            <span className="text-lg font-bold">فروشگاه آریا</span>
          </Link>

          <div className="mx-2 hidden flex-1 md:block">
            <SearchBox />
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link to="/cart" className="relative">
            <Button variant="outline" size="icon" aria-label="سبد خرید">
              <ShoppingCart className="size-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {toPersianDigits(count)}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <h3 className="text-base font-bold">فروشگاه آریا</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              فروشگاه اینترنتی کالای دیجیتال؛ موبایل، لپ‌تاپ، هدفون، ساعت هوشمند و لوازم جانبی با
              ارسال به سراسر ایران.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">دسترسی سریع</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/auth" className="inline-flex items-center gap-1 hover:text-foreground">
                  <User className="size-3.5" /> ورود مدیر فروشگاه
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">پشتیبانی</h4>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              همه‌روزه ۹ تا ۱۸
              <br />
              این فروشگاه یک نسخه نمایشی است و پرداخت آنلاین ندارد.
            </p>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © فروشگاه آریا — نسخه نمایشی
        </div>
      </footer>
    </div>
  );
}
