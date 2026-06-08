"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Link2,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";

const items = [
  { href: "/dashboard", icon: LayoutGrid, key: "overview" },
  { href: "/products", icon: Package, key: "products" },
  { href: "/orders", icon: ShoppingBag, key: "orders" },
  { href: "/customers", icon: Users, key: "customers" },
  { href: "/link", icon: Link2, key: "link" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useI18n();

  return (
    <div className="navwrap">
      <nav className="bottomnav">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label =
            key === "link" ? dict.nav.link : dict.nav[key as "overview"];
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`navitem${active ? " active" : ""}`}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
              {active && <span className="dot" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
