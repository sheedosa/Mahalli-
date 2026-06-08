"use server";

import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import type { CartLineInput } from "@/types/storefront";

export type OrderResult =
  | { ok: true; ref: string }
  | { ok: false; errorKey: "rate" | "phone" | "empty" | "generic" };

const payloadSchema = z.object({
  slug: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(6).max(40),
  area: z.string().trim().max(120).nullable(),
  hp: z.string().max(200), // honeypot — expected empty
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable(),
        qty: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50),
});

export async function submitOrder(payload: {
  slug: string;
  name: string;
  phone: string;
  area: string | null;
  hp: string;
  items: CartLineInput[];
}): Promise<OrderResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    const phoneIssue = parsed.error.issues.some((i) => i.path[0] === "phone");
    const itemsIssue = parsed.error.issues.some((i) => i.path[0] === "items");
    return {
      ok: false,
      errorKey: phoneIssue ? "phone" : itemsIssue ? "empty" : "generic",
    };
  }
  const p = parsed.data;

  // The place_order RPC re-derives prices, validates ownership/active state,
  // rate-limits and checks the honeypot — server-side, not trusting this input.
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_slug: p.slug,
    p_buyer_name: p.name,
    p_buyer_phone: p.phone,
    p_buyer_area: p.area,
    p_items: p.items,
    p_hp: p.hp,
  });

  if (error) {
    if (error.code === "P0013") return { ok: false, errorKey: "rate" };
    if (error.code === "P0010" || error.code === "P0011")
      return { ok: false, errorKey: "phone" };
    if (error.code === "P0012") return { ok: false, errorKey: "empty" };
    return { ok: false, errorKey: "generic" };
  }

  return { ok: true, ref: String(data).slice(0, 8).toUpperCase() };
}
