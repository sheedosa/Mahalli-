import { Card } from "@/components/ui/Card";

export function ComingSoon({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <div className="space-y-4 px-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <Card className="space-y-2">
        <span className="pill pill-neutral">{badge}</span>
        <p className="muted text-sm">{body}</p>
      </Card>
    </div>
  );
}
