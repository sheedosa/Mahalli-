"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/auth";

export type ProductFormState = { error?: boolean };

const variantSchema = z.object({
  label: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(60).optional().default(""),
  price_override: z.union([z.number().nonnegative(), z.null()]).optional(),
  stock: z.number().int().min(0).max(1_000_000).default(0),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  price: z.number().nonnegative().max(10_000_000),
  category: z.string().trim().max(80).optional().default(""),
  image_url: z.string().url().max(1000).optional().or(z.literal("")),
  stock: z.number().int().min(0).max(1_000_000),
  active: z.boolean(),
  variants: z.array(variantSchema).max(50),
});

/** Derive the storage object path from a public bucket URL, or null. */
function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/product-images/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const ctx = await getSellerContext();
  if (!ctx) return { error: true };

  let variants: unknown = [];
  try {
    variants = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    return { error: true };
  }

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: Number(formData.get("price") ?? 0),
    category: formData.get("category") ?? "",
    image_url: formData.get("image_url") ?? "",
    stock: Number(formData.get("stock") ?? 0),
    active: formData.get("active") === "true",
    variants,
  });
  if (!parsed.success) return { error: true };
  const p = parsed.data;

  const supabase = await createClient();

  // For cleanup: remember the previous image when editing.
  let previousImage: string | null = null;
  if (p.id) {
    const { data } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", p.id)
      .maybeSingle();
    previousImage = data?.image_url ?? null;
  }

  const { error } = await supabase.rpc("save_product", {
    p_id: p.id ?? null,
    p_seller: ctx.seller.id,
    p_name: p.name,
    p_description: p.description || null,
    p_price: p.price,
    p_category: p.category || null,
    p_image_url: p.image_url || null,
    p_stock: p.stock,
    p_active: p.active,
    p_variants: p.variants,
  });
  if (error) return { error: true };

  // Best-effort: remove the replaced image so the bucket doesn't accrue orphans.
  const newPath = storagePathFromUrl(p.image_url || null);
  const oldPath = storagePathFromUrl(previousImage);
  if (oldPath && oldPath !== newPath) {
    await supabase.storage.from("product-images").remove([oldPath]);
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath(`/${ctx.seller.slug}`); // refresh the public storefront
  redirect("/products");
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteProduct(formData: FormData): Promise<void> {
  const ctx = await getSellerContext();
  if (!ctx) return;

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", parsed.data.id)
    .maybeSingle();

  // RLS guarantees the seller can only delete their own product. Variants
  // cascade via the FK.
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return;

  const path = storagePathFromUrl(existing?.image_url);
  if (path) await supabase.storage.from("product-images").remove([path]);

  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath(`/${ctx.seller.slug}`);
  redirect("/products");
}
