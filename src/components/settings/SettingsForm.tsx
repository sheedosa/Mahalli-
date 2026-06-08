"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { updateShop, type SettingsState } from "@/app/(dashboard)/settings/actions";
import { useI18n } from "@/i18n/provider";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { locales } from "@/i18n/config";
import { THEMES, type ThemeId } from "@/lib/themes";

type Props = {
  initial: {
    name: string;
    city: string;
    phone: string;
    lang: string;
    slug: string;
    theme: string;
  };
};

/** A tiny live storefront preview rendered in the chosen theme. */
function MiniPreview({ id }: { id: ThemeId }) {
  return (
    <div
      className={`theme-${id}`}
      style={{ width: 64, height: 84, borderRadius: 12, background: "var(--surface)", boxShadow: "var(--shadow-sm)", overflow: "hidden", flex: "none", padding: 6, display: "flex", flexDirection: "column", gap: 4 }}
    >
      <div style={{ height: 22, borderRadius: 6, background: "var(--hero-grad)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, flex: 1 }}>
        <div style={{ background: "var(--card)", borderRadius: 5, boxShadow: "var(--shadow-sm)" }} />
        <div style={{ background: "var(--card)", borderRadius: 5, boxShadow: "var(--shadow-sm)" }} />
      </div>
      <div style={{ height: 10, borderRadius: 99, background: "var(--cta)" }} />
    </div>
  );
}

export function SettingsForm({ initial }: Props) {
  const { dict, locale } = useI18n();
  const t = dict.settings;
  const [theme, setTheme] = useState<ThemeId>(
    (THEMES.find((x) => x.id === initial.theme)?.id ?? "cream") as ThemeId,
  );
  const [state, formAction] = useActionState<SettingsState, FormData>(updateShop, {});

  return (
    <form action={formAction} className="anim-in" style={{ padding: "8px 18px 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <input type="hidden" name="theme" value={theme} />

      {/* shop info */}
      <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>{t.shopInfo}</h2>

        <div className="field">
          <label className="label">{t.shopName}</label>
          <input className="input" name="name" required defaultValue={initial.name} maxLength={120} />
        </div>

        <div className="field">
          <label className="label">{t.storefrontAddress}</label>
          <input className="input" dir="ltr" value={`mahalli.app/${initial.slug}`} readOnly style={{ background: "var(--z100)", color: "var(--z500)" }} />
        </div>

        <div className="field">
          <label className="label">{t.city} <span className="muted">· {dict.common.optional}</span></label>
          <input className="input" name="city" defaultValue={initial.city} maxLength={80} />
        </div>

        <div className="field">
          <label className="label">{t.phone} <span className="muted">· {dict.common.optional}</span></label>
          <input className="input" name="phone" type="tel" inputMode="tel" dir="ltr" defaultValue={initial.phone} maxLength={40} />
        </div>

        <div className="field">
          <label className="label">{t.language}</label>
          <div className="sf-row" style={{ gap: 8 }}>
            {locales.map((l) => (
              <label key={l} className={`chip${initial.lang === l ? " active" : ""}`} style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}>
                <input type="radio" name="lang" value={l} defaultChecked={l === initial.lang} style={{ display: "none" }} />
                {dict.lang[l]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* theme picker */}
      <div className="sf-stack" style={{ gap: 4 }}>
        <h2 style={{ margin: "0 2px", fontSize: 14, fontWeight: 800 }}>{t.theme}</h2>
        <p className="muted" style={{ margin: "0 2px 6px", fontSize: 12.5 }}>{t.themeHint}</p>
        <div className="sf-stack" style={{ gap: 11 }}>
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              className={`radiocard${theme === th.id ? " sel" : ""}`}
              onClick={() => setTheme(th.id)}
              style={{ gap: 14 }}
            >
              <MiniPreview id={th.id} />
              <div className="sf-stack" style={{ flex: 1, gap: 4, textAlign: "start" }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{th.name[locale]}</span>
                <span className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{th.tag[locale]}</span>
                <span className="sf-row" style={{ gap: 6, marginTop: 2 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 99, background: th.swatch }} />
                  <span style={{ width: 16, height: 16, borderRadius: 99, background: th.surface, boxShadow: "inset 0 0 0 1.5px var(--z200)" }} />
                </span>
              </div>
              <span className="radiodot" style={{ alignSelf: "flex-start" }} />
            </button>
          ))}
        </div>
      </div>

      <div className="sf-row" style={{ gap: 12 }}>
        <SubmitButton className="btn btn-primary btn-pill" pendingLabel={dict.common.saving}>
          {dict.common.save}
        </SubmitButton>
        {state.saved && (
          <span className="sf-row" style={{ gap: 5, color: "var(--success)", fontSize: 14, fontWeight: 700 }}>
            <Check className="size-4" /> {t.saved}
          </span>
        )}
        {state.error && <span style={{ color: "var(--danger)", fontSize: 14 }}>{dict.common.genericError}</span>}
      </div>
    </form>
  );
}
