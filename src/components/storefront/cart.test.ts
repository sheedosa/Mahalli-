import { describe, it, expect } from "vitest";
import {
  lineKey,
  unitPrice,
  availableStock,
  productInStock,
  cartSubtotal,
  cartCount,
  type CartLine,
} from "@/components/storefront/cart";
import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";

function product(over: Partial<StorefrontProduct> = {}): StorefrontProduct {
  return {
    id: "p1", name: "Cake", description: null, price: 100,
    image_url: null, category: null, stock: 5, variants: [], ...over,
  };
}
function variant(over: Partial<StorefrontVariant> = {}): StorefrontVariant {
  return { id: "v1", label: "L", price_override: null, stock: 3, ...over };
}

describe("lineKey", () => {
  it("combines product + variant", () => {
    expect(lineKey("p1", "v1")).toBe("p1:v1");
    expect(lineKey("p1", null)).toBe("p1:");
  });
});

describe("unitPrice", () => {
  it("uses base price when no variant", () => {
    expect(unitPrice(product({ price: 100 }), null)).toBe(100);
  });
  it("uses variant override when present", () => {
    expect(unitPrice(product({ price: 100 }), variant({ price_override: 140 }))).toBe(140);
  });
  it("falls back to base when variant has no override", () => {
    expect(unitPrice(product({ price: 100 }), variant({ price_override: null }))).toBe(100);
  });
});

describe("availableStock", () => {
  it("variant stock when variant given, else product stock", () => {
    expect(availableStock(product({ stock: 5 }), null)).toBe(5);
    expect(availableStock(product({ stock: 5 }), variant({ stock: 2 }))).toBe(2);
  });
});

describe("productInStock", () => {
  it("base stock when no variants", () => {
    expect(productInStock(product({ stock: 0, variants: [] }))).toBe(false);
    expect(productInStock(product({ stock: 1, variants: [] }))).toBe(true);
  });
  it("any variant in stock when variants exist", () => {
    expect(productInStock(product({ stock: 0, variants: [variant({ stock: 0 }), variant({ id: "v2", stock: 4 })] }))).toBe(true);
    expect(productInStock(product({ stock: 9, variants: [variant({ stock: 0 })] }))).toBe(false); // variants override base
  });
});

describe("cart totals", () => {
  const lines: CartLine[] = [
    { key: "a", product: product({ price: 100 }), variant: variant({ price_override: 140 }), qty: 2 },
    { key: "b", product: product({ id: "p2", price: 40 }), variant: null, qty: 1 },
  ];
  it("cartSubtotal sums unitPrice*qty", () => {
    expect(cartSubtotal(lines)).toBe(140 * 2 + 40); // 320
  });
  it("cartCount sums qty", () => {
    expect(cartCount(lines)).toBe(3);
  });
  it("empty cart is zero", () => {
    expect(cartSubtotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});
