import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { StorefrontData } from "@/types/storefront";
import { StorefrontApp } from "@/components/storefront/StorefrontApp";
import { ToastProvider } from "@/components/ui/Toast";

// Lightweight ISR-style revalidation. The storefront reads through the
// get_storefront RPC with a session-less client, so it is not tied to any user.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_storefront", { p_slug: slug });
  const sf = data as unknown as StorefrontData | null;
  if (!sf) return { title: "Mahalli" };
  return {
    title: sf.shop.name,
    description: `${sf.shop.name}${sf.shop.city ? ` · ${sf.shop.city}` : ""}`,
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_storefront", { p_slug: slug });

  const sf = data as unknown as StorefrontData | null;
  if (!sf) notFound();

  // Structured data: local store + its product list (search engines, rich cards).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: sf.shop.name,
    ...(sf.shop.city ? { address: { "@type": "PostalAddress", addressLocality: sf.shop.city } } : {}),
    ...(sf.shop.contact_phone ? { telephone: sf.shop.contact_phone } : {}),
    makesOffer: sf.products.slice(0, 20).map((p) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Product", name: p.name },
      price: p.price,
      priceCurrency: "LYD",
      availability:
        p.stock > 0 || p.variants.some((v) => v.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    })),
  };

  return (
    <ToastProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontApp shop={sf.shop} products={sf.products} slug={slug} />
    </ToastProvider>
  );
}
