import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatToman, isValidIranianMobile, toPersianDigits } from "@/lib/format";
import { saveLastOrder } from "@/lib/last-order";
import { SHIPPING_COST } from "@/lib/order-status";
import { createOrder } from "@/services/orders";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "تکمیل خرید | فروشگاه آریا" },
      { name: "description", content: "ثبت اطلاعات تحویل و نهایی کردن سفارش در فروشگاه آریا." },
      { property: "og:title", content: "تکمیل خرید | فروشگاه آریا" },
      { property: "og:description", content: "ثبت اطلاعات تحویل و نهایی کردن سفارش در فروشگاه آریا." },
    ],
  }),
  component: CheckoutPage,
});

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.fullName.trim().length < 3) next.fullName = "نام و نام خانوادگی را کامل وارد کنید.";
    if (!isValidIranianMobile(form.phone))
      next.phone = "شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۱۲۳۴۵۶۷";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "ایمیل وارد شده معتبر نیست.";
    if (form.address.trim().length < 10) next.address = "آدرس تحویل را کامل وارد کنید.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("سبد خرید شما خالی است.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const order = await createOrder({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        shippingAddress: form.address,
        notes: form.notes || undefined,
        items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
      });
      saveLastOrder(order);
      clear();
      toast.success("سفارش شما با موفقیت ثبت شد");
      navigate({ to: "/order-confirmation" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ثبت سفارش انجام نشد.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <StoreLayout>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold">سبد خرید خالی است</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            برای تکمیل خرید ابتدا محصولی به سبد اضافه کنید.
          </p>
          <Button asChild className="mt-6">
            <Link to="/products">مشاهده محصولات</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">تکمیل خرید</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="surface-card space-y-5 p-5">
            <div>
              <Label htmlFor="fullName">نام و نام خانوادگی *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="مثلاً علی رضایی"
                className="mt-2"
              />
              {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">شماره موبایل *</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="09121234567"
                  className="mt-2 text-left"
                />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="email">ایمیل (اختیاری)</Label>
                <Input
                  id="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                  className="mt-2 text-left"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address">آدرس تحویل *</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد"
                rows={3}
                className="mt-2"
              />
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
            </div>

            <div>
              <Label htmlFor="notes">توضیحات سفارش (اختیاری)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="مثلاً ساعت مناسب تحویل"
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          <aside className="surface-card h-fit p-5">
            <h2 className="text-sm font-bold">خلاصه سفارش</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {lines.map((l) => (
                <li key={l.product_id} className="flex justify-between gap-3">
                  <span className="line-clamp-2 text-muted-foreground">
                    {l.name} × {toPersianDigits(l.quantity)}
                  </span>
                  <span className="shrink-0">{formatToman(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>جمع کالاها</dt>
                <dd>{formatToman(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>هزینه ارسال</dt>
                <dd>{formatToman(SHIPPING_COST)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>مبلغ قابل پرداخت</dt>
                <dd>{formatToman(subtotal + SHIPPING_COST)}</dd>
              </div>
            </dl>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
              {submitting ? "در حال ثبت سفارش…" : "ثبت نهایی سفارش"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              پرداخت در محل / هماهنگی تلفنی. این فروشگاه نسخه نمایشی است.
            </p>
          </aside>
        </form>
      </div>
    </StoreLayout>
  );
}
