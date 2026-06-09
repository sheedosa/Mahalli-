import type { Enums } from "@/lib/database.types";

export type OrderStatus = Enums<"order_status">;

/** The forward pipeline (cancelled is a side state). */
export const STATUS_FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "ready",
  "out",
  "delivered",
];

export const ALL_STATUSES: OrderStatus[] = [...STATUS_FLOW, "cancelled"];

export function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-700";
    case "confirmed":
      return "bg-indigo-100 text-indigo-700";
    case "ready":
      return "bg-violet-100 text-violet-700";
    case "out":
      return "bg-amber-100 text-amber-700";
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-[var(--z100)] text-[var(--z600)]";
  }
}

/** Next/previous status in the forward flow, or null at the ends. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}
export function prevStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i > 0 ? STATUS_FLOW[i - 1] : null;
}
