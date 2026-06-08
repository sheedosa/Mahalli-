"use client";

import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useI18n } from "@/i18n/provider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function TopBar({
  shopName,
  slug,
}: {
  shopName: string;
  slug: string;
}) {
  const { dict } = useI18n();
  return (
    <div className="topbar">
      <div className="sf-stack" style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "var(--z500)", fontWeight: 600 }}>
          {dict.dashboard.greeting}
        </span>
        <span
          className="topbar-title"
          style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {shopName}
        </span>
      </div>
      <a
        href={`/${slug}`}
        target="_blank"
        aria-label={dict.nav.viewStorefront}
        title={dict.nav.viewStorefront}
        className="iconbtn"
      >
        <ExternalLink className="size-[18px]" />
      </a>
      <LocaleSwitcher />
      <form action={signOut}>
        <button
          type="submit"
          aria-label={dict.nav.logout}
          title={dict.nav.logout}
          className="iconbtn"
          style={{ boxShadow: "none", background: "var(--z100)", color: "var(--z600)" }}
        >
          <LogOut className="size-4 flip-x" />
        </button>
      </form>
    </div>
  );
}
