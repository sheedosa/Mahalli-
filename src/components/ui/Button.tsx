import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

// Maps to the design-system token classes (globals.css) so buttons inherit the
// active theme (.theme-mahalli on the dashboard) instead of hardcoded greys.
const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

// `.btn` is full-width 52px by default; `sm` uses the shorter token size.
const sizes: Record<Size, string> = {
  md: "",
  lg: "",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Large tap targets (min 44px) for one-handed mobile use (spec §8). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn("btn", variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
