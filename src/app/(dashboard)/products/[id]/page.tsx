import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/products/ProductForm";
import { DeleteProductButton } from "@/components/products/DeleteProductButton";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding");
  const { dict } = await getI18n();

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound(); // RLS hides other tenants' products → 404

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/products"
          aria-label={dict.common.back}
          className="flex size-10 items-center justify-center rounded-lg text-[var(--z500)] hover:bg-[var(--z100)]"
        >
          <ChevronLeft className="size-5 flip-x" />
        </Link>
        <h1 className="text-xl font-bold">
          {dict.products.editTitle}
        </h1>
      </div>

      <ProductForm
        sellerId={ctx.seller.id}
        initial={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          price: String(product.price),
          category: product.category ?? "",
          stock: String(product.stock),
          active: product.active,
          imageUrl: product.image_url,
          variants: (product.product_variants ?? []).map((v) => ({
            label: v.label,
            sku: v.sku ?? "",
            price_override:
              v.price_override != null ? String(v.price_override) : "",
            stock: String(v.stock),
          })),
        }}
      />

      <DeleteProductButton productId={product.id} />
    </div>
  );
}
