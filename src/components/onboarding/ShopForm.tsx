"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { createShop, type OnboardingState } from "@/app/onboarding/actions";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";
import { Input, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { locales } from "@/i18n/config";

const slugRe = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/** Best-effort slug from a (Latin) shop name; Arabic names are typed manually. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

type SlugState = "idle" | "checking" | "available" | "taken" | "invalid";

export function ShopForm() {
  const { dict, locale } = useI18n();
  const t = dict.onboarding;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");

  const [state, formAction] = useActionState<OnboardingState, FormData>(
    createShop,
    {},
  );

  // Apply a new slug value and set its immediate (synchronous) state. The
  // async availability check then runs in the effect below. Updating state in
  // the event handler — not an effect — avoids cascading re-renders.
  function applySlug(next: string) {
    setSlug(next);
    if (next.length === 0) setSlugState("idle");
    else if (!slugRe.test(next)) setSlugState("invalid");
    else setSlugState("checking");
  }

  // Debounced availability check against the is_slug_available RPC. Only the
  // async result is written to state, inside the timeout callback.
  useEffect(() => {
    if (slug.length === 0 || !slugRe.test(slug)) return;
    const supabase = createClient();
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_slug_available", {
        p_slug: slug,
      });
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
    slugState === "checking"
      ? t.slugChecking
      : slugState === "available"
        ? t.slugAvailable
        : t.slugHint;

  const slugError =
    slugState === "taken" ? t.slugTaken : slugState === "invalid" ? t.slugInvalid : serverError;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Field label={t.shopName} htmlFor="name">
        <Input
          id="name"
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
      </Field>

      <Field label={t.slug} htmlFor="slug" hint={slugHint} error={slugError}>
        <div className="relative">
          <Input
            id="slug"
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
            className="pe-10"
          />
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
            {slugState === "checking" && (
              <Loader2 className="size-4 animate-spin text-zinc-400" />
            )}
            {slugState === "available" && (
              <Check className="size-4 text-emerald-600" />
            )}
            {(slugState === "taken" || slugState === "invalid") && (
              <X className="size-4 text-red-500" />
            )}
          </span>
        </div>
      </Field>

      <Field label={t.city} htmlFor="city" optional={dict.common.optional}>
        <Input id="city" name="city" maxLength={80} placeholder={t.cityPlaceholder} />
      </Field>

      <Field label={t.phone} htmlFor="phone" optional={dict.common.optional}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          maxLength={40}
          placeholder={t.phonePlaceholder}
        />
      </Field>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-zinc-700">
          {t.language}
        </legend>
        <div className="flex gap-2">
          {locales.map((l) => (
            <label
              key={l}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="lang"
                value={l}
                defaultChecked={l === locale}
                className="sr-only"
              />
              {dict.lang[l]}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton size="lg" pendingLabel={t.creating} disabled={slugState === "taken"}>
        {t.createCta}
      </SubmitButton>
    </form>
  );
}
