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
    .select("id,name,price,stock,product_variants(id,label,price_override,stock)")
    .order("created_at", { ascending: false });

  const products: FormProduct[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: p.stock,
    variants: (p.product_variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      price_override: v.price_override,
      stock: v.stock,
    })),
  }));

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          aria-label={dict.common.back}
          className="flex size-10 items-center justify-center rounded-lg text-[var(--z500)] hover:bg-[var(--z100)]"
        >
          <ChevronLeft className="size-5 flip-x" />
        </Link>
        <h1 className="text-xl font-bold">
          {dict.manualOrder.title}
        </h1>
      </div>
      <ManualOrderForm products={products} />
    </div>
  );
}
