import { createClient } from "@/lib/supabase/server";
import { CustomersList } from "@/components/customers/CustomersList";
import {
  CUSTOMER_SELECT,
  PAGE_SIZE,
  type CustomerRow,
} from "@/components/customers/query";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .order("last_order_at", { ascending: false, nullsFirst: false })
    .range(0, PAGE_SIZE);

  const rows = (data ?? []) as CustomerRow[];
  return (
    <CustomersList
      initial={rows.slice(0, PAGE_SIZE)}
      initialHasMore={rows.length > PAGE_SIZE}
    />
  );
}
