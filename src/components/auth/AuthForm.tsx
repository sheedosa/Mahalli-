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
  const notice =
    searchParams.get("reason") === "expired"
      ? t.sessionExpired
      : searchParams.get("error") === "auth"
        ? t.linkInvalid
        : undefined;

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
      <div className="sf-stack" style={{ gap: 6 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: "-.025em" }}>
          {mode === "signin" ? t.signInTitle : t.signUpTitle}
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          {mode === "signin" ? t.signInSub : t.signUpSub}
        </p>
      </div>

      {notice && (
        <div
          role="status"
          style={{ background: "var(--warning-soft)", color: "#b45309", padding: "12px 16px", borderRadius: 14, fontSize: 13.5, fontWeight: 600 }}
        >
          {notice}
        </div>
      )}

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
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "auth-err" : undefined}
            />
            {errorMsg && <span className="errline" id="auth-err">{errorMsg}</span>}
          </div>

          {mode === "signin" && (
            <p style={{ margin: "-6px 0 0", textAlign: "end", fontSize: 13 }}>
              <Link href="/forgot-password" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
                {t.forgotPassword}
              </Link>
            </p>
          )}

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
