import { createPublicClient } from "@/lib/supabase/public";
import { PROFIL_ORDER } from "@/lib/labels";

export type ProgramSource = {
  id: string;
  label: string;
  url: string | null;
  sourceType: string;
  status: string;
};

export type ProgramAdmission = {
  id: string;
  academicYear: string | null;
  acceptedSeries: string[] | null;
  minAverage: number | null;
  subjectMinGrades: Record<string, unknown> | null;
  ageLimit: number | null;
  requiresCompetition: boolean | null;
  requiresInterview: boolean | null;
  otherConditions: string | null;
  verifiedAt: string | null;
  source: ProgramSource | null;
};

export type ProgramFee = {
  id: string;
  feeType: string;
  amount: number | null;
  currency: string;
  frequency: string;
  conditions: string | null;
  academicYear: string | null;
  source: ProgramSource | null;
};

export type ProgramInstitution = {
  id: string;
  name: string;
  sigle: string | null;
  city: string | null;
};

export type ProgramSecteur = {
  id: string;
  nom: string | null;
  employeurs: string[];
};

export type ProgramDetail = {
  id: string;
  name: string;
  code: string;
  level: string;
  typeDiplome: string | null;
  categorie: string | null;
  urlSource: string | null;
  anneeSource: number | null;
  /** Rédactionnel : absent des données ParcourSup, saisissable à la main. */
  description: string | null;
  curriculum: string | null;
  careerProspects: string | null;
  furtherStudies: string | null;
  /** N-N : vide pour les 2 cycles préparatoires, rattachés à aucun IES. */
  institutions: ProgramInstitution[];
  profils: string[];
  competences: string[];
  metiers: string[];
  secteurs: ProgramSecteur[];
  /** Conditions et frais : tables vides aujourd'hui, ressaisissables en admin. */
  admissions: ProgramAdmission[];
  fees: ProgramFee[];
  sources: ProgramSource[];
};

const SELECT = `
  id, name, code, level, type_diplome_enum, categorie, url_source, annee_source,
  description, curriculum, career_prospects, further_studies,
  program_institutions (
    institutions ( id, name, sigle, city )
  ),
  program_profils ( profil ),
  competences ( ordre, libelle ),
  metiers ( ordre, libelle ),
  secteurs (
    id, ordre, nom,
    employeurs ( ordre, libelle )
  ),
  admission_requirements (
    id, accepted_series, min_average, subject_min_grades, age_limit,
    requires_competition, requires_interview, other_conditions, verified_at,
    academic_years ( label ),
    sources ( id, label, url, source_type, status )
  ),
  fees (
    id, fee_type, amount, currency, frequency, conditions,
    academic_years ( label ),
    sources ( id, label, url, source_type, status )
  )
`;

type RawSource = {
  id: string;
  label: string;
  url: string | null;
  source_type: string;
  status: string;
};

function mapSource(source: RawSource | null): ProgramSource | null {
  if (!source) return null;
  return {
    id: source.id,
    label: source.label,
    url: source.url,
    sourceType: source.source_type,
    status: source.status,
  };
}

type Ordered = { ordre: number; libelle: string };

/** Restitue l'ordre d'origine de la source ; PostgREST ne le garantit pas. */
function inOrder(rows: Ordered[] | null): string[] {
  return [...(rows ?? [])].sort((a, b) => a.ordre - b.ordre).map((r) => r.libelle);
}

type RawProgram = {
  id: string;
  name: string;
  code: string;
  level: string;
  type_diplome_enum: string | null;
  categorie: string | null;
  url_source: string | null;
  annee_source: number | null;
  description: string | null;
  curriculum: string | null;
  career_prospects: string | null;
  further_studies: string | null;
  program_institutions: Array<{
    institutions: {
      id: string;
      name: string;
      sigle: string | null;
      city: string | null;
    } | null;
  }> | null;
  program_profils: Array<{ profil: string }> | null;
  competences: Ordered[] | null;
  metiers: Ordered[] | null;
  secteurs: Array<{
    id: string;
    ordre: number;
    nom: string | null;
    employeurs: Ordered[] | null;
  }> | null;
  admission_requirements: Array<{
    id: string;
    accepted_series: string[] | null;
    min_average: number | null;
    subject_min_grades: Record<string, unknown> | null;
    age_limit: number | null;
    requires_competition: boolean | null;
    requires_interview: boolean | null;
    other_conditions: string | null;
    verified_at: string | null;
    academic_years: { label: string } | null;
    sources: RawSource | null;
  }> | null;
  fees: Array<{
    id: string;
    fee_type: string;
    amount: number | null;
    currency: string;
    frequency: string;
    conditions: string | null;
    academic_years: { label: string } | null;
    sources: RawSource | null;
  }> | null;
};

/** Ids de toutes les formations — alimente generateStaticParams. */
export async function getProgramIds() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("programs").select("id");
  return (data ?? []).map((row) => row.id);
}

export async function getProgramDetail(id: string): Promise<ProgramDetail | null> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("programs")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const raw = data as unknown as RawProgram;

  const admissions: ProgramAdmission[] = (raw.admission_requirements ?? []).map(
    (a) => ({
      id: a.id,
      academicYear: a.academic_years?.label ?? null,
      acceptedSeries: a.accepted_series,
      minAverage: a.min_average,
      subjectMinGrades: a.subject_min_grades,
      ageLimit: a.age_limit,
      requiresCompetition: a.requires_competition,
      requiresInterview: a.requires_interview,
      otherConditions: a.other_conditions,
      verifiedAt: a.verified_at,
      source: mapSource(a.sources),
    })
  );

  const fees: ProgramFee[] = (raw.fees ?? []).map((f) => ({
    id: f.id,
    feeType: f.fee_type,
    amount: f.amount,
    currency: f.currency,
    frequency: f.frequency,
    conditions: f.conditions,
    academicYear: f.academic_years?.label ?? null,
    source: mapSource(f.sources),
  }));

  // Sources dédupliquées : une même source peut documenter plusieurs lignes.
  const sources = [
    ...new Map(
      [...admissions, ...fees]
        .map((row) => row.source)
        .filter((s): s is ProgramSource => Boolean(s))
        .map((s) => [s.id, s])
    ).values(),
  ];

  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    level: raw.level,
    typeDiplome: raw.type_diplome_enum,
    categorie: raw.categorie,
    urlSource: raw.url_source,
    anneeSource: raw.annee_source,
    description: raw.description,
    curriculum: raw.curriculum,
    careerProspects: raw.career_prospects,
    furtherStudies: raw.further_studies,
    institutions: (raw.program_institutions ?? [])
      .map((link) => link.institutions)
      .filter((i): i is ProgramInstitution => Boolean(i))
      .sort((a, b) => a.name.localeCompare(b.name, "fr")),
    profils: (raw.program_profils ?? [])
      .map((p) => p.profil)
      .sort(
        (a, b) =>
          PROFIL_ORDER.indexOf(a as (typeof PROFIL_ORDER)[number]) -
          PROFIL_ORDER.indexOf(b as (typeof PROFIL_ORDER)[number])
      ),
    competences: inOrder(raw.competences),
    metiers: inOrder(raw.metiers),
    secteurs: [...(raw.secteurs ?? [])]
      .sort((a, b) => a.ordre - b.ordre)
      .map((s) => ({
        id: s.id,
        nom: s.nom,
        employeurs: inOrder(s.employeurs),
      })),
    admissions,
    fees,
    sources,
  };
}
