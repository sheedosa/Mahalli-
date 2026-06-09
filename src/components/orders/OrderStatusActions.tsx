"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/ui/Toast";
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
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function go(next: OrderStatus, confirmCancel = false) {
    if (confirmCancel && !confirm(t.cancelConfirm)) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next);
      if (res?.ok === false) {
        toast.error(dict.common.genericError);
        return;
      }
      toast.success(t.statusUpdated);
      router.refresh();
    });
  }

  const fwd = nextStatus(status);
  const back = prevStatus(status);

  if (status === "cancelled") {
    return (
      <button disabled={pending} onClick={() => go("new")} className="btn btn-primary">
        <RotateCcw className="size-4" /> {t.reopen}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {fwd && (
        <button disabled={pending} onClick={() => go(fwd)} className="btn btn-primary">
          {t.advanceTo.replace("{s}", t.status[fwd])}
          <ArrowRight className="size-4 flip-x" />
        </button>
      )}
      <div className="flex gap-2">
        {back && (
          <button disabled={pending} onClick={() => go(back)} className="btn btn-outline" style={{ flex: 1 }}>
            {t.moveBack}
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => go("cancelled", true)}
          className="btn btn-outline-danger"
          style={{ flex: 1 }}
        >
          <X className="size-4" /> {t.cancelOrder}
        </button>
      </div>
    </div>
  );
}
