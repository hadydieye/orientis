import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Hash,
  Languages,
  MapPin,
  Users,
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
  PROFIL_LABEL,
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
  if (!program) return { title: "Formation introuvable" };

  // Une formation peut être proposée par plusieurs établissements, ou aucun :
  // le titre s'adapte plutôt que de supposer un établissement unique.
  const sigles = program.institutions
    .map((i) => i.sigle ?? i.name)
    .join(", ");

  return {
    title: sigles ? `${program.name} — ${sigles}` : program.name,
    description:
      program.description ??
      [program.typeDiplome, program.name, sigles && `proposée par ${sigles}`]
        .filter(Boolean)
        .join(" · "),
  };
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-card border border-glass-border bg-glass-1 p-5 text-sm text-muted">
      {children}
    </p>
  );
}

/** Liste ordonnée et numérotée : l'ordre vient de la source officielle. */
function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className="flex gap-3 rounded-card border border-glass-border bg-glass-1 p-4"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border border-glass-border bg-glass-2 text-xs font-semibold tabular-nums">
            {index + 1}
          </span>
          <span className="text-sm leading-relaxed text-muted">{item}</span>
        </li>
      ))}
    </ol>
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
    program.typeDiplome && { icon: GraduationCap, label: program.typeDiplome },
    { icon: Hash, label: program.code },
    { icon: Languages, label: "Français" },
  ].filter(Boolean) as Array<{ icon: typeof Hash; label: string }>;

  // Les champs rédactionnels ne sont pas fournis par ParcourSup ; ils peuvent
  // être saisis à la main. Chaque section n'apparaît que si elle a du contenu.
  const showPresentation = Boolean(program.description);
  const showProgramme = Boolean(program.curriculum);
  const showDebouches = Boolean(program.careerProspects || program.furtherStudies);

  const sections = [
    ...(showPresentation ? [{ id: "presentation", label: "Présentation" }] : []),
    { id: "etablissements", label: "Établissements" },
    ...(program.competences.length > 0
      ? [{ id: "competences", label: "Compétences" }]
      : []),
    ...(program.metiers.length > 0 ? [{ id: "metiers", label: "Métiers" }] : []),
    ...(program.secteurs.length > 0
      ? [{ id: "secteurs", label: "Secteurs" }]
      : []),
    ...(showProgramme ? [{ id: "programme", label: "Programme" }] : []),
    ...(showDebouches ? [{ id: "debouches", label: "Débouchés" }] : []),
    { id: "admission", label: "Conditions d'admission" },
    { id: "frais", label: "Frais" },
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
            {program.categorie && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <li>{program.categorie}</li>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <li className="text-foreground" aria-current="page">
              {program.name}
            </li>
          </ol>
        </nav>

        <GlassPanel variant="2" className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {program.typeDiplome && (
              <GlassBadge variant="neutral">{program.typeDiplome}</GlassBadge>
            )}
            {program.categorie && (
              <GlassBadge variant="neutral">{program.categorie}</GlassBadge>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {program.name}
          </h1>

          {program.institutions.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {program.institutions.map((institution, index) => (
                <span key={institution.id} className="inline-flex items-center gap-2">
                  {index > 0 && <span aria-hidden>·</span>}
                  <Link
                    href={`/etablissements/${institution.id}`}
                    className="rounded text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {institution.sigle ?? institution.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          {program.profils.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Users className="h-3.5 w-3.5" aria-hidden />
                Profils acceptés
              </span>
              {program.profils.map((profil) => (
                <GlassBadge key={profil} variant="neutral">
                  {PROFIL_LABEL[profil] ?? profil}
                </GlassBadge>
              ))}
            </div>
          )}

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

          {program.urlSource && (
            <a
              href={program.urlSource}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-fit items-center gap-1.5 rounded text-sm text-secondary outline-none transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
            >
              Fiche officielle sur ParcourSup Guinée
              {program.anneeSource ? ` (${program.anneeSource})` : ""}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
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

      {showPresentation && (
        <Section delay={80} id="presentation" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">Présentation</h2>
          <p className="leading-relaxed text-muted">{program.description}</p>
        </Section>
      )}

      <Section delay={120} id="etablissements" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">
          Où suivre cette formation
        </h2>

        {program.institutions.length === 0 ? (
          // Cas réel et non exceptionnel : les 2 cycles préparatoires sont
          // publiés sous le sigle CPGE, qui ne désigne aucun établissement
          // nommé dans la source officielle.
          <Empty>
            Aucun établissement n&apos;est rattaché à cette formation dans les
            données officielles. Elle y figure sous une désignation générique,
            sans établissement nommé.
          </Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {program.institutions.map((institution) => (
              <li key={institution.id}>
                <Link
                  href={`/etablissements/${institution.id}`}
                  className="flex h-full flex-col gap-1.5 rounded-card border border-glass-border bg-glass-1 p-4 outline-none transition-colors duration-200 ease-out hover:border-glass-border-hover focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex items-start gap-2 font-medium leading-snug">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                    {institution.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-sm text-muted">
                    {institution.sigle && <span>{institution.sigle}</span>}
                    {institution.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {institution.city}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {program.competences.length > 0 && (
        <Section delay={160} id="competences" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">
            Compétences visées
          </h2>
          <p className="text-sm text-muted-dark">
            {program.competences.length} compétence
            {program.competences.length > 1 ? "s" : ""} terminale
            {program.competences.length > 1 ? "s" : ""}, dans l&apos;ordre de la
            fiche officielle.
          </p>
          <OrderedList items={program.competences} />
        </Section>
      )}

      {program.metiers.length > 0 && (
        <Section delay={200} id="metiers" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">Métiers accessibles</h2>
          <ul className="flex flex-wrap gap-2">
            {program.metiers.map((metier, index) => (
              <li
                key={`${index}-${metier}`}
                className="flex items-center gap-2 rounded-pill border border-glass-border bg-glass-1 px-3.5 py-1.5 text-sm text-muted"
              >
                <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {metier}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {program.secteurs.length > 0 && (
        <Section delay={240} id="secteurs" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">
            Secteurs et employeurs
          </h2>
          <div className="flex flex-col gap-3">
            {program.secteurs.map((secteur) => (
              <div
                key={secteur.id}
                className="flex flex-col gap-3 rounded-card border border-glass-border bg-glass-1 p-5"
              >
                {/* `nom` est nullable en base : on n'invente pas de titre. */}
                {secteur.nom && (
                  <h3 className="font-medium leading-snug">{secteur.nom}</h3>
                )}
                {secteur.employeurs.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {secteur.employeurs.map((employeur, index) => (
                      <li
                        key={`${index}-${employeur}`}
                        className="rounded-pill border border-glass-border bg-glass-2 px-3 py-1 text-xs text-muted"
                      >
                        {employeur}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {showProgramme && (
        <Section delay={280} id="programme" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">Programme</h2>
          <p className="leading-relaxed text-muted">{program.curriculum}</p>
        </Section>
      )}

      {showDebouches && (
        <Section delay={300} id="debouches" className="scroll-mt-28 flex flex-col gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">Débouchés</h2>
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
        </Section>
      )}

      <Section delay={320} id="admission" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Conditions d&apos;admission</h2>

        {program.admissions.length === 0 ? (
          <Empty>
            Les données officielles ParcourSup Guinée ne publient pas de
            conditions chiffrées — ni moyenne minimale, ni série requise
            au-delà du profil d&apos;entrée indiqué plus haut.
          </Empty>
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

      <Section delay={360} id="frais" className="scroll-mt-28 flex flex-col gap-4">
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

      <Section delay={400} id="sources" className="scroll-mt-28 flex flex-col gap-4">
        <h2 className="text-xl font-bold sm:text-2xl">Sources</h2>

        {program.urlSource && (
          <div className="flex flex-col gap-2 rounded-card border border-glass-border bg-glass-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm leading-snug">
                ParcourSup Guinée — Ministère de l&apos;Enseignement Supérieur
              </span>
              <a
                href={program.urlSource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 rounded text-xs text-secondary outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
              >
                Consulter la fiche officielle
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>
            <ReliabilityBadge
              source={{ sourceType: "officiel", status: "verifie" }}
            />
          </div>
        )}

        {program.sources.map((source) => (
          <div
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
          </div>
        ))}

        {!program.urlSource && program.sources.length === 0 && (
          <Empty>
            Aucune source n&apos;est rattachée aux données de cette formation.
          </Empty>
        )}
      </Section>
    </main>
  );
}
