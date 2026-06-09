import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Native select styled with the design-system `.input` look. */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("input", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";
