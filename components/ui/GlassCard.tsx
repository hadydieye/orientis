import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const variantBg = {
  "1": "bg-glass-1",
  "2": "bg-glass-2",
  "3": "bg-glass-3",
} as const;

type GlassCardProps = ComponentProps<"div"> & {
  variant?: keyof typeof variantBg;
  /** Set to false for dense lists of small cards — skips backdrop-blur for mobile performance. */
  blur?: boolean;
};

export function GlassCard({
  variant = "1",
  blur = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border border-glass-border transition-[transform,border-color] duration-200 ease-out hover:-translate-y-[3px] hover:border-glass-border-hover",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:from-white/8 before:to-transparent before:opacity-50",
        variantBg[variant],
        blur && "backdrop-blur-md",
        className,
      )}
      {...props}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
