import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatToman, toPersianDigits } from "@/lib/format";
import { SHIPPING_COST } from "@/lib/order-status";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید | فروشگاه آریا" },
      { name: "description", content: "مشاهده و ویرایش کالاهای سبد خرید فروشگاه آریا." },
      { property: "og:title", content: "سبد خرید | فروشگاه آریا" },
      { property: "og:description", content: "مشاهده و ویرایش کالاهای سبد خرید فروشگاه آریا." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart();

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">سبد خرید</h1>

        {lines.length === 0 ? (
          <div className="surface-card mt-6 p-10 text-center">
            <p className="font-semibold">سبد خرید شما خالی است</p>
            <p className="mt-2 text-sm text-muted-foreground">
              از بین محصولات فروشگاه، کالای موردنظر خود را انتخاب کنید.
            </p>
            <Button asChild className="mt-6">
              <Link to="/products">مشاهده محصولات</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <ul className="surface-card divide-y divide-border">
              {lines.map((line) => (
                <li key={line.product_id} className="flex gap-4 p-4">
                  <Link to="/products/$slug" params={{ slug: line.slug }} className="shrink-0">
                    <img
                      src={line.image_url ?? "/images/accessories.jpg"}
                      alt={line.name}
                      loading="lazy"
                      width={816}
                      height={816}
                      className="size-20 rounded-lg border border-border object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-2">
                    <Link
                      to="/products/$slug"
                      params={{ slug: line.slug }}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {line.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">{formatToman(line.price)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="کاهش تعداد"
                          onClick={() => setQuantity(line.product_id, line.quantity - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {toPersianDigits(line.quantity)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="افزایش تعداد"
                          disabled={line.quantity >= line.stock}
                          onClick={() => setQuantity(line.product_id, line.quantity + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">
                          {formatToman(line.price * line.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف از سبد"
                          onClick={() => remove(line.product_id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="surface-card h-fit p-5">
              <h2 className="text-sm font-bold">خلاصه سفارش</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>جمع کالاها</dt>
                  <dd>{formatToman(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>هزینه ارسال</dt>
                  <dd>{formatToman(SHIPPING_COST)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <dt>مبلغ قابل پرداخت</dt>
                  <dd>{formatToman(subtotal + SHIPPING_COST)}</dd>
                </div>
              </dl>
              <Button asChild className="mt-5 w-full" size="lg">
                <Link to="/checkout">ادامه و ثبت سفارش</Link>
              </Button>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                پرداخت در این نسخه نمایشی انجام نمی‌شود؛ سفارش شما به صورت «در انتظار تأیید» ثبت
                می‌گردد.
              </p>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
