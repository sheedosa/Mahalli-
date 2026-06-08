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
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
      <Card className="space-y-2">
        <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
          {badge}
        </span>
        <p className="text-sm text-zinc-500">{body}</p>
      </Card>
    </div>
  );
}
