"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { useI18n } from "@/i18n/provider";
import {
  nextStatus,
  prevStatus,
  type OrderStatus,
} from "@/components/orders/status";

export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const { dict } = useI18n();
  const t = dict.orders;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(next: OrderStatus, confirmCancel = false) {
    if (confirmCancel && !confirm(t.cancelConfirm)) return;
    startTransition(async () => {
      await updateOrderStatus(orderId, next);
      router.refresh();
    });
  }

  const fwd = nextStatus(status);
  const back = prevStatus(status);

  if (status === "cancelled") {
    return (
      <button
        disabled={pending}
        onClick={() => go("new")}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 font-semibold text-white disabled:opacity-50"
      >
        <RotateCcw className="size-4" /> {t.reopen}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {fwd && (
        <button
          disabled={pending}
          onClick={() => go(fwd)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 font-semibold text-white disabled:opacity-50"
        >
          {t.advanceTo.replace("{s}", t.status[fwd])}
          <ArrowRight className="size-4 flip-x" />
        </button>
      )}
      <div className="flex gap-2">
        {back && (
          <button
            disabled={pending}
            onClick={() => go(back)}
            className="h-11 flex-1 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 disabled:opacity-50"
          >
            {t.moveBack}
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => go("cancelled", true)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          <X className="size-4" /> {t.cancelOrder}
        </button>
      </div>
    </div>
  );
}
