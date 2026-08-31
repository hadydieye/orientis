import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type SectionProps = ComponentProps<"section"> & {
  /** Décalage de l'animation d'entrée, en ms. Une section à la fois. */
  delay?: number;
};

export function Section({ delay = 0, className, style, ...props }: SectionProps) {
  return (
    <section
      className={cn("animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms`, ...style }}
      {...props}
    />
  );
}
