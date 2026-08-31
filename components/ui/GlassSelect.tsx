import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type GlassSelectProps = ComponentProps<"select">;

export function GlassSelect({ className, children, ...props }: GlassSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none rounded-input border border-glass-border bg-glass-1 py-2.5 pl-4 pr-10 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-primary focus:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]",
          // Le menu déroulant natif ignore le fond glass : on force une
          // couleur lisible, sinon les options sortent en blanc sur blanc.
          "[&>option]:bg-background-secondary [&>option]:text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  );
}
