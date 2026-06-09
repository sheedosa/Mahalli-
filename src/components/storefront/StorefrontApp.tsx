"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronLeft,
  Heart,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import type {
  StorefrontProduct,
  StorefrontShop,
  StorefrontVariant,
} from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ProductSheet } from "@/components/storefront/ProductSheet";
import { CheckoutView } from "@/components/storefront/CheckoutView";
import {
  availableStock,
  cartCount,
  cartSubtotal,
  lineKey,
  unitPrice,
  type CartLine,
} from "@/components/storefront/cart";
import { themeClass } from "@/lib/themes";
import { useToast } from "@/components/ui/Toast";
import { waMeLink } from "@/lib/messaging/walink";

type View = "catalog" | "checkout" | "done";

function totalStock(p: StorefrontProduct): number {
  return p.variants.length > 0
    ? p.variants.reduce((s, v) => s + v.stock, 0)
    : p.stock;
}

export function StorefrontApp({
  shop,
  products,
  slug,
}: {
  shop: StorefrontShop;
  products: StorefrontProduct[];
  slug: string;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;
  const toast = useToast();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [view, setView] = useState<View>("catalog");
  const [sheet, setSheet] = useState<StorefrontProduct | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const cartKey = `mahalli_cart_${slug}`;
  const favKey = `mahalli_fav_${slug}`;

  // Restore cart + favorites from the previous session (client-only). The cart is
  // stored as minimal refs and rebuilt against the current catalog so prices and
  // stock stay fresh and unavailable items drop out.
  useEffect(() => {
    let nextFavs: Set<string> | null = null;
    let nextLines: CartLine[] | null = null;
    try {
      const rawF = localStorage.getItem(favKey);
      if (rawF) nextFavs = new Set(JSON.parse(rawF) as string[]);
      const rawC = localStorage.getItem(cartKey);
      if (rawC) {
        const refs = JSON.parse(rawC) as { pid: string; vid: string | null; qty: number }[];
        const restored: CartLine[] = [];
        for (const r of refs) {
          const product = products.find((p) => p.id === r.pid);
          if (!product) continue;
          const variant = r.vid ? (product.variants.find((v) => v.id === r.vid) ?? null) : null;
          if (r.vid && !variant) continue;
          const qty = Math.min(availableStock(product, variant), r.qty);
          if (qty > 0) restored.push({ key: lineKey(product.id, variant?.id ?? null), product, variant, qty });
        }
        if (restored.length) nextLines = restored;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nextFavs) setFavs(nextFavs);
    if (nextLines) setLines(nextLines);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(lines.map((l) => ({ pid: l.product.id, vid: l.variant?.id ?? null, qty: l.qty }))));
    } catch {}
  }, [lines, cartKey]);

  useEffect(() => {
    try {
      localStorage.setItem(favKey, JSON.stringify([...favs]));
    } catch {}
  }, [favs, favKey]);

  function addLine(
    product: StorefrontProduct,
    variant: StorefrontVariant | null,
    qty: number,
  ) {
    const key = lineKey(product.id, variant?.id ?? null);
    const max = availableStock(product, variant);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, qty: Math.min(max, l.qty + qty) } : l,
        );
      }
      return [...prev, { key, product, variant, qty: Math.min(max, qty) }];
    });
    setSheet(null);
    toast.success(t.addedToCart);
  }

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => {
            if (l.key !== key) return l;
            return { ...l, qty: Math.min(availableStock(l.product, l.variant), qty) };
          }),
    );
  }

  function toggleFav(id: string) {
    setFavs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function onSuccess(orderRef: string) {
    setRef(orderRef);
    setLines([]);
    setView("done");
  }

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((p) => p.category).filter(Boolean) as string[]),
      ),
    [products],
  );

  const list = useMemo(() => {
    let l = cat === "all" ? products : products.filter((p) => p.category === cat);
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((p) => p.name.toLowerCase().includes(s));
    return l;
  }, [products, cat, q]);

  // ---- success ----
  if (view === "done") {
    return (
      <main className={`${themeClass(shop.theme)} sf`}>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <div
            className="flex items-center justify-center"
            style={{ width: 104, height: 104, borderRadius: "50%", background: "var(--success)", color: "#fff", boxShadow: "0 14px 34px rgba(16,185,129,.4)" }}
          >
            <CheckCircle2 className="size-14" strokeWidth={2.4} />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{t.orderPlacedTitle}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, lineHeight: 1.7, maxWidth: 280 }}>
            {t.orderPlacedBody}
          </p>
          {ref && (
            <p dir="ltr" className="price" style={{ background: "var(--z100)", padding: "8px 16px", borderRadius: 999, fontSize: 18 }}>
              #{ref}
            </p>
          )}
          <button
            className="btn btn-primary btn-pill"
            onClick={() => setView("catalog")}
            style={{ width: "auto", paddingInline: 28, marginTop: 4 }}
          >
            {t.orderAgain}
          </button>
        </div>
      </main>
    );
  }

  // ---- checkout ----
  if (view === "checkout") {
    return (
      <main className={`${themeClass(shop.theme)} sf`}>
        <div className="mx-auto max-w-md">
          <CheckoutView
            slug={slug}
            shop={shop}
            lines={lines}
            onSetQty={setQty}
            onRemove={(key) => setQty(key, 0)}
            onBack={() => setView("catalog")}
            onSuccess={onSuccess}
          />
        </div>
      </main>
    );
  }

  // ---- catalog ----
  const count = cartCount(lines);

  return (
    <main className={`${themeClass(shop.theme)} sf`}>
      <div className="anim-in mx-auto max-w-md" style={{ position: "relative", paddingBottom: 120 }}>
        {/* glass top bar */}
        <div className="topbar">
          <div className="sf-stack" style={{ flex: 1, minWidth: 0 }}>
            {shop.city && (
              <span style={{ fontSize: 12, color: "var(--z500)", fontWeight: 600 }}>
                {shop.city}
              </span>
            )}
            <span className="topbar-title sf-row" style={{ gap: 6 }}>
              <Store className="size-[18px]" style={{ flex: "none" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.name}</span>
            </span>
          </div>
          <LocaleSwitcher />
        </div>

        {/* search */}
        <div style={{ padding: "12px 18px 4px" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", insetInlineStart: 15, top: "50%", transform: "translateY(-50%)", color: "var(--z400)" }}>
              <Search className="size-[18px]" />
            </span>
            <input
              className="input"
              style={{ paddingInlineStart: 44, height: 48, borderRadius: 999 }}
              placeholder={t.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t.searchPlaceholder}
            />
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: "10px 18px 0" }}>
          <div
            style={{
              borderRadius: 30,
              background: "var(--hero-grad)",
              padding: 22,
              position: "relative",
              overflow: "hidden",
              minHeight: 168,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ position: "absolute", insetInlineEnd: -30, insetBlockStart: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.12)" }} />
            <div style={{ position: "relative", maxWidth: shop.logo_url ? "62%" : "100%" }}>
              <h1 style={{ margin: 0, color: "var(--hero-ink)", fontSize: 26, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-.01em" }}>
                {shop.name}
              </h1>
            </div>
            <button
              onClick={() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                position: "relative",
                alignSelf: "flex-start",
                marginTop: 14,
                background: "var(--hero-btn-bg)",
                color: "var(--hero-btn-ink)",
                border: "none",
                height: 44,
                paddingInline: 20,
                borderRadius: 999,
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              {t.shopNow}
              <ChevronLeft className="size-4 flip-x" />
            </button>
            {shop.logo_url && (
              <div style={{ position: "absolute", insetInlineEnd: 16, insetBlockEnd: -20, width: 110, height: 130, borderRadius: 22, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>
                <Image src={shop.logo_url} alt="" fill sizes="110px" className="object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* trust + contact */}
        <div className="sf-row" style={{ gap: 8, flexWrap: "wrap", padding: "14px 18px 0" }}>
          {shop.contact_phone && (
            <a
              href={waMeLink(shop.contact_phone, t.waOrderPrefill.replace("{shop}", shop.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-row"
              style={{ gap: 7, height: 36, paddingInline: 13, borderRadius: 999, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12.5, textDecoration: "none" }}
            >
              <MessageCircle className="size-4" /> {t.orderOnWhatsApp}
            </a>
          )}
          <span className="pill pill-neutral"><Wallet className="size-3.5" /> {t.cod}</span>
          {shop.delivery_areas.length > 0 && (
            <span className="pill pill-neutral"><Truck className="size-3.5" /> {t.deliveryAvailable}</span>
          )}
        </div>

        {/* category chips */}
        {categories.length > 0 && (
          <div className="chiprow" style={{ marginTop: 18 }}>
            <button className={`chip${cat === "all" ? " active" : ""}`} onClick={() => setCat("all")}>
              {t.all}
            </button>
            {categories.map((c) => (
              <button key={c} className={`chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* product grid */}
        <div ref={gridRef} style={{ padding: "22px 18px 0", scrollMarginTop: 70 }}>
          {list.length === 0 ? (
            <div className="empty">
              <div className="empty-art"><Package className="size-9" /></div>
              <div className="sf-stack" style={{ gap: 6 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  {q ? t.noResults : dict.products.emptyTitle}
                </h3>
              </div>
            </div>
          ) : (
            <div className="sf-grid2">
              {list.map((p) => {
                const stock = totalStock(p);
                const fav = favs.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="pcard"
                    role="button"
                    tabIndex={0}
                    onClick={() => stock > 0 && setSheet(p)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && stock > 0) setSheet(p);
                    }}
                  >
                    <div className="pcard-media">
                      {p.image_url ? (
                        <Image src={p.image_url} alt="" fill sizes="(max-width: 480px) 50vw, 224px" className="object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center" style={{ color: "var(--z400)" }}>
                          <Package className="size-7" />
                        </span>
                      )}
                      <div className="pcard-fav">
                        <button
                          className="iconbtn"
                          aria-label="favorite"
                          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
                          style={fav ? { background: "#fff", color: "var(--danger)" } : undefined}
                        >
                          <Heart className="size-[17px]" fill={fav ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div className="pcard-badge">
                        {stock <= 0 ? (
                          <span className="pill pill-dark">{t.outOfStock}</span>
                        ) : stock <= 3 ? (
                          <span className="pill pill-warning">{dict.products.lowStock}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="pcard-body">
                      <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: "2.7em" }}>
                        {p.name}
                      </span>
                      <span className="price">{formatPrice(unitPrice(p, null), locale)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: 26, fontSize: 11.5 }}>
          {t.poweredBy}
        </p>
      </div>

      {/* floating cart */}
      {count > 0 && (
        <button className="fab" onClick={() => setView("checkout")}>
          <ShoppingBag className="size-5" />
          <span>{t.viewCart}</span>
          <span className="count">{count}</span>
          <span style={{ fontWeight: 800 }}>{formatPrice(cartSubtotal(lines), locale)}</span>
        </button>
      )}

      {sheet && (
        <ProductSheet
          product={sheet}
          onClose={() => setSheet(null)}
          onAdd={(variant, qty) => addLine(sheet, variant, qty)}
        />
      )}
    </main>
  );
}
