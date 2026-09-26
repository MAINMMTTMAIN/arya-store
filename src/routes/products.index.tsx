import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { ProductCard } from "@/components/store/ProductCard";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories, listProducts, type ProductQuery } from "@/services/catalog";
import { useState } from "react";

interface ProductSearch {
  q?: string | undefined;
  category?: string | undefined;
  sort?: ProductQuery["sort"];
}

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category:
      typeof search["category"] === "string" && search["category"]
        ? search["category"]
        : undefined,
    sort:
      search["sort"] === "price_asc" ||
      search["sort"] === "price_desc" ||
      search["sort"] === "newest"
        ? search["sort"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "محصولات | فروشگاه آریا" },
      {
        name: "description",
        content: "فهرست کامل محصولات فروشگاه آریا؛ موبایل، لپ‌تاپ، هدفون، ساعت هوشمند و لوازم جانبی.",
      },
      { property: "og:title", content: "محصولات فروشگاه آریا" },
      { property: "og:description", content: "جستجو و فیلتر بین کالاهای دیجیتال فروشگاه آریا." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, category, sort } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q ?? "");

  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const products = useQuery({
    queryKey: ["products", { q, category, sort }],
    queryFn: () => listProducts({ search: q, categorySlug: category, sort }),
  });

  const setSearch = (next: Partial<ProductSearch>) =>
    navigate({ to: "/products", search: (prev) => ({ ...prev, ...next }) });

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">محصولات</h1>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center">
          <form
            className="flex w-full gap-2 md:max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch({ q: term || undefined });
            }}
          >
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جستجو در محصولات…"
              aria-label="جستجو در محصولات"
            />
            <Button type="submit" variant="secondary">
              جستجو
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={sort === "price_asc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearch({ sort: sort === "price_asc" ? undefined : "price_asc" })}
            >
              ارزان‌ترین
            </Button>
            <Button
              variant={sort === "price_desc" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearch({ sort: sort === "price_desc" ? undefined : "price_desc" })}
            >
              گران‌ترین
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/products"
            search={{ q, category: undefined, sort }}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              !category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
            }`}
          >
            همه
          </Link>
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              to="/products"
              search={{ q, category: c.slug, sort }}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                category === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : products.isError ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              دریافت محصولات با خطا مواجه شد. لطفاً صفحه را دوباره بارگذاری کنید.
            </p>
          ) : products.data && products.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="surface-card p-10 text-center">
              <p className="font-semibold">محصولی پیدا نشد</p>
              <p className="mt-2 text-sm text-muted-foreground">
                عبارت جستجو یا دسته‌بندی دیگری را امتحان کنید.
              </p>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
