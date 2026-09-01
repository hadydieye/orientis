import { createPublicClient } from "@/lib/supabase/public";

export type CatalogProgram = {
  id: string;
  name: string;
  level: string;
  domain: string | null;
  specialty: string | null;
  durationYears: number | null;
  /** Champs rédactionnels : servent uniquement au test de complétude. */
  description: string | null;
  curriculum: string | null;
  careerProspects: string | null;
  institutionId: string;
  institutionName: string;
  city: string | null;
  departmentName: string;
};

/**
 * Toutes les formations publiées, avec leur établissement de rattachement.
 *
 * Une seule requête : programs → departments → academic_units → institutions.
 * Les listes de domaines, niveaux et établissements sont dérivées du résultat
 * plutôt que codées en dur — un domaine absent de la base n'apparaît pas comme
 * filtre vide.
 */
export async function getCatalogPrograms() {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("programs")
    .select(
      "id, name, level, domain, specialty, duration_years, description, curriculum, career_prospects, departments!inner(name, academic_units!inner(institutions!inner(id, name, city)))"
    )
    .order("name");

  type Row = {
    id: string;
    name: string;
    level: string;
    domain: string | null;
    specialty: string | null;
    duration_years: number | null;
    description: string | null;
    curriculum: string | null;
    career_prospects: string | null;
    departments: {
      name: string;
      academic_units: {
        institutions: { id: string; name: string; city: string | null };
      };
    };
  };

  const programs: CatalogProgram[] = ((data ?? []) as unknown as Row[]).map((p) => {
    const inst = p.departments.academic_units.institutions;
    return {
      id: p.id,
      name: p.name,
      level: p.level,
      domain: p.domain,
      specialty: p.specialty,
      durationYears: p.duration_years,
      description: p.description,
      curriculum: p.curriculum,
      careerProspects: p.career_prospects,
      institutionId: inst.id,
      institutionName: inst.name,
      city: inst.city,
      departmentName: p.departments.name,
    };
  });

  const domains = [
    ...new Set(programs.map((p) => p.domain).filter((d): d is string => !!d)),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  const levels = [...new Set(programs.map((p) => p.level))];

  const institutions = [
    ...new Map(
      programs.map((p) => [p.institutionId, { id: p.institutionId, name: p.institutionName }])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return { programs, domains, levels, institutions };
}
