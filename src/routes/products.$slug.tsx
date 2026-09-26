import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/store/StoreLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { formatToman, toPersianDigits } from "@/lib/format";
import { getProductBySlug } from "@/services/catalog";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [
      { title: "جزئیات محصول | فروشگاه آریا" },
      { name: "description", content: "مشخصات، قیمت و موجودی محصول در فروشگاه آریا." },
      { property: "og:title", content: "جزئیات محصول | فروشگاه آریا" },
      { property: "og:description", content: "مشخصات، قیمت و موجودی محصول در فروشگاه آریا." },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
  });

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (isError || !product) {
    return (
      <StoreLayout>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">محصول پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            این محصول حذف شده یا دیگر موجود نیست.
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">بازگشت به محصولات</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <nav className="mb-5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            خانه
          </Link>
          <span className="px-1">/</span>
          <Link to="/products" className="hover:text-foreground">
            محصولات
          </Link>
          {product.categories && (
            <>
              <span className="px-1">/</span>
              <Link
                to="/products"
                search={{ category: product.categories.slug, q: undefined, sort: undefined }}
                className="hover:text-foreground"
              >
                {product.categories.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <img
            src={product.image_url ?? "/images/accessories.jpg"}
            alt={product.name}
            width={816}
            height={816}
            className="w-full rounded-2xl border border-border object-cover"
          />

          <div>
            {product.categories && <Badge variant="secondary">{product.categories.name}</Badge>}
            <h1 className="mt-3 text-2xl font-bold leading-relaxed">{product.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              کد کالا: <span dir="ltr">{product.sku}</span>
            </p>
            <p className="mt-4 leading-8 text-muted-foreground">{product.description}</p>

            <div className="surface-card mt-6 space-y-4 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">قیمت</span>
                <span className="text-xl font-bold">{formatToman(product.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">موجودی انبار</span>
                {outOfStock ? (
                  <span className="font-semibold text-destructive">ناموجود</span>
                ) : (
                  <span className="font-semibold text-success">
                    {toPersianDigits(product.stock)} عدد موجود
                  </span>
                )}
              </div>

              {!outOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">تعداد</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="کاهش تعداد"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{toPersianDigits(qty)}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="افزایش تعداد"
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  disabled={outOfStock}
                  onClick={() => {
                    add(
                      {
                        product_id: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: Number(product.price),
                        image_url: product.image_url,
                        stock: product.stock,
                      },
                      qty,
                    );
                    toast.success("به سبد خرید اضافه شد");
                  }}
                >
                  افزودن به سبد خرید
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  disabled={outOfStock}
                  onClick={() => {
                    add(
                      {
                        product_id: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: Number(product.price),
                        image_url: product.image_url,
                        stock: product.stock,
                      },
                      qty,
                    );
                    navigate({ to: "/cart" });
                  }}
                >
                  خرید و مشاهده سبد
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
