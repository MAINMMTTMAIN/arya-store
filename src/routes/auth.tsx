import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { claimAdmin } from "@/services/admin";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود مدیر | فروشگاه آریا" },
      { name: "description", content: "ورود به پنل مدیریت فروشگاه آریا." },
      { property: "og:title", content: "ورود مدیر | فروشگاه آریا" },
      { property: "og:description", content: "ورود به پنل مدیریت فروشگاه آریا." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.message("حساب ساخته شد. لطفاً وارد شوید.");
        setMode("signin");
        return;
      }

      // The first account of the store becomes its administrator.
      try {
        await claimAdmin();
      } catch {
        /* an admin already exists */
      }
      toast.success("خوش آمدید");
      navigate({ to: "/admin" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ورود انجام نشد.";
      toast.error(
        message.includes("Invalid login credentials")
          ? "ایمیل یا رمز عبور نادرست است."
          : message.includes("already registered")
            ? "این ایمیل قبلاً ثبت شده است."
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <StoreLayout>
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="surface-card p-6">
          <h1 className="text-xl font-bold">
            {mode === "signin" ? "ورود به پنل مدیریت" : "ساخت حساب مدیر"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            این بخش مخصوص مدیر فروشگاه است. مشتریان برای پیگیری سفارش نیازی به حساب کاربری ندارند.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 text-left"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 text-left"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "لطفاً صبر کنید…" : mode === "signin" ? "ورود" : "ثبت‌نام"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-sm text-primary hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "حساب ندارید؟ ساخت حساب مدیر" : "قبلاً ثبت‌نام کرده‌اید؟ ورود"}
          </button>
        </div>
      </div>
    </StoreLayout>
  );
}
