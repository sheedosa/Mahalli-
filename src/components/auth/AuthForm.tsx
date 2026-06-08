"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { useI18n } from "@/i18n/provider";

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
    <div className="sf-stack" style={{ gap: 22 }}>
      <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-.01em" }}>
        {mode === "signin" ? t.signInTitle : t.signUpTitle}
      </h1>

      {state.infoKey === "checkEmail" ? (
        <div
          className="sf-row"
          style={{ gap: 10, background: "var(--success-soft)", color: "#047857", padding: 16, borderRadius: 16, fontSize: 14, fontWeight: 600 }}
        >
          <Check className="size-5" /> {t.checkEmail}
        </div>
      ) : (
        <form action={formAction} className="sf-stack" style={{ gap: 16 }} noValidate>
          {next && <input type="hidden" name="next" value={next} />}

          <div className="field">
            <label className="label" htmlFor="email">{t.email}</label>
            <input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" required dir="ltr" />
          </div>

          <div className="field">
            <label className="label" htmlFor="password">{t.password}</label>
            <input
              className={`input${errorMsg ? " err" : ""}`}
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              dir="ltr"
            />
            {errorMsg && <span className="errline">{errorMsg}</span>}
          </div>

          <SubmitBtn label={mode === "signin" ? t.signInCta : t.signUpCta} />
        </form>
      )}

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--z500)" }}>
        {mode === "signin" ? (
          <>
            {t.noAccount}{" "}
            <Link href="/signup" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
              {t.goSignUp}
            </Link>
          </>
        ) : (
          <>
            {t.haveAccount}{" "}
            <Link href="/login" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
              {t.goSignIn}
            </Link>
          </>
        )}
      </p>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--z400)" }}>{t.phoneSoon}</p>
    </div>
  );
}

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-accent btn-pill" disabled={pending}>
      {pending && <Loader2 className="size-5 animate-spin" />}
      {label}
    </button>
  );
}
