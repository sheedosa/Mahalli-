"use client";

import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/(dashboard)/products/actions";
import { useI18n } from "@/i18n/provider";

export function DeleteProductButton({ productId }: { productId: string }) {
  const { dict } = useI18n();
  const t = dict.products;
  return (
    <form action={deleteProduct}>
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(t.deleteConfirm)) e.preventDefault();
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="size-4" /> {t.deleteProduct}
      </button>
    </form>
  );
}
