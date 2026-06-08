import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-base text-zinc-900",
      "placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
      "disabled:bg-zinc-50 disabled:text-zinc-400",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-20 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-zinc-900",
      "placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center justify-between text-sm font-medium text-zinc-700"
      >
        <span>{label}</span>
        {optional && <span className="text-xs text-zinc-400">{optional}</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
