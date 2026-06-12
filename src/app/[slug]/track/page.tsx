import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import type { StorefrontData } from "@/types/storefront";
import { getI18n } from "@/i18n";
import { TrackOrderView } from "@/components/storefront/TrackOrderView";

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
  const { dict } = await getI18n();
  if (!sf) return { title: "Mahalli" };
  return { title: `${dict.storefront.trackTitle} · ${sf.shop.name}` };
}

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_storefront", { p_slug: slug });

  const sf = data as unknown as StorefrontData | null;
  if (!sf) notFound();

  return (
    <TrackOrderView slug={slug} theme={sf.shop.theme} initialRef={ref ?? ""} />
  );
}
