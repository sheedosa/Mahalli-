"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeEmail, changePassword, type AccountState } from "@/app/(dashboard)/settings/actions";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/ui/Toast";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Sign-in credentials management: change email (confirmed by link) and
 *  change password (re-authenticated with the current one). */
export function AccountCard({ email }: { email: string }) {
  const { dict } = useI18n();
  const t = dict.settings;
  const ta = dict.auth;
  const toast = useToast();

  const [emailState, emailAction] = useActionState<AccountState, FormData>(changeEmail, {});
  const [pwState, pwAction] = useActionState<AccountState, FormData>(changePassword, {});
  const pwFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (emailState.infoKey === "emailChangeSent") toast.success(t.emailChangeSent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailState]);

  useEffect(() => {
    if (pwState.infoKey === "passwordChanged") {
      toast.success(t.passwordChanged);
      pwFormRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwState]);

  const emailError =
    emailState.errorKey === "emailInvalid"
      ? ta.emailInvalid
      : emailState.errorKey === "emailTaken"
        ? ta.emailTaken
        : emailState.errorKey
          ? dict.common.genericError
          : undefined;

  const pwError =
    pwState.errorKey === "wrongPassword"
      ? t.wrongPassword
      : pwState.errorKey === "passwordTooShort"
        ? ta.passwordTooShort
        : pwState.errorKey
          ? dict.common.genericError
          : undefined;

  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="sf-stack" style={{ gap: 2 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{t.account}</h2>
        <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{t.accountHint}</p>
      </div>

      {/* change email */}
      <form action={emailAction} className="sf-stack" style={{ gap: 12 }} noValidate>
        <div className="field">
          <label className="label" htmlFor="account-email">{t.newEmail}</label>
          <input
            className={`input${emailError ? " err" : ""}`}
            id="account-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            dir="ltr"
            placeholder={email}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "account-email-err" : undefined}
          />
          {emailError && <span className="errline" id="account-email-err">{emailError}</span>}
          <span className="hint">{t.changeEmailHint}</span>
        </div>
        <SubmitButton className="btn btn-outline btn-pill" style={{ height: 44 }} pendingLabel={dict.common.saving}>
          {t.changeEmail}
        </SubmitButton>
      </form>

      <div className="divider" />

      {/* change password */}
      <form ref={pwFormRef} action={pwAction} className="sf-stack" style={{ gap: 12 }} noValidate>
        <div className="field">
          <label className="label" htmlFor="account-current">{t.currentPassword}</label>
          <input
            className="input"
            id="account-current"
            name="current"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="account-new">{ta.newPassword}</label>
          <input
            className={`input${pwError ? " err" : ""}`}
            id="account-new"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
            aria-invalid={pwError ? true : undefined}
            aria-describedby={pwError ? "account-pw-err" : undefined}
          />
          {pwError && <span className="errline" id="account-pw-err">{pwError}</span>}
        </div>
        <SubmitButton className="btn btn-outline btn-pill" style={{ height: 44 }} pendingLabel={dict.common.saving}>
          {t.changePassword}
        </SubmitButton>
      </form>
    </div>
  );
}
