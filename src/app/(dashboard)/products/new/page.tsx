import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getI18n } from "@/i18n";
import { getSellerContext } from "@/lib/auth";
import { ProductForm } from "@/components/products/ProductForm";

export default async function NewProductPage() {
  const ctx = await getSellerContext();
  if (!ctx) redirect("/onboarding");
  const { dict } = await getI18n();

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
        <h1 className="display text-xl font-bold">
          {dict.products.newTitle}
        </h1>
      </div>

      <ProductForm
        sellerId={ctx.seller.id}
        initial={{
          name: "",
          description: "",
          price: "",
          category: "",
          stock: "0",
          active: true,
          imageUrl: null,
          variants: [],
        }}
      />
    </div>
  );
}
