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

  let failed = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return { errorKey: "invalidCredentials" };
  } catch (e) {
    // e.g. missing Supabase env vars — surface inline, don't 500.
    console.error("signIn failed", e);
    failed = true;
  }
  if (failed) return { errorKey: "generic" };

  redirect(safeNext(parsed.data.next)); // must be outside try (redirect throws)
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

  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      // Only pin a redirect if a real site URL is configured; otherwise
      // Supabase uses the Site URL from its dashboard.
      options: publicEnv.configuredSiteUrl
        ? { emailRedirectTo: `${publicEnv.configuredSiteUrl}/auth/callback` }
        : undefined,
    });

    if (error) {
      if (error.code === "user_already_exists" || error.message.includes("already")) {
        return { errorKey: "emailTaken" };
      }
      return { errorKey: "generic" };
    }

    // If email confirmation is required there is no session yet.
    if (!data.session) return { infoKey: "checkEmail" };
    hasSession = true;
  } catch (e) {
    // e.g. missing Supabase env vars — surface inline, don't 500.
    console.error("signUp failed", e);
    return { errorKey: "generic" };
  }

  // New seller with an active session → go set up their shop.
  if (hasSession) redirect("/onboarding"); // outside try (redirect throws)
  return {};
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ResetRequestState = {
  errorKey?: "emailInvalid" | "generic";
  infoKey?: "resetSent";
};

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = z.object({ email: z.string().email() }).safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { errorKey: "emailInvalid" };

  try {
    const supabase = await createClient();
    // After the email link is exchanged by /auth/callback the user lands on
    // /reset-password with a recovery session.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password`,
    });
  } catch (e) {
    console.error("requestPasswordReset failed", e);
    return { errorKey: "generic" };
  }

  // Always claim success so account existence can't be probed.
  return { infoKey: "resetSent" };
}

export type ResetPasswordState = {
  errorKey?: "passwordTooShort" | "generic";
  infoKey?: "resetDone";
};

export async function updatePassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = z.object({ password: z.string().min(8) }).safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) return { errorKey: "passwordTooShort" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { errorKey: "generic" };
  } catch (e) {
    console.error("updatePassword failed", e);
    return { errorKey: "generic" };
  }

  return { infoKey: "resetDone" };
}
