"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateShop, type SettingsState } from "@/app/(dashboard)/settings/actions";
import { useI18n } from "@/i18n/provider";
import { Input, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card } from "@/components/ui/Card";
import { locales } from "@/i18n/config";

type Props = {
  initial: { name: string; city: string; phone: string; lang: string; slug: string };
};

export function SettingsForm({ initial }: Props) {
  const { dict } = useI18n();
  const t = dict.settings;
  const [state, formAction] = useActionState<SettingsState, FormData>(
    updateShop,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">{t.shopInfo}</h2>

        <Field label={t.shopName} htmlFor="name">
          <Input id="name" name="name" required defaultValue={initial.name} maxLength={120} />
        </Field>

        <Field label={t.storefrontAddress} htmlFor="slug">
          <Input
            id="slug"
            dir="ltr"
            value={`mahalli.app/${initial.slug}`}
            readOnly
            className="bg-zinc-50 text-zinc-500"
          />
        </Field>

        <Field label={t.city} htmlFor="city" optional={dict.common.optional}>
          <Input id="city" name="city" defaultValue={initial.city} maxLength={80} />
        </Field>

        <Field label={t.phone} htmlFor="phone" optional={dict.common.optional}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            defaultValue={initial.phone}
            maxLength={40}
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
                  defaultChecked={l === initial.lang}
                  className="sr-only"
                />
                {dict.lang[l]}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton className="w-auto px-6" pendingLabel={dict.common.saving}>
          {dict.common.save}
        </SubmitButton>
        {state.saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" /> {t.saved}
          </span>
        )}
        {state.error && (
          <span className="text-sm text-red-600">{dict.common.genericError}</span>
        )}
      </div>
    </form>
  );
}
