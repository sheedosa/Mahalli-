"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/auth";

export type SettingsState = { saved?: boolean; error?: boolean };

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  lang: z.enum(["ar", "en"]),
});

export async function updateShop(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  // Resolve the tenant server-side — never trust a client-supplied seller id.
  const ctx = await getSellerContext();
  if (!ctx) return { error: true };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    city: formData.get("city") || undefined,
    phone: formData.get("phone") || undefined,
    lang: formData.get("lang") || ctx.seller.lang,
  });
  if (!parsed.success) return { error: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sellers")
    .update({
      name: parsed.data.name,
      city: parsed.data.city ?? null,
      contact_phone: parsed.data.phone ?? null,
      lang: parsed.data.lang,
    })
    .eq("id", ctx.seller.id); // RLS also enforces this scope

  if (error) return { error: true };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${ctx.seller.slug}`); // refresh the public storefront
  return { saved: true };
}
