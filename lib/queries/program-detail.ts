import { createPublicClient } from "@/lib/supabase/public";

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

export type ProgramStep = {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
  cost: number | null;
  link: string | null;
  deadline: string | null;
};

export type ProgramProcedure = {
  id: string;
  academicYear: string | null;
  steps: ProgramStep[];
};

export type ProgramDocument = {
  id: string;
  name: string;
  description: string | null;
  acceptedFormat: string | null;
  originalOrCopy: string;
  isMandatory: boolean | null;
};

export type ProgramDetail = {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  specialty: string | null;
  durationYears: number | null;
  degreeAwarded: string | null;
  language: string;
  description: string | null;
  curriculum: string | null;
  careerProspects: string | null;
  furtherStudies: string | null;
  department: { id: string; name: string };
  unit: { id: string; name: string };
  institution: { id: string; name: string; city: string | null };
  admissions: ProgramAdmission[];
  fees: ProgramFee[];
  procedures: ProgramProcedure[];
  documents: ProgramDocument[];
  sources: ProgramSource[];
};

const SELECT = `
  id, name, level, domain, specialty, duration_years, degree_awarded, language,
  description, curriculum, career_prospects, further_studies,
  departments!inner (
    id, name,
    academic_units!inner (
      id, name,
      institutions!inner ( id, name, city )
    )
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
  ),
  application_procedures (
    id,
    academic_years ( label ),
    application_steps ( id, step_number, title, description, cost, link, deadline )
  ),
  program_documents (
    id, original_or_copy, is_mandatory,
    documents ( id, name, description, accepted_format )
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

type RawProgram = {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  specialty: string | null;
  duration_years: number | null;
  degree_awarded: string | null;
  language: string;
  description: string | null;
  curriculum: string | null;
  career_prospects: string | null;
  further_studies: string | null;
  departments: {
    id: string;
    name: string;
    academic_units: {
      id: string;
      name: string;
      institutions: { id: string; name: string; city: string | null };
    };
  };
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
  }>;
  fees: Array<{
    id: string;
    fee_type: string;
    amount: number | null;
    currency: string;
    frequency: string;
    conditions: string | null;
    academic_years: { label: string } | null;
    sources: RawSource | null;
  }>;
  application_procedures: Array<{
    id: string;
    academic_years: { label: string } | null;
    application_steps: Array<{
      id: string;
      step_number: number;
      title: string;
      description: string | null;
      cost: number | null;
      link: string | null;
      deadline: string | null;
    }>;
  }>;
  program_documents: Array<{
    id: string;
    original_or_copy: string;
    is_mandatory: boolean | null;
    documents: {
      id: string;
      name: string;
      description: string | null;
      accepted_format: string | null;
    } | null;
  }>;
};

export async function getProgramIds() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("programs").select("id");
  return (data ?? []).map((row) => row.id);
}

export async function getProgramDetail(
  id: string
): Promise<ProgramDetail | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("programs")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const raw = data as unknown as RawProgram;
  const sources = new Map<string, ProgramSource>();

  const admissions: ProgramAdmission[] = (raw.admission_requirements ?? []).map(
    (a) => {
      const source = mapSource(a.sources);
      if (source) sources.set(source.id, source);
      return {
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
        source,
      };
    }
  );

  const fees: ProgramFee[] = (raw.fees ?? []).map((f) => {
    const source = mapSource(f.sources);
    if (source) sources.set(source.id, source);
    return {
      id: f.id,
      feeType: f.fee_type,
      amount: f.amount,
      currency: f.currency,
      frequency: f.frequency,
      conditions: f.conditions,
      academicYear: f.academic_years?.label ?? null,
      source,
    };
  });

  const procedures: ProgramProcedure[] = (raw.application_procedures ?? []).map(
    (p) => ({
      id: p.id,
      academicYear: p.academic_years?.label ?? null,
      steps: (p.application_steps ?? [])
        .map((s) => ({
          id: s.id,
          stepNumber: s.step_number,
          title: s.title,
          description: s.description,
          cost: s.cost,
          link: s.link,
          deadline: s.deadline,
        }))
        .sort((a, b) => a.stepNumber - b.stepNumber),
    })
  );

  const documents: ProgramDocument[] = (raw.program_documents ?? []).flatMap(
    (pd) =>
      pd.documents
        ? [
            {
              id: pd.id,
              name: pd.documents.name,
              description: pd.documents.description,
              acceptedFormat: pd.documents.accepted_format,
              originalOrCopy: pd.original_or_copy,
              isMandatory: pd.is_mandatory,
            },
          ]
        : []
  );

  const unit = raw.departments.academic_units;

  return {
    id: raw.id,
    name: raw.name,
    level: raw.level,
    domain: raw.domain,
    specialty: raw.specialty,
    durationYears: raw.duration_years,
    degreeAwarded: raw.degree_awarded,
    language: raw.language,
    description: raw.description,
    curriculum: raw.curriculum,
    careerProspects: raw.career_prospects,
    furtherStudies: raw.further_studies,
    department: { id: raw.departments.id, name: raw.departments.name },
    unit: { id: unit.id, name: unit.name },
    institution: unit.institutions,
    admissions,
    fees,
    procedures,
    documents,
    sources: [...sources.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "fr")
    ),
  };
}
