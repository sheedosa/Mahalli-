"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { updatePassword, type ResetPasswordState } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useI18n } from "@/i18n/provider";

export function ResetPasswordForm() {
  const { dict } = useI18n();
  const t = dict.auth;
  const [state, formAction] = useActionState<ResetPasswordState, FormData>(
    updatePassword,
    {},
  );

  const errorMsg =
    state.errorKey === "passwordTooShort"
      ? t.passwordTooShort
      : state.errorKey === "generic"
        ? dict.common.genericError
        : undefined;

  return (
    <div className="sf-stack" style={{ gap: 22 }}>
      <div className="sf-stack" style={{ gap: 6 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 27, fontWeight: 800, letterSpacing: "-.025em" }}>
          {t.resetTitle}
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          {t.resetSub}
        </p>
      </div>

      {state.infoKey === "resetDone" ? (
        <div className="sf-stack" style={{ gap: 16 }}>
          <div
            className="sf-row"
            style={{ gap: 10, background: "var(--success-soft)", color: "#047857", padding: 16, borderRadius: 16, fontSize: 14, fontWeight: 600 }}
          >
            <Check className="size-5" /> {t.resetDone}
          </div>
          <Link href="/dashboard" className="btn btn-accent btn-pill">
            {t.goDashboard}
          </Link>
        </div>
      ) : (
        <form action={formAction} className="sf-stack" style={{ gap: 16 }} noValidate>
          <div className="field">
            <label className="label" htmlFor="password">{t.newPassword}</label>
            <input
              className={`input${errorMsg ? " err" : ""}`}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              dir="ltr"
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "password-err" : undefined}
            />
            {errorMsg && <span className="errline" id="password-err">{errorMsg}</span>}
          </div>

          <SubmitButton className="btn btn-accent btn-pill" pendingLabel={dict.common.saving}>
            {t.resetCta}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
