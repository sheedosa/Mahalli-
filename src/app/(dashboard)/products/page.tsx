import { createClient } from "@/lib/supabase/server";
import {
  ProductList,
  PRODUCT_SELECT,
  PAGE_SIZE,
  type ProductRow,
} from "@/components/products/ProductList";

export default async function ProductsPage() {
  const supabase = await createClient();

  // First page, server-rendered for a fast first paint; the client component
  // takes over for search and incremental loading. RLS scopes to the tenant.
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  const rows = (data ?? []) as ProductRow[];

  return (
    <ProductList
      initial={rows.slice(0, PAGE_SIZE)}
      initialHasMore={rows.length > PAGE_SIZE}
    />
  );
}
