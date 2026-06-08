import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { StorefrontData } from "@/types/storefront";
import { StorefrontApp } from "@/components/storefront/StorefrontApp";

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

  return <StorefrontApp shop={sf.shop} products={sf.products} slug={slug} />;
}
