import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-5", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="tile">
      <p className="muted text-xs font-medium">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", accent)}>{value}</p>
    </div>
  );
}
