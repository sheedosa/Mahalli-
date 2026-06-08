/** Storefront slug rules — shared by onboarding validation and the slug input,
 *  and mirrored by the DB (`slug_is_reserved` + the sellers.slug CHECK). */

// 3–40 chars, lowercase alphanumerics + dashes, no leading/trailing dash.
export const slugRe = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

// Names that would collide with real app routes — keep in sync with the
// `slug_is_reserved` SQL function (migrations 0008 + 0013).
export const RESERVED_SLUGS = new Set([
  "api", "auth", "login", "signup", "logout", "dashboard", "products", "orders",
  "customers", "broadcasts", "settings", "onboarding", "offline", "admin",
  "account", "sw", "icon", "icons", "manifest", "assets", "static", "public",
  "_next", "s", "app", "about", "terms", "privacy", "help", "support",
  "pricing", "blog", "www", "link",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** Valid format AND not reserved. */
export function isValidSlug(slug: string): boolean {
  return slugRe.test(slug) && !isReservedSlug(slug);
}

/** Best-effort slug from a (Latin) name; Arabic names are typed manually. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}
