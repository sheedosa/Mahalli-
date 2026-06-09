import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <div style={{ padding: "4px 18px 8px" }}>
        <Skeleton style={{ height: 26, width: 120 }} />
      </div>
      <div style={{ padding: "0 18px 8px" }}>
        <Skeleton style={{ height: 46, borderRadius: 999 }} />
      </div>
      <ListSkeleton rows={6} height={92} />
    </div>
  );
}
