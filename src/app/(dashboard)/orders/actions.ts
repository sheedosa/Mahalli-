"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/auth";

const statusEnum = z.enum([
  "new",
  "confirmed",
  "ready",
  "out",
  "delivered",
  "cancelled",
]);

export async function updateOrderStatus(
  orderId: string,
  status: z.infer<typeof statusEnum>,
): Promise<{ ok: boolean }> {
  const ctx = await getSellerContext();
  if (!ctx) return { ok: false };
  const parsed = z
    .object({ orderId: z.string().uuid(), status: statusEnum })
    .safeParse({ orderId, status });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_status", {
    p_order: parsed.data.orderId,
    p_status: parsed.data.status,
  });
  if (error) return { ok: false };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/${ctx.seller.slug}`); // stock changed → refresh storefront
  return { ok: true };
}

export async function saveOrderNote(
  orderId: string,
  notes: string,
): Promise<{ ok: boolean }> {
  const ctx = await getSellerContext();
  if (!ctx) return { ok: false };
  const parsed = z
    .object({ orderId: z.string().uuid(), notes: z.string().max(2000) })
    .safeParse({ orderId, notes });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  // RLS limits the update to the seller's own orders.
  const { error } = await supabase
    .from("orders")
    .update({ notes: parsed.data.notes || null })
    .eq("id", parsed.data.orderId);
  if (error) return { ok: false };

  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

const manualSchema = z.object({
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  area: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
  deliveryFee: z.number().min(0).max(1_000_000),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable(),
        qty: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(100),
});

export type ManualOrderResult = { ok: false; error: true };

export async function createManualOrder(payload: {
  name?: string;
  phone?: string;
  area?: string;
  notes?: string;
  deliveryFee: number;
  items: { product_id: string; variant_id: string | null; qty: number }[];
}): Promise<ManualOrderResult> {
  const ctx = await getSellerContext();
  if (!ctx) return { ok: false, error: true };

  const parsed = manualSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: true };
  const p = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_manual_order", {
    p_seller: ctx.seller.id,
    p_buyer_name: p.name ?? "",
    p_buyer_phone: p.phone ?? "",
    p_buyer_area: p.area ?? "",
    p_notes: p.notes ?? "",
    p_delivery_fee: p.deliveryFee,
    p_items: p.items,
  });
  if (error || !data) return { ok: false, error: true };

  revalidatePath("/orders");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/orders/${data}`);
}
