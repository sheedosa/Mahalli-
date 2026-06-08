import { createClient } from "@/lib/supabase/server";
import { OrdersList } from "@/components/orders/OrdersList";
import {
  ORDER_SELECT,
  PAGE_SIZE,
  type OrderRow,
} from "@/components/orders/query";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  const rows = (data ?? []) as OrderRow[];
  return (
    <OrdersList
      initial={rows.slice(0, PAGE_SIZE)}
      initialHasMore={rows.length > PAGE_SIZE}
    />
  );
}
