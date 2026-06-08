"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  ShoppingBag,
  Users,
  Settings,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutGrid, key: "overview" },
  { href: "/products", icon: Package, key: "products" },
  { href: "/orders", icon: ShoppingBag, key: "orders" },
  { href: "/customers", icon: Users, key: "customers" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map(({ href, icon: Icon, key }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-zinc-900" : "text-zinc-400",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {dict.nav[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
