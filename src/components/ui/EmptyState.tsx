import { cn } from "@/lib/utils";

/** The standard empty state: dashed-art icon, title, body, optional action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty", className)}>
      {icon && <div className="empty-art">{icon}</div>}
      <div className="sf-stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
        {body && (
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
            {body}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
