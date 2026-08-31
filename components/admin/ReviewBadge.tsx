import { cn } from "@/lib/cn";

const MAP: Record<string, string> = {
  approved: "border-success/30 bg-success/15 text-success",
  pending: "border-warning/30 bg-warning/15 text-warning",
  rejected: "border-error/30 bg-error/15 text-error",
};

export function ReviewBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill border px-2 py-0.5 text-xs font-medium",
        MAP[status] ?? "border-glass-border bg-glass-2 text-muted"
      )}
    >
      {status}
    </span>
  );
}
