import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const variantBg = {
  "1": "bg-glass-1",
  "2": "bg-glass-2",
  "3": "bg-glass-3",
} as const;

type GlassPanelProps = ComponentProps<"div"> & {
  variant?: keyof typeof variantBg;
};

export function GlassPanel({
  variant = "1",
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-panel border border-glass-border backdrop-blur-md",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:from-white/8 before:to-transparent before:opacity-50",
        variantBg[variant],
        className,
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
