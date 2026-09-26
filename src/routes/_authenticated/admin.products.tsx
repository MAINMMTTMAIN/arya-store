import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatToman, toPersianDigits } from "@/lib/format";
import {
  adminListCategories,
  adminListProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/services/admin";
import type { ProductWithCategory } from "@/types/db";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

const EMPTY: ProductInput = {
  name: "",
  slug: "",
  sku: "",
  category_id: null,
  price: 0,
  stock: 0,
  short_description: "",
  description: "",
  image_url: "/images/accessories.jpg",
  active: true,
};

const IMAGE_OPTIONS = [
  { value: "/images/mobile.jpg", label: "موبایل" },
  { value: "/images/laptop.jpg", label: "لپ‌تاپ" },
  { value: "/images/headphone.jpg", label: "هدفون" },
  { value: "/images/watch.jpg", label: "ساعت هوشمند" },
  { value: "/images/accessories.jpg", label: "لوازم جانبی" },
];

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY);

  const products = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: () => adminListProducts(search),
  });
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: adminListCategories });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editing) await updateProduct(editing.id, form);
      else await createProduct(form);
    },
    onSuccess: () => {
      toast.success(editing ? "محصول ویرایش شد" : "محصول ایجاد شد");
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "کد کالا یا نامک تکراری است." : "ذخیره محصول انجام نشد.",
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("محصول حذف شد");
      invalidate();
    },
    onError: () =>
      toast.error("این محصول در سفارش‌ها استفاده شده است؛ به‌جای حذف آن را غیرفعال کنید."),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(p: ProductWithCategory) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      category_id: p.category_id,
      price: Number(p.price),
      stock: p.stock,
      short_description: p.short_description,
      description: p.description,
      image_url: p.image_url,
      active: p.active,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">محصولات</h1>
        <Button onClick={openCreate}>
          <Plus className="ml-1 size-4" /> محصول جدید
        </Button>
      </div>

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
          placeholder="جستجو بر اساس نام یا کد کالا"
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          جستجو
        </Button>
      </form>

      {products.isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">محصول</th>
                <th className="p-3 font-medium">دسته‌بندی</th>
                <th className="p-3 font-medium">قیمت</th>
                <th className="p-3 font-medium">موجودی</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.data?.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url ?? "/images/accessories.jpg"}
                        alt={p.name}
                        loading="lazy"
                        width={816}
                        height={816}
                        className="size-10 rounded-lg border border-border object-cover"
                      />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {p.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.categories?.name ?? "-"}</td>
                  <td className="p-3">{formatToman(p.price)}</td>
                  <td className="p-3">
                    <span className={p.stock <= 5 ? "font-bold text-destructive" : ""}>
                      {toPersianDigits(p.stock)}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant={p.active ? "default" : "secondary"}>
                      {p.active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" aria-label="ویرایش" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="حذف"
                        onClick={() => {
                          if (confirm(`«${p.name}» حذف شود؟`)) remove.mutate(p.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.data?.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">محصولی یافت نشد.</p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش محصول" : "محصول جدید"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">نام محصول</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="slug">نامک (slug)</Label>
                <Input
                  id="slug"
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-2 text-left"
                />
              </div>
              <div>
                <Label htmlFor="sku">کد کالا (SKU)</Label>
                <Input
                  id="sku"
                  dir="ltr"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="mt-2 text-left"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="stock">موجودی</Label>
                <Input
                  id="stock"
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">دسته‌بندی</Label>
              <select
                id="category"
                value={form.category_id ?? ""}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">بدون دسته‌بندی</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="image">تصویر محصول</Label>
              <select
                id="image"
                value={form.image_url ?? ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value || null })}
                className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {IMAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="short">توضیح کوتاه</Label>
              <Input
                id="short"
                value={form.short_description ?? ""}
                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="desc">توضیحات کامل</Label>
              <Textarea
                id="desc"
                rows={4}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="active">محصول فعال باشد</Label>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim() || !form.slug.trim() || !form.sku.trim()) {
                  toast.error("نام، نامک و کد کالا الزامی است.");
                  return;
                }
                save.mutate();
              }}
              disabled={save.isPending}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
