import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { CatalogInstitution } from "@/lib/queries/institutions";

const STATUS_LABEL: Record<string, string> = {
  universite: "Université",
  institut: "Institut",
  ecole: "École",
};

export function InstitutionListCard({
  institution,
}: {
  institution: CatalogInstitution;
}) {
  return (
    <Link
      href={`/etablissements/${institution.id}`}
      className="block rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* blur={false} : grille dense (15+ cartes), backdrop-filter réservé à
          la navbar / au hero / aux modales. */}
      <GlassCard variant="2" blur={false} className="flex h-full flex-col p-5">
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

          <div className="flex flex-wrap gap-2">
            <GlassBadge variant="neutral">
              {institution.type === "public" ? "Public" : "Privé"}
            </GlassBadge>
            <GlassBadge variant="neutral">
              {STATUS_LABEL[institution.status] ?? institution.status}
            </GlassBadge>
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
          <span className="font-semibold tabular-nums text-foreground">
            {institution.programCount}
          </span>{" "}
          formation{institution.programCount > 1 ? "s" : ""}
        </p>
      </GlassCard>
    </Link>
  );
}
