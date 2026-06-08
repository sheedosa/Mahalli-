"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugRe } from "@/lib/slug";

export type OnboardingState = {
  errorKey?: "slugTaken" | "slugInvalid" | "generic";
};

const shopSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().toLowerCase().regex(slugRe),
  city: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  lang: z.enum(["ar", "en"]).default("ar"),
});

export async function createShop(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    city: formData.get("city") || undefined,
    phone: formData.get("phone") || undefined,
    lang: formData.get("lang") || "ar",
  });

  if (!parsed.success) {
    const badSlug = parsed.error.issues.some((i) => i.path[0] === "slug");
    return { errorKey: badSlug ? "slugInvalid" : "generic" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_shop", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_city: parsed.data.city,
    p_contact_phone: parsed.data.phone,
    p_lang: parsed.data.lang,
  });

  if (error) {
    // Custom SQLSTATEs raised by create_shop (see migration 0003).
    if (error.code === "P0002") return { errorKey: "slugTaken" };
    if (error.code === "P0003") return { errorKey: "slugInvalid" };
    return { errorKey: "generic" };
  }

  redirect("/dashboard");
}
