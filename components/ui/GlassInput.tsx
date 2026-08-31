import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type GlassInputProps = ComponentProps<"input">;

export function GlassInput({ className, ...props }: GlassInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-input border border-glass-border bg-glass-1 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-dark outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]",
        className,
      )}
      {...props}
    />
  );
}
