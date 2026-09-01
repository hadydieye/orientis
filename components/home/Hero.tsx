import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";
import { GuineaOutline } from "@/components/home/GuineaOutline";
import type { CityCount } from "@/lib/queries/home";

export function Hero({ cities = [] }: { cities?: CityCount[] }) {
  return (
    <section className="animate-fade-in-up relative overflow-hidden rounded-hero border border-glass-border bg-glass-1 px-6 py-16 backdrop-blur-md sm:px-10 sm:py-20 lg:px-14 lg:py-24">
      {/* Silhouette décorative — masquée sous lg, où elle gênerait la lecture. */}
      <GuineaOutline
        cities={cities}
        className="pointer-events-none absolute right-4 top-1/2 hidden h-[72%] -translate-y-1/2 lg:block"
      />

      <div className="relative max-w-2xl">
        <GlassBadge variant="neutral" className="gap-1.5">
          <Sparkles className="h-3 w-3" aria-hidden />
          Votre avenir commence ici
        </GlassBadge>

        <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="block">Trouve ta voie.</span>
          <span className="mt-1 block bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Construis ton avenir.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Le catalogue des formations post-bac en Guinée, rassemblé au même
          endroit. Explore les filières, compare les établissements et trouve
          celle qui te correspond vraiment.
        </p>

        {/* Les deux CTA étaient de simples <button> sans handler ni lien :
            inertes sur tous les supports. Enveloppés dans des <Link>, ils
            fonctionnent aussi sans JavaScript. */}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/orientation" className="inline-flex">
            <GlassButton variant="primary" className="group w-full sm:w-auto">
              Trouver ma filière
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden
              />
            </GlassButton>
          </Link>
          <Link href="/formations" className="inline-flex">
            <GlassButton variant="secondary" className="w-full sm:w-auto">
              Explorer les formations
            </GlassButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
