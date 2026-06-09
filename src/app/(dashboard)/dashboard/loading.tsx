import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ padding: "12px 18px 0" }} aria-busy="true">
      <div className="sf-grid2" style={{ gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 92 }} />
        ))}
      </div>
      <div className="sf-row" style={{ gap: 12, marginTop: 16 }}>
        <Skeleton style={{ height: 52, flex: 1, borderRadius: "var(--r-pill)" }} />
        <Skeleton style={{ height: 52, flex: 1, borderRadius: "var(--r-pill)" }} />
      </div>
      <div style={{ marginTop: 24 }}>
        <Skeleton style={{ height: 20, width: 120, marginBottom: 14 }} />
        <div className="sf-stack" style={{ gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 60 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
