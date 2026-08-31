import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Languages,
  MapPin,
  Timer,
} from "lucide-react";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Section } from "@/components/home/Section";
import {
  ReliabilityBadge,
  ReliabilityTag,
} from "@/components/program/SourceReliability";
import {
  FEE_TYPE_LABEL,
  FREQUENCY_LABEL,
  LANGUAGE_LABEL,
  LEVEL_LABEL,
} from "@/lib/labels";
import { getProgramDetail, getProgramIds } from "@/lib/queries/program-detail";

export const revalidate = 3600;

export async function generateStaticParams() {
  const ids = await getProgramIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramDetail(id);
  if (!program) return { title: "Formation introuvable — Orientis" };
  return {
    title: `${program.name} — ${program.institution.name} — Orientis`,
    description:
      program.description ??
      `${program.name} à ${program.institution.name}${
        program.institution.city ? `, ${program.institution.city}` : ""
      }.`,
  };
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
      {children}
    </p>
  );
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgramDetail(id);

  if (!program) notFound();

  // Uniquement les champs réellement renseignés — pas de tiret ni de "N/A".
  const quickFacts = [
    { icon: GraduationCap, label: LEVEL_LABEL[program.level] ?? program.level },
    program.durationYears !== null && {
      icon: Timer,
      label: `${program.durationYears} an${program.durationYears > 1 ? "s" : ""}`,
    },
    // degree_awarded vaut souvent exactement le libellé du niveau
    // ("Licence" / "Licence") : on ne l'affiche que s'il apporte autre chose.
    program.degreeAwarded &&
      program.degreeAwarded !== (LEVEL_LABEL[program.level] ?? program.level) && {
        icon: GraduationCap,
        label: program.degreeAwarded,
      },
    {
      icon: Languages,
      label: LANGUAGE_LABEL[program.language] ?? program.language,
    },
  ].filter(Boolean) as Array<{ icon: typeof Timer; label: string }>;

  const sections = [
    { id: "presentation", label: "Présentation" },
    { id: "admission", label: "Conditions d'admission" },
    { id: "programme", label: "Programme" },
    { id: "debouches", label: "Débouchés" },
    { id: "frais", label: "Frais" },
    { id: "inscription", label: "Inscription" },
    { id: "sources", label: "Sources" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 pb-24 sm:px-6">
      <div className="animate-fade-in-up flex flex-col gap-6">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
            <li>
              <Link
                href="/"
                className="rounded outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Accueil
              </Link>
            </li>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <li>
              <Link
                href="/formations"
                className="rounded outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Formations
              </Link>
            </li>
            {program.domain && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <li>{program.domain}</li>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <li className="text-foreground" aria-current="page">
              {program.name}
            </li>
          </ol>
        </nav>

        <GlassPanel variant="2" className="p-6 sm:p-8">
          <GlassBadge variant="neutral">
            {LEVEL_LABEL[program.level] ?? program.level}
          </GlassBadge>

          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {program.name}
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <Link
              href={`/etablissements/${program.institution.id}`}
              className="rounded text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {program.institution.name}
            </Link>
            {program.institution.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {program.institution.city}
              </span>
            )}
          </p>

          <p className="mt-1 text-xs text-muted-dark">
            {program.unit.name} · {program.department.name}
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-glass-border pt-5">
            {quickFacts.map((fact, i) => (
              <li
                key={`${fact.label}-${i}`}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <fact.icon className="h-4 w-4 shrink-0" aria-hidden />
                {fact.label}
              </li>
            ))}
          </ul>
        </GlassPanel>

        <nav
          aria-label="Sections de la page"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-pill border border-glass-border bg-glass-1 px-3.5 py-1.5 text-sm text-muted outline-none transition-colors duration-200 ease-out hover:border-glass-border-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <Section delay={80} id="presentation" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Présentation</h2>
        {program.description || program.specialty ? (
          <div className="flex flex-col gap-4">
            {program.description && (
              <p className="leading-relaxed text-muted">{program.description}</p>
            )}
            {program.specialty && (
              <div>
                <h3 className="text-sm font-medium">Spécialités possibles</h3>
                <p className="mt-1 leading-relaxed text-muted">
                  {program.specialty}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Empty>
            Aucune présentation n&apos;est encore renseignée pour cette
            formation.
          </Empty>
        )}
      </Section>

      <Section delay={120} id="admission" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Conditions d&apos;admission</h2>

        {program.admissions.length === 0 ? (
          <Empty>Conditions non renseignées pour cette formation.</Empty>
        ) : (
          program.admissions.map((admission) => (
            <div
              key={admission.id}
              className="flex flex-col gap-4 rounded-card border border-glass-border bg-glass-1 p-5"
            >
              {admission.academicYear && (
                <p className="text-xs text-muted-dark">
                  Année académique {admission.academicYear}
                </p>
              )}

              {admission.minAverage !== null && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-sm text-muted">Moyenne minimale</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {admission.minAverage}/20
                  </span>
                  {/* La mention est accolée à la valeur, jamais reléguée
                      en bas de section. */}
                  <ReliabilityTag source={admission.source} />
                </div>
              )}

              {admission.acceptedSeries &&
                admission.acceptedSeries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-sm text-muted">Séries acceptées</span>
                    <span className="flex flex-wrap gap-1.5">
                      {admission.acceptedSeries.map((serie) => (
                        <GlassBadge key={serie} variant="neutral">
                          {serie}
                        </GlassBadge>
                      ))}
                    </span>
                    <ReliabilityTag source={admission.source} />
                  </div>
                )}

              {admission.ageLimit !== null && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-sm text-muted">Âge maximum</span>
                  <span className="font-semibold tabular-nums">
                    {admission.ageLimit} ans
                  </span>
                  <ReliabilityTag source={admission.source} />
                </div>
              )}

              {(admission.requiresCompetition || admission.requiresInterview) && (
                <div className="flex flex-wrap items-center gap-2">
                  {admission.requiresCompetition && (
                    <GlassBadge variant="neutral">Concours requis</GlassBadge>
                  )}
                  {admission.requiresInterview && (
                    <GlassBadge variant="neutral">Entretien requis</GlassBadge>
                  )}
                  <ReliabilityTag source={admission.source} />
                </div>
              )}

              {admission.otherConditions && (
                <p className="border-t border-glass-border pt-4 text-sm leading-relaxed text-muted">
                  {admission.otherConditions}
                </p>
              )}
            </div>
          ))
        )}
      </Section>

      <Section delay={160} id="programme" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Programme</h2>
        {program.curriculum ? (
          <p className="leading-relaxed text-muted">{program.curriculum}</p>
        ) : (
          <Empty>
            Le contenu du programme n&apos;est pas encore renseigné pour cette
            formation.
          </Empty>
        )}
      </Section>

      <Section delay={200} id="debouches" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Débouchés</h2>
        {program.careerProspects || program.furtherStudies ? (
          <div className="flex flex-col gap-5">
            {program.careerProspects && (
              <div>
                <h3 className="text-sm font-medium">Débouchés professionnels</h3>
                <p className="mt-1 leading-relaxed text-muted">
                  {program.careerProspects}
                </p>
              </div>
            )}
            {program.furtherStudies && (
              <div>
                <h3 className="text-sm font-medium">Poursuite d&apos;études</h3>
                <p className="mt-1 leading-relaxed text-muted">
                  {program.furtherStudies}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Empty>
            Les débouchés ne sont pas encore renseignés pour cette formation.
          </Empty>
        )}
      </Section>

      <Section delay={240} id="frais" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Frais</h2>
        {program.fees.length === 0 ? (
          <Empty>
            Aucun frais n&apos;est renseigné pour cette formation. Renseigne-toi
            directement auprès de l&apos;établissement.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {program.fees.map((fee) => (
              <li
                key={fee.id}
                className="flex flex-col gap-2 rounded-card border border-glass-border bg-glass-1 p-4"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="text-sm text-muted">
                    {FEE_TYPE_LABEL[fee.feeType] ?? fee.feeType}
                  </span>
                  {fee.amount !== null && (
                    <span className="font-semibold tabular-nums">
                      {fee.amount.toLocaleString("fr-FR")} {fee.currency}{" "}
                      <span className="text-sm font-normal text-muted">
                        {FREQUENCY_LABEL[fee.frequency] ?? fee.frequency}
                      </span>
                    </span>
                  )}
                  <ReliabilityTag source={fee.source} />
                </div>
                {fee.conditions && (
                  <p className="text-sm text-muted">{fee.conditions}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section delay={280} id="inscription" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Inscription</h2>

        {program.procedures.every((p) => p.steps.length === 0) &&
        program.documents.length === 0 ? (
          <Empty>
            La procédure d&apos;inscription n&apos;est pas encore documentée
            pour cette formation.
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {program.procedures.map((procedure) => (
              <ol key={procedure.id} className="flex flex-col gap-3">
                {procedure.steps.map((step) => (
                  <li
                    key={step.id}
                    className="flex gap-4 rounded-card border border-glass-border bg-glass-1 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-glass-border bg-glass-2 text-xs font-semibold tabular-nums">
                      {step.stepNumber}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium leading-snug">
                        {step.title}
                      </span>
                      {step.description && (
                        <p className="text-sm text-muted">{step.description}</p>
                      )}
                      {step.deadline && (
                        <p className="text-xs text-muted-dark">
                          Échéance : {step.deadline}
                        </p>
                      )}
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-1 text-xs text-secondary hover:opacity-80"
                        >
                          Ouvrir le lien
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ))}

            {program.documents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Pièces à fournir</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {program.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-muted"
                    >
                      <span>{doc.name}</span>
                      <GlassBadge variant="neutral">
                        {doc.originalOrCopy}
                      </GlassBadge>
                      {doc.isMandatory && (
                        <GlassBadge variant="neutral">Obligatoire</GlassBadge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section delay={320} id="sources" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Sources</h2>
        {program.sources.length === 0 ? (
          <Empty>
            Aucune source n&apos;est rattachée aux données de cette formation.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {program.sources.map((source) => (
              <li
                key={source.id}
                className="flex flex-col gap-2 rounded-card border border-glass-border bg-glass-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm leading-snug">{source.label}</span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1 rounded text-xs text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Consulter la source
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>
                <ReliabilityBadge source={source} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
