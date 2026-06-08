import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/database.types";

export type SellerContext = {
  user: User;
  seller: Tables<"sellers">;
  role: Enums<"profile_role">;
};

/** The authenticated user, or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolve the signed-in user's tenant (seller) and role in a single round-trip.
 * Returns null if there is no user, or the user has no shop yet (needs
 * onboarding). RLS guarantees the joined seller is one the user belongs to.
 */
export const getSellerContext = cache(async (): Promise<SellerContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, sellers(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.sellers) return null;

  return {
    user,
    seller: data.sellers as Tables<"sellers">,
    role: data.role,
  };
});
