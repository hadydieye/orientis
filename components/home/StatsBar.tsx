import { Building2, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { HomeStats } from "@/lib/queries/home";

type Tile = {
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
};

export function StatsBar({ stats }: { stats: HomeStats }) {
  const tiles: Tile[] = [
    {
      icon: Building2,
      value: String(stats.institutions),
      label: "Établissements référencés",
    },
    {
      icon: GraduationCap,
      value: String(stats.programs),
      label: "Formations référencées",
    },
    {
      icon: ShieldCheck,
      // Ratio plutôt que nombre nu : le lecteur voit le numérateur ET
      // l'ensemble, donc la valeur reste honnête même quand elle est basse.
      value: `${stats.institutionsWithVerifiedRequirements} / ${stats.institutions}`,
      label: "Établissements à seuils vérifiés",
      hint:
        stats.institutionsWithVerifiedRequirements === 0
          ? "Seuils issus d'une compilation communautaire, pas encore confirmés auprès des établissements."
          : undefined,
    },
    {
      icon: MapPin,
      value: String(stats.cities),
      label: "Villes couvertes",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <GlassCard key={tile.label} variant="1" className="p-5">
          <tile.icon className="h-5 w-5 text-secondary" aria-hidden />
          <p className="mt-3 text-2xl font-bold tabular-nums sm:text-3xl">
            {tile.value}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted sm:text-sm">
            {tile.label}
          </p>
          {tile.hint && (
            <p className="mt-2 text-[11px] leading-snug text-muted-dark">
              {tile.hint}
            </p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
