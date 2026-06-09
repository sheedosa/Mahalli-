import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 px-4" aria-busy="true">
      <Skeleton style={{ height: 26, width: 120 }} />
      <Skeleton style={{ height: 50, borderRadius: "var(--r-input)" }} />
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 66, borderRadius: "var(--r-card)" }} />
        ))}
      </div>
    </div>
  );
}
