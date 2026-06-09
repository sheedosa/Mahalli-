import { BrandIcon } from "@/components/brand/BrandIcon";

// Mahalli wordmark lockup (app mark + "Mahalli") for the seller-side headers:
// landing, auth, onboarding. The brand name is the Latin "Mahalli" in both
// locales — a logo stays constant across languages.
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <BrandIcon size={Math.round(size * 1.28)} />
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: "-.02em",
          lineHeight: 1,
          color: "var(--ink)",
        }}
      >
        Mahalli
      </span>
    </span>
  );
}
