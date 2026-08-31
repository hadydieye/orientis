import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["Série", "Moyenne", "Résultats"];

export function OrientationStepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border text-xs font-semibold transition-colors duration-200 ease-out",
                  done && "border-transparent bg-linear-to-r from-primary to-secondary text-white",
                  active && "border-primary bg-primary/20 text-foreground",
                  !done && !active && "border-glass-border bg-glass-1 text-muted-dark"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-200 ease-out",
                  active ? "font-medium text-foreground" : "text-muted"
                )}
                aria-current={active ? "step" : undefined}
              >
                {label}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-6 transition-colors duration-200 ease-out sm:w-10",
                  done ? "bg-secondary" : "bg-glass-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
