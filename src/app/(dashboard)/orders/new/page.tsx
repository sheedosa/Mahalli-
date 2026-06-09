import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getI18n } from "@/i18n";
import { createClient } from "@/lib/supabase/server";
import {
  ManualOrderForm,
  type FormProduct,
} from "@/components/orders/ManualOrderForm";

export default async function NewOrderPage() {
  const { dict } = await getI18n();

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,price,product_variants(id,label,price_override)")
    .order("created_at", { ascending: false });

  const products: FormProduct[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    variants: (p.product_variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      price_override: v.price_override,
    })),
  }));

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          aria-label={dict.common.back}
          className="flex size-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft className="size-5 flip-x" />
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">
          {dict.manualOrder.title}
        </h1>
      </div>
      <ManualOrderForm products={products} />
    </div>
  );
}
