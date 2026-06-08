// Plain (non-"use client") module so the server customers page and the client
// list component can share these. Importing a *value* from a client module into
// a server component turns it into a client-reference proxy, which then breaks
// `.select(CUSTOMER_SELECT)` — so the query constants live here.

export const PAGE_SIZE = 20;

export const CUSTOMER_SELECT =
  "id,name,phone,order_count,total_spent,last_order_at";

export type CustomerRow = {
  id: string;
  name: string | null;
  phone: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};
