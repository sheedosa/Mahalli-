"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, X } from "lucide-react";
import { createShop, type OnboardingState } from "@/app/onboarding/actions";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { locales } from "@/i18n/config";
import { slugRe, slugify } from "@/lib/slug";

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

function CreateBtn({ label, pendingLabel, disabled }: { label: string; pendingLabel: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-accent btn-pill" disabled={pending || disabled}>
      {pending && <Loader2 className="size-5 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ShopForm() {
  const { dict, locale } = useI18n();
  const t = dict.onboarding;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");

  const [state, formAction] = useActionState<OnboardingState, FormData>(createShop, {});

  function applySlug(next: string) {
    setSlug(next);
    if (next.length === 0) setSlugState("idle");
    else if (!slugRe.test(next)) setSlugState("invalid");
    else setSlugState("checking");
  }

  useEffect(() => {
    if (slug.length === 0 || !slugRe.test(slug)) return;
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_slug_available", { p_slug: slug });
      setSlugState(error ? "idle" : data ? "available" : "taken");
    }, 400);
    return () => clearTimeout(handle);
  }, [slug]);

  const serverError =
    state.errorKey === "slugTaken"
      ? t.slugTaken
      : state.errorKey === "slugInvalid"
        ? t.slugInvalid
        : state.errorKey === "generic"
          ? t.errorGeneric
          : undefined;

  const slugHint =
    slugState === "checking" ? t.slugChecking : slugState === "available" ? t.slugAvailable : t.slugHint;
  const slugError =
    slugState === "taken" ? t.slugTaken : slugState === "invalid" ? t.slugInvalid : serverError;

  return (
    <form action={formAction} className="sf-stack" style={{ gap: 16 }} noValidate>
      <div className="field">
        <label className="label">{t.shopName}</label>
        <input
          className="input"
          name="name"
          required
          maxLength={120}
          placeholder={t.shopNamePlaceholder}
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            if (!slugTouched) applySlug(slugify(v));
          }}
        />
      </div>

      <div className="field">
        <label className="label">{t.slug}</label>
        <div style={{ position: "relative" }}>
          <input
            className={`input${slugState === "taken" || slugState === "invalid" ? " err" : ""}`}
            name="slug"
            required
            dir="ltr"
            inputMode="url"
            autoCapitalize="none"
            placeholder="layla-boutique"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              applySlug(e.target.value.toLowerCase());
            }}
            style={{ paddingInlineEnd: 40 }}
          />
          <span style={{ position: "absolute", insetInlineEnd: 12, top: "50%", transform: "translateY(-50%)" }}>
            {slugState === "checking" && <Loader2 className="size-4 animate-spin" style={{ color: "var(--z400)" }} />}
            {slugState === "available" && <Check className="size-4" style={{ color: "var(--success)" }} />}
            {(slugState === "taken" || slugState === "invalid") && <X className="size-4" style={{ color: "var(--danger)" }} />}
          </span>
        </div>
        {slugError ? <span className="errline">{slugError}</span> : <span className="hint">{slugHint}</span>}
      </div>

      <div className="field">
        <label className="label">{t.city} <span className="muted">· {dict.common.optional}</span></label>
        <input className="input" name="city" maxLength={80} placeholder={t.cityPlaceholder} />
      </div>

      <div className="field">
        <label className="label">{t.phone} <span className="muted">· {dict.common.optional}</span></label>
        <input className="input" name="phone" type="tel" inputMode="tel" dir="ltr" maxLength={40} placeholder={t.phonePlaceholder} />
      </div>

      <div className="field">
        <label className="label">{t.language}</label>
        <div className="sf-row" style={{ gap: 8 }}>
          {locales.map((l) => (
            <label key={l} className={`chip${l === locale ? " active" : ""}`} style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}>
              <input type="radio" name="lang" value={l} defaultChecked={l === locale} style={{ display: "none" }} />
              {dict.lang[l]}
            </label>
          ))}
        </div>
      </div>

      <CreateBtn label={t.createCta} pendingLabel={t.creating} disabled={slugState === "taken"} />
    </form>
  );
}
