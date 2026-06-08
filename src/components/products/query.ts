// Plain (non-"use client") module so the server product list page and the
// client list component can share these. Importing a *value* from a client
// module into a server component turns it into a client-reference proxy, which
// then breaks `.select(PRODUCT_SELECT)` — so the query constants live here.

export const PAGE_SIZE = 12;

export const PRODUCT_SELECT =
  "id,name,price,image_url,active,stock,category,created_at,product_variants(stock)";

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  active: boolean;
  stock: number;
  category: string | null;
  created_at: string;
  product_variants: { stock: number }[];
};
