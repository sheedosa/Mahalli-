"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export type AuthState = {
  errorKey?:
    | "invalidCredentials"
    | "emailTaken"
    | "passwordTooShort"
    | "emailInvalid"
    | "generic";
  infoKey?: "checkEmail";
};

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

function safeNext(next: string | undefined): string {
  // Only allow internal, absolute-path redirects (prevent open redirect).
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { errorKey: issue.path[0] === "email" ? "emailInvalid" : "passwordTooShort" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { errorKey: "invalidCredentials" };

  redirect(safeNext(parsed.data.next));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { errorKey: issue.path[0] === "email" ? "emailInvalid" : "passwordTooShort" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${publicEnv.siteUrl}/auth/callback` },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.message.includes("already")) {
      return { errorKey: "emailTaken" };
    }
    return { errorKey: "generic" };
  }

  // If email confirmation is required there is no session yet.
  if (!data.session) return { infoKey: "checkEmail" };

  // New seller with an active session → go set up their shop.
  redirect("/onboarding");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
