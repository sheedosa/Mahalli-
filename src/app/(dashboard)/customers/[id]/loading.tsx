import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 px-4" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton style={{ height: 40, width: 40, borderRadius: 999 }} />
        <Skeleton style={{ height: 26, width: 140 }} />
      </div>
      <Skeleton style={{ height: 110, borderRadius: "var(--r-card)" }} />
      <Skeleton style={{ height: 170, borderRadius: "var(--r-card)" }} />
      <Skeleton style={{ height: 120, borderRadius: "var(--r-card)" }} />
    </div>
  );
}
