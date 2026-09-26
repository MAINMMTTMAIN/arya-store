import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
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
import {
  adminListCategories,
  createCategory,
  updateCategory,
  type CategoryInput,
} from "@/services/admin";
import type { Category } from "@/types/db";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

const EMPTY: CategoryInput = {
  name: "",
  slug: "",
  description: "",
  image: "/images/accessories.jpg",
  active: true,
};

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryInput>(EMPTY);

  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: adminListCategories });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) await updateCategory(editing.id, form);
      else await createCategory(form);
    },
    onSuccess: () => {
      toast.success(editing ? "دسته‌بندی ویرایش شد" : "دسته‌بندی ایجاد شد");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("ذخیره دسته‌بندی انجام نشد. نامک باید یکتا باشد."),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">دسته‌بندی‌ها</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="ml-1 size-4" /> دسته‌بندی جدید
        </Button>
      </div>

      {categories.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="surface-card divide-y divide-border">
          {categories.data?.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={c.image ?? "/images/accessories.jpg"}
                  alt={c.name}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="size-12 rounded-lg border border-border object-cover"
                />
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {c.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={c.active ? "default" : "secondary"}>
                  {c.active ? "فعال" : "غیرفعال"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="ویرایش"
                  onClick={() => {
                    setEditing(c);
                    setForm({
                      name: c.name,
                      slug: c.slug,
                      description: c.description,
                      image: c.image,
                      active: c.active,
                    });
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cname">نام</Label>
              <Input
                id="cname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="cslug">نامک (slug)</Label>
              <Input
                id="cslug"
                dir="ltr"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="mt-2 text-left"
              />
            </div>
            <div>
              <Label htmlFor="cdesc">توضیحات</Label>
              <Textarea
                id="cdesc"
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="cactive">دسته‌بندی فعال باشد</Label>
              <Switch
                id="cactive"
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
              disabled={save.isPending}
              onClick={() => {
                if (!form.name.trim() || !form.slug.trim()) {
                  toast.error("نام و نامک الزامی است.");
                  return;
                }
                save.mutate();
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
