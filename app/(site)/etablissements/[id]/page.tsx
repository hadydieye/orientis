import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  FileQuestion,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Section } from "@/components/home/Section";
import { ProgramCard } from "@/components/institution/ProgramCard";
import { ReliabilityBadge } from "@/components/program/SourceReliability";
import { PhotoGallery } from "@/components/institution/PhotoGallery";
import {
  INSTITUTION_INCOMPLETE_MESSAGE,
  INSTITUTION_INCOMPLETE_TITLE,
  institutionHasNoStructure,
} from "@/lib/programs/completeness";
import { UnitAccordion } from "@/components/institution/UnitAccordion";
import {
  getInstitutionDetail,
  getInstitutionIds,
} from "@/lib/queries/institution-detail";

export const revalidate = 3600;

// Les 15 établissements sont connus à l'avance et bougent rarement :
// on prérend chaque fiche au build.
export async function generateStaticParams() {
  const ids = await getInstitutionIds();
  return ids.map((id) => ({ id }));
}

const STATUS_LABEL: Record<string, string> = {
  universite: "Université",
  institut: "Institut",
  ecole: "École",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const institution = await getInstitutionDetail(id);
  if (!institution) return { title: "Établissement introuvable — Orientis" };
  return {
    title: `${institution.name} — Orientis`,
    description:
      institution.description ??
      `${institution.name}, ${institution.city ?? "Guinée"} — formations et informations.`,
  };
}

export default async function InstitutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institution = await getInstitutionDetail(id);

  if (!institution) notFound();

  const contacts = [
    institution.website && {
      icon: Globe,
      label: institution.website.replace(/^https?:\/\//, ""),
      href: institution.website,
    },
    institution.phone && {
      icon: Phone,
      label: institution.phone,
      href: `tel:${institution.phone}`,
    },
    institution.email && {
      icon: Mail,
      label: institution.email,
      href: `mailto:${institution.email}`,
    },
  ].filter(Boolean) as Array<{
    icon: typeof Globe;
    label: string;
    href: string;
  }>;

  const facts = [
    institution.foundedYear && {
      icon: CalendarDays,
      label: `Fondé en ${institution.foundedYear}`,
    },
    (institution.address || institution.commune) && {
      icon: MapPin,
      label: [institution.address, institution.commune, institution.city]
        .filter(Boolean)
        .join(", "),
    },
  ].filter(Boolean) as Array<{ icon: typeof Globe; label: string }>;

  const hasPresentation =
    !!institution.description || facts.length > 0 || contacts.length > 0;

  // Même traitement que les formations sans contenu : la fiche reste publiée,
  // mais son état est annoncé plutôt que deviné devant des sections vides.
  const noStructure = institutionHasNoStructure(institution);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-14 px-4 pb-24 sm:px-6">
      <div className="animate-fade-in-up flex flex-col gap-6">
        <Link
          href="/explorer"
          className="inline-flex w-fit items-center gap-1.5 rounded-button text-sm text-muted outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour au catalogue
        </Link>

        {/* En-tête de fiche : blur autorisé (hero de page, élément unique). */}
        <GlassPanel variant="2" className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-panel border border-glass-border bg-glass-2">
              {institution.logoUrl ? (
                <Image
                  src={institution.logoUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-secondary" aria-hidden />
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {institution.name}
              </h1>

              <p className="text-sm text-muted">
                {[
                  institution.type === "public" ? "Public" : "Privé",
                  institution.city,
                  STATUS_LABEL[institution.status] ?? institution.status,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="flex flex-wrap gap-2">
                <GlassBadge variant="neutral">
                  {institution.type === "public" ? "Public" : "Privé"}
                </GlassBadge>
                <GlassBadge variant="neutral">
                  {institution.programCount} formation
                  {institution.programCount > 1 ? "s" : ""}
                </GlassBadge>
                {/* Pas de badge de reconnaissance : recognition_status décrit
                    une tutelle administrative, pas une accréditation. Le texte
                    est affiché tel quel dans la section Présentation. */}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {noStructure && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning/10 p-4"
        >
          <FileQuestion className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">{INSTITUTION_INCOMPLETE_TITLE}</p>
            <p className="text-sm leading-relaxed text-muted">
              {INSTITUTION_INCOMPLETE_MESSAGE} Les informations ci-dessous se
              limitent à la présentation de l&apos;établissement et à ses
              sources. Les filières annoncées n&apos;ont pas encore de structure
              académique documentée.
            </p>
          </div>
        </div>
      )}

      <Section delay={80} className="flex flex-col gap-5">
        <h2 className="text-xl font-bold sm:text-2xl">Présentation</h2>

        {hasPresentation ? (
          <div className="flex flex-col gap-5">
            {institution.description && (
              <p className="max-w-3xl leading-relaxed text-muted">
                {institution.description}
              </p>
            )}

            {institution.recognitionStatus && (
              // Texte repris littéralement, sans icône ni couleur de
              // validation : c'est une donnée déclarative, pas un label vérifié.
              <p className="flex items-start gap-2 text-sm text-muted">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {institution.recognitionStatus}
              </p>
            )}

            {(facts.length > 0 || contacts.length > 0) && (
              <ul className="flex flex-col gap-2.5">
                {facts.map((fact) => (
                  <li
                    key={fact.label}
                    className="flex items-center gap-2.5 text-sm text-muted"
                  >
                    <fact.icon className="h-4 w-4 shrink-0" aria-hidden />
                    {fact.label}
                  </li>
                ))}
                {contacts.map((contact) => (
                  <li key={contact.href} className="flex items-center gap-2.5 text-sm">
                    <contact.icon
                      className="h-4 w-4 shrink-0 text-muted"
                      aria-hidden
                    />
                    <a
                      href={contact.href}
                      target={contact.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        contact.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="rounded text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {contact.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // 3 établissements n'ont aucun champ de présentation renseigné :
          // on le dit, plutôt que de laisser une section vide.
          <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
            Aucune information de présentation n&apos;est encore renseignée pour
            cet établissement.
          </p>
        )}
      </Section>

      <Section delay={160} className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Unités académiques</h2>
          <p className="mt-2 text-sm text-muted">
            {institution.units.length} unité
            {institution.units.length > 1 ? "s" : ""} — dépliez pour voir les
            départements et accéder à leurs formations.
          </p>
        </div>

        {institution.units.length === 0 ? (
          <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
            Aucune unité académique renseignée.
          </p>
        ) : (
          <UnitAccordion units={institution.units} />
        )}
      </Section>

      {institution.photos.length > 0 && (
        <Section delay={200}>
          <PhotoGallery photos={institution.photos} />
        </Section>
      )}

      <Section delay={240} className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Formations</h2>
          <p className="mt-2 text-sm text-muted">
            {institution.programCount} formation
            {institution.programCount > 1 ? "s" : ""} au total, regroupée
            {institution.programCount > 1 ? "s" : ""} par unité et département.
          </p>
        </div>

        {institution.programCount === 0 ? (
          <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
            Aucune formation rattachée à cet établissement pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {institution.units
              .filter((unit) => unit.programCount > 0)
              .map((unit) => (
                <div key={unit.id} className="flex flex-col gap-5">
                  <h3 className="border-b border-glass-border pb-2 font-semibold">
                    {unit.name}
                    <span className="ml-2 text-sm font-normal text-muted">
                      {unit.programCount}
                    </span>
                  </h3>

                  {unit.departments
                    .filter((dept) => dept.programs.length > 0)
                    .map((dept) => (
                      <div
                        key={dept.id}
                        id={`dept-${dept.id}`}
                        // Compense la navbar fixe quand on arrive par une ancre.
                        className="scroll-mt-28"
                      >
                        <h4 className="text-sm font-medium text-muted">
                          {dept.name}
                        </h4>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {dept.programs.map((program) => (
                            <ProgramCard key={program.id} program={program} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        )}
      </Section>

      <Section delay={320} className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Sources</h2>
          <p className="mt-2 text-sm text-muted">
            D&apos;où proviennent les informations de cette fiche : la
            documentation de l&apos;établissement, et les références qui
            justifient les seuils d&apos;admission et les frais.
          </p>
        </div>

        {institution.sources.length === 0 ? (
          <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
            Aucune source rattachée aux données de cet établissement pour le
            moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {institution.sources.map((source) => {
              return (
                <li
                  key={source.id}
                  className="flex flex-col gap-2 rounded-card border border-glass-border bg-glass-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm leading-snug">{source.label}</span>
                    <span className="text-xs text-muted">
                      {source.origin === "etablissement"
                        ? "Documentation de l'établissement"
                        : "Référence d'un seuil d'admission ou de frais"}
                      {source.note ? ` — ${source.note}` : ""}
                    </span>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-fit items-center gap-1 rounded text-xs text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Consulter la source
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                  {/* Composant partagé : le vocabulaire de fiabilité n'est
                      écrit qu'à un seul endroit (lib/labels.ts). */}
                  <ReliabilityBadge source={source} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </main>
  );
}
