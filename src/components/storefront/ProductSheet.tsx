"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";
import { useI18n } from "@/i18n/provider";
import { formatPrice } from "@/lib/utils";
import { availableStock, unitPrice } from "@/components/storefront/cart";

export function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
  product: StorefrontProduct;
  onClose: () => void;
  onAdd: (variant: StorefrontVariant | null, qty: number) => void;
}) {
  const { dict, locale } = useI18n();
  const t = dict.storefront;
  const hasVariants = product.variants.length > 0;

  const [variant, setVariant] = useState<StorefrontVariant | null>(
    hasVariants
      ? (product.variants.find((v) => v.stock > 0) ?? product.variants[0])
      : null,
  );
  const [qty, setQty] = useState(1);

  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock the catalog behind the sheet so it doesn't scroll while the sheet is
  // open, and move focus into the dialog for keyboard/screen-reader users.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes; Tab is trapped within the sheet.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const stock = availableStock(product, variant);
  const price = unitPrice(product, variant);
  const canAdd = stock > 0 && (!hasVariants || variant !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
    >
      <button
        aria-label={dict.common.cancel}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="sheet pop-in relative mx-auto w-full max-w-md"
        style={{ outline: "none",
          maxHeight: "88dvh",
          overflowY: "auto",
          padding: "20px 18px calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={onClose}
          aria-label={dict.common.cancel}
          className="iconbtn"
          style={{ position: "absolute", insetInlineEnd: 16, top: 16, boxShadow: "none", background: "var(--z100)", color: "var(--z600)" }}
        >
          <X className="size-4" />
        </button>

        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "var(--r-lg)",
            background: "radial-gradient(120% 70% at 50% 116%, color-mix(in srgb, var(--ink) 8%, transparent), transparent 70%), var(--surface-2)",
            marginBottom: 16,
          }}
        >
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 480px) 100vw, 448px"
              className="object-cover"
            />
          )}
        </div>

        <h2 className="display" style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.02em" }}>
          {product.name}
        </h2>
        <p className="price" style={{ marginTop: 6, fontSize: 20 }}>
          {formatPrice(price, locale)}
        </p>
        {product.description && (
          <p className="muted" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.7 }}>
            {product.description}
          </p>
        )}

        {hasVariants && (
          <div style={{ marginTop: 18 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15 }}>
              {t.selectOption}
            </p>
            <div className="sf-row" style={{ gap: 10, flexWrap: "wrap" }}>
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock <= 0}
                  onClick={() => {
                    setVariant(v);
                    setQty(1);
                  }}
                  className={`sizechip${variant?.id === v.id ? " sel" : ""}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="sf-row sf-between" style={{ marginTop: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t.qty}</span>
          <div className="stepper">
            <button
              className="step-btn"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="-"
            >
              <Minus className="size-4" />
            </button>
            <span className="step-val">{qty}</span>
            <button
              className="step-btn"
              onClick={() => setQty((q) => (stock > 0 ? Math.min(stock, q + 1) : q + 1))}
              aria-label="+"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <button
          className="btn btn-accent btn-pill"
          disabled={!canAdd}
          onClick={() => onAdd(variant, qty)}
          style={{ marginTop: 20 }}
        >
          <ShoppingBag className="size-5" />
          {canAdd
            ? `${t.addToCart} · ${formatPrice(price * qty, locale)}`
            : t.outOfStock}
        </button>
      </div>
    </div>
  );
}
