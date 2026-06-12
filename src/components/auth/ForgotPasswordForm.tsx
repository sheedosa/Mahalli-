"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { requestPasswordReset, type ResetRequestState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useI18n } from "@/i18n/provider";

export function ForgotPasswordForm() {
  const { dict } = useI18n();
  const t = dict.auth;
  const [state, formAction] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    {},
  );

  const errorMsg =
    state.errorKey === "emailInvalid"
      ? t.emailInvalid
      : state.errorKey === "generic"
        ? dict.common.genericError
        : undefined;

  return (
    <div className="sf-stack" style={{ gap: 22 }}>
      <div className="sf-stack" style={{ gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, letterSpacing: "-.01em" }}>
          {t.forgotTitle}
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          {t.forgotSub}
        </p>
      </div>

      {state.infoKey === "resetSent" ? (
        <div
          className="sf-row"
          style={{ gap: 10, background: "var(--success-soft)", color: "#047857", padding: 16, borderRadius: 16, fontSize: 14, fontWeight: 600 }}
        >
          <Check className="size-5" /> {t.resetSent}
        </div>
      ) : (
        <form action={formAction} className="sf-stack" style={{ gap: 16 }} noValidate>
          <div className="field">
            <label className="label" htmlFor="email">{t.email}</label>
            <input
              className={`input${errorMsg ? " err" : ""}`}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              dir="ltr"
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "email-err" : undefined}
            />
            {errorMsg && <span className="errline" id="email-err">{errorMsg}</span>}
          </div>

          <SubmitButton className="btn btn-accent btn-pill" pendingLabel={dict.common.loading}>
            {t.forgotCta}
          </SubmitButton>
        </form>
      )}

      <p style={{ textAlign: "center", fontSize: 14 }}>
        <Link href="/login" style={{ fontWeight: 700, color: "var(--accent-deep)" }}>
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
