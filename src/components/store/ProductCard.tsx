import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatToman, toPersianDigits } from "@/lib/format";
import type { ProductWithCategory } from "@/types/db";
import { toast } from "sonner";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const { add } = useCart();
  const outOfStock = product.stock <= 0;

  return (
    <article className="surface-card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.image_url ?? "/images/accessories.jpg"}
          alt={product.name}
          loading="lazy"
          width={816}
          height={816}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-destructive/90 py-1 text-center text-xs font-medium text-destructive-foreground">
            ناموجود
          </span>
        )}
        {!outOfStock && product.stock <= 5 && (
          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">
            تنها {toPersianDigits(product.stock)} عدد
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.name && (
          <Badge variant="secondary" className="w-fit text-xs font-normal">
            {product.categories.name}
          </Badge>
        )}
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-semibold leading-6 hover:text-primary"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
          {product.short_description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-bold text-foreground">{formatToman(product.price)}</span>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() => {
              add({
                product_id: product.id,
                slug: product.slug,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                stock: product.stock,
              });
              toast.success("به سبد خرید اضافه شد");
            }}
          >
            {outOfStock ? "ناموجود" : "افزودن"}
          </Button>
        </div>
      </div>
    </article>
  );
}
