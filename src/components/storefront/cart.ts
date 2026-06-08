import type { StorefrontProduct, StorefrontVariant } from "@/types/storefront";

export type CartLine = {
  key: string;
  product: StorefrontProduct;
  variant: StorefrontVariant | null;
  qty: number;
};

export function lineKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? ""}`;
}

export function unitPrice(
  product: StorefrontProduct,
  variant: StorefrontVariant | null,
): number {
  return Number(variant?.price_override ?? product.price);
}

export function availableStock(
  product: StorefrontProduct,
  variant: StorefrontVariant | null,
): number {
  return variant ? variant.stock : product.stock;
}

/** A product is sellable if it (or any of its variants) has stock. */
export function productInStock(product: StorefrontProduct): boolean {
  return product.variants.length > 0
    ? product.variants.some((v) => v.stock > 0)
    : product.stock > 0;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + unitPrice(l.product, l.variant) * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}
