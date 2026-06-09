import { Skeleton } from "@/components/ui/Skeleton";

/** Storefront skeleton. Neutral surface (the shop's theme isn't known until the
 *  data loads) — keeps the first paint instant instead of a blank screen. */
export default function Loading() {
  return (
    <main className="sf" aria-busy="true">
      <div className="mx-auto max-w-md" style={{ paddingBottom: 120 }}>
        <div className="topbar">
          <Skeleton style={{ height: 24, width: 170 }} />
        </div>
        <div style={{ padding: "12px 18px 4px" }}>
          <Skeleton style={{ height: 48, borderRadius: 999 }} />
        </div>
        <div style={{ padding: "10px 18px 0" }}>
          <Skeleton style={{ height: 168, borderRadius: 30 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, padding: "18px 18px 0" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ aspectRatio: "3 / 4", borderRadius: "var(--r-card)" }} />
          ))}
        </div>
      </div>
    </main>
  );
}
