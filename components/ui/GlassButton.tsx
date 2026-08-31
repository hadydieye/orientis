import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type GlassButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary";
};

export function GlassButton({
  variant = "primary",
  className,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-button px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" &&
          "bg-linear-to-r from-primary to-secondary text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(108,99,255,0.55)]",
        variant === "secondary" &&
          "border border-glass-border bg-glass-2 text-foreground hover:-translate-y-0.5 hover:border-glass-border-hover hover:shadow-[0_8px_24px_-12px_rgba(255,255,255,0.15)]",
        className,
      )}
      {...props}
    />
  );
}
