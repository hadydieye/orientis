import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { PopularInstitution } from "@/lib/queries/home";

const STATUS_LABEL: Record<string, string> = {
  universite: "Université",
  institut: "Institut",
  ecole: "École",
};

export function InstitutionCard({
  institution,
}: {
  institution: PopularInstitution;
}) {
  return (
    <GlassCard variant="2" className="flex h-full flex-col p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-button border border-glass-border bg-glass-2">
          {institution.logoUrl ? (
            <Image
              src={institution.logoUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-secondary" aria-hidden />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <GlassBadge variant="neutral">
          {institution.type === "public" ? "Public" : "Privé"}
        </GlassBadge>
        <GlassBadge variant="neutral">
          {STATUS_LABEL[institution.status] ?? institution.status}
        </GlassBadge>
        {/* Pas de badge "Reconnu" : il était déduit de la simple présence de
            recognition_status, dont le contenu décrit une tutelle
            ministérielle et non une accréditation. */}
        </div>
      </div>

      <h3 className="mt-4 font-semibold leading-snug">{institution.name}</h3>

      {institution.city && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {institution.city}
        </p>
      )}

      <p className="mt-auto pt-4 text-sm text-muted">
        <span className="font-semibold text-foreground tabular-nums">
          {institution.programCount}
        </span>{" "}
        formation{institution.programCount > 1 ? "s" : ""}
      </p>
    </GlassCard>
  );
}
