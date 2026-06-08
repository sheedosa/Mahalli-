"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { useI18n } from "@/i18n/provider";
import { Input, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const { dict } = useI18n();
  const t = dict.auth;
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  const errorMsg =
    state.errorKey === "generic"
      ? dict.common.genericError
      : state.errorKey === "invalidCredentials"
        ? t.invalidCredentials
        : state.errorKey === "emailTaken"
          ? t.emailTaken
          : state.errorKey === "emailInvalid"
            ? t.emailInvalid
            : state.errorKey === "passwordTooShort"
              ? t.passwordTooShort
              : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">
        {mode === "signin" ? t.signInTitle : t.signUpTitle}
      </h1>

      {state.infoKey === "checkEmail" ? (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          {t.checkEmail}
        </p>
      ) : (
        <form action={formAction} className="space-y-4" noValidate>
          {next && <input type="hidden" name="next" value={next} />}

          <Field label={t.email} htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              dir="ltr"
            />
          </Field>

          <Field label={t.password} htmlFor="password" error={errorMsg}>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              dir="ltr"
            />
          </Field>

          <SubmitButton size="lg">
            {mode === "signin" ? t.signInCta : t.signUpCta}
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-sm text-zinc-500">
        {mode === "signin" ? (
          <>
            {t.noAccount}{" "}
            <Link href="/signup" className="font-medium text-zinc-900 underline">
              {t.goSignUp}
            </Link>
          </>
        ) : (
          <>
            {t.haveAccount}{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline">
              {t.goSignIn}
            </Link>
          </>
        )}
      </p>

      <p className="text-center text-xs text-zinc-400">{t.phoneSoon}</p>
    </div>
  );
}
