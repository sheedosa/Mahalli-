import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "warning" | "danger" | "neutral" | "dark";

/** A status/category pill using the design-system token classes. */
export function Badge({
  tone = "neutral",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("pill", `pill-${tone}`, className)} {...props} />;
}
