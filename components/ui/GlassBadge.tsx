import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const variantClasses = {
  success: "border-success/30 bg-success/15 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning",
  error: "border-error/30 bg-error/15 text-error",
  neutral: "border-glass-border bg-glass-2 text-muted",
} as const;

type GlassBadgeProps = ComponentProps<"span"> & {
  variant?: keyof typeof variantClasses;
};

export function GlassBadge({
  variant = "neutral",
  className,
  ...props
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2.5 py-1 text-xs font-medium leading-none",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
