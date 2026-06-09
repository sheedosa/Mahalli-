import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 px-4" aria-busy="true">
      <div className="flex items-center justify-between gap-2">
        <Skeleton style={{ height: 26, width: 100 }} />
        <Skeleton style={{ height: 42, width: 120, borderRadius: 999 }} />
      </div>
      <Skeleton style={{ height: 50, borderRadius: "var(--r-input)" }} />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 40, width: 76, borderRadius: 999 }} />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 66, borderRadius: "var(--r-card)" }} />
        ))}
      </div>
    </div>
  );
}
