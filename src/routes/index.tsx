import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, Headphones } from "lucide-react";

import { ProductCard } from "@/components/store/ProductCard";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories, listProducts } from "@/services/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فروشگاه آریا | خرید موبایل، لپ‌تاپ و لوازم جانبی" },
      {
        name: "description",
        content:
          "فروشگاه اینترنتی آریا؛ خرید گوشی موبایل، لپ‌تاپ، هدفون، ساعت هوشمند و لوازم جانبی با قیمت مناسب و ارسال سریع.",
      },
      { property: "og:title", content: "فروشگاه آریا | کالای دیجیتال" },
      {
        property: "og:description",
        content: "خرید موبایل، لپ‌تاپ، هدفون و ساعت هوشمند از فروشگاه اینترنتی آریا.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const newest = useQuery({
    queryKey: ["products", "newest"],
    queryFn: () => listProducts({ limit: 8 }),
  });

  return (
    <StoreLayout>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-medium text-primary">فروشگاه کالای دیجیتال</p>
            <h1 className="mt-3 text-3xl font-bold leading-relaxed md:text-4xl md:leading-relaxed">
              هرچه برای دنیای دیجیتال لازم داری، اینجاست
            </h1>
            <p className="mt-4 max-w-md leading-7 text-muted-foreground">
              موبایل، لپ‌تاپ، هدفون، ساعت هوشمند و لوازم جانبی اصل با قیمت شفاف، موجودی لحظه‌ای و
              ارسال به سراسر ایران.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/products">مشاهده محصولات</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/track">پیگیری سفارش</Link>
              </Button>
            </div>
          </div>
          <img
            src="/images/hero.jpg"
            alt="کالاهای دیجیتال فروشگاه آریا"
            width={1600}
            height={912}
            className="w-full rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3">
        {[
          { icon: Truck, title: "ارسال سریع", text: "ارسال به سراسر ایران طی ۲ تا ۴ روز کاری" },
          { icon: ShieldCheck, title: "ضمانت اصالت کالا", text: "همه کالاها اورجینال و دارای گارانتی" },
          { icon: Headphones, title: "پشتیبانی همه‌روزه", text: "پاسخگویی ۹ تا ۱۸ در تمام روزهای هفته" },
        ].map((f) => (
          <div key={f.title} className="surface-card flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        <h2 className="mb-4 text-lg font-bold">دسته‌بندی‌ها</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.isLoading &&
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ category: c.slug, q: undefined }}
              className="surface-card group overflow-hidden text-center transition-shadow hover:shadow-lg"
            >
              <img
                src={c.image ?? "/images/accessories.jpg"}
                alt={c.name}
                loading="lazy"
                width={816}
                height={816}
                className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
              />
              <p className="p-3 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">جدیدترین محصولات</h2>
          <Link to="/products" className="text-sm text-primary hover:underline">
            مشاهده همه
          </Link>
        </div>
        {newest.isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {newest.data?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
