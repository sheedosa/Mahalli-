// Shared, non-"use client" so the server orders page and the client list can
// both import these values (see products/query.ts for the why).

export const PAGE_SIZE = 15;

export const ORDER_SELECT =
  "id,status,channel,buyer_name,buyer_phone,total,created_at,order_items(count)";

export type OrderRow = {
  id: string;
  status: import("@/components/orders/status").OrderStatus;
  channel: "storefront" | "manual";
  buyer_name: string | null;
  buyer_phone: string | null;
  total: number;
  created_at: string;
  order_items: { count: number }[];
};
