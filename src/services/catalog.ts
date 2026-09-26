import { supabase } from "@/integrations/supabase/client";
import type { Category, Product, ProductWithCategory } from "@/types/db";

/**
 * Read-only catalog access for the public storefront.
 * All queries go through the Data API; row level security only exposes active rows to guests.
 */

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface ProductQuery {
  categorySlug?: string | undefined;
  search?: string | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | undefined;
  limit?: number | undefined;
  inStockOnly?: boolean | undefined;
}

export async function listProducts(params: ProductQuery = {}): Promise<ProductWithCategory[]> {
  let query = supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("active", true);

  if (params.categorySlug) {
    const { data: category, error: catError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.categorySlug)
      .maybeSingle();
    if (catError) throw catError;
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim();
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,short_description.ilike.%${term}%`);
  }

  if (params.inStockOnly) query = query.gt("stock", 0);

  if (params.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (params.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (params.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as ProductWithCategory) ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("active", true);
  if (error) throw error;
  return data ?? [];
}
