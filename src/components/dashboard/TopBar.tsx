"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { useI18n } from "@/i18n/provider";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export function TopBar({ shopName }: { shopName: string }) {
  const { dict } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        <span className="truncate text-base font-bold text-zinc-900">
          {shopName}
        </span>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <form action={signOut}>
            <button
              type="submit"
              aria-label={dict.nav.logout}
              title={dict.nav.logout}
              className="flex size-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <LogOut className="size-4 flip-x" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
