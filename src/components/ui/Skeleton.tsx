export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`skeleton ${className ?? ""}`} style={style} aria-hidden />;
}

/** A few placeholder rows shaped like a list card. */
export function ListSkeleton({ rows = 4, height = 72 }: { rows?: number; height?: number }) {
  return (
    <div className="sf-stack" style={{ gap: 11, padding: "6px 18px" }} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ height, borderRadius: "var(--r-card)" }} />
      ))}
    </div>
  );
}
