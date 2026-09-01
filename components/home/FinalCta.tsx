import Link from "next/link";
import { Compass } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function FinalCta() {
  return (
    <GlassPanel
      variant="2"
      className="px-6 py-12 text-center sm:px-10 sm:py-14"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-button border border-glass-border bg-glass-2">
        <Compass className="h-6 w-6 text-secondary" aria-hidden />
      </div>
      <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
        Tu ne sais pas par où commencer&nbsp;?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">
        Réponds à quelques questions sur ta série, tes résultats et ce qui
        t&apos;intéresse. On te proposera les filières qui te correspondent.
      </p>
      <div className="mt-7 flex justify-center">
        <Link href="/orientation" className="inline-flex">
          <GlassButton variant="primary">
            Faire le test d&apos;orientation
          </GlassButton>
        </Link>
      </div>
    </GlassPanel>
  );
}
