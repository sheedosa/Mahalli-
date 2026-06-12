"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { THEME_IDS } from "@/lib/themes";

export type SettingsState = { saved?: boolean; error?: boolean };

const boolStr = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  lang: z.enum(["ar", "en"]),
  theme: z.enum(THEME_IDS),
  notify_order_placed: boolStr,
  notify_order_confirmed: boolStr,
  notify_order_out: boolStr,
  notify_order_delivered: boolStr,
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
    theme: formData.get("theme") || ctx.seller.theme,
    notify_order_placed: formData.get("notify_order_placed") ?? undefined,
    notify_order_confirmed: formData.get("notify_order_confirmed") ?? undefined,
    notify_order_out: formData.get("notify_order_out") ?? undefined,
    notify_order_delivered: formData.get("notify_order_delivered") ?? undefined,
  });
  if (!parsed.success) return { error: true };

  const notifyPrefs = {
    order_placed: parsed.data.notify_order_placed ?? true,
    order_confirmed: parsed.data.notify_order_confirmed ?? true,
    order_out: parsed.data.notify_order_out ?? true,
    order_delivered: parsed.data.notify_order_delivered ?? true,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sellers")
    .update({
      name: parsed.data.name,
      city: parsed.data.city ?? null,
      contact_phone: parsed.data.phone ?? null,
      lang: parsed.data.lang,
      theme: parsed.data.theme,
      notify_prefs: notifyPrefs,
    })
    .eq("id", ctx.seller.id); // RLS also enforces this scope

  if (error) return { error: true };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${ctx.seller.slug}`); // refresh the public storefront
  return { saved: true };
}

export type AccountState = {
  errorKey?: "emailInvalid" | "emailTaken" | "wrongPassword" | "passwordTooShort" | "generic";
  infoKey?: "emailChangeSent" | "passwordChanged";
};

export async function changeEmail(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const ctx = await getSellerContext();
  if (!ctx) return { errorKey: "generic" };

  const parsed = z.object({ email: z.string().email() }).safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { errorKey: "emailInvalid" };

  try {
    const supabase = await createClient();
    // Supabase sends confirmation links; the change applies once confirmed.
    const { error } = await supabase.auth.updateUser(
      { email: parsed.data.email },
      { emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/settings` },
    );
    if (error) {
      if (error.code === "email_exists" || error.message.includes("already")) {
        return { errorKey: "emailTaken" };
      }
      return { errorKey: "generic" };
    }
  } catch (e) {
    console.error("changeEmail failed", e);
    return { errorKey: "generic" };
  }

  return { infoKey: "emailChangeSent" };
}

export async function changePassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const ctx = await getSellerContext();
  if (!ctx?.user.email) return { errorKey: "generic" };

  const parsed = z
    .object({ current: z.string().min(1), password: z.string().min(8) })
    .safeParse({
      current: formData.get("current"),
      password: formData.get("password"),
    });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      errorKey: issue.path[0] === "current" ? "wrongPassword" : "passwordTooShort",
    };
  }

  try {
    const supabase = await createClient();
    // Re-authenticate with the current password before allowing a change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: ctx.user.email,
      password: parsed.data.current,
    });
    if (reauthError) return { errorKey: "wrongPassword" };

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { errorKey: "generic" };
  } catch (e) {
    console.error("changePassword failed", e);
    return { errorKey: "generic" };
  }

  return { infoKey: "passwordChanged" };
}
