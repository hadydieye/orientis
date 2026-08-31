import { createPublicClient } from "@/lib/supabase/public";

export type DetailProgram = {
  id: string;
  name: string;
  level: string;
  durationYears: number | null;
  degreeAwarded: string | null;
  specialty: string | null;
};

export type DetailDepartment = {
  id: string;
  name: string;
  description: string | null;
  programs: DetailProgram[];
};

export type DetailUnit = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  departments: DetailDepartment[];
  programCount: number;
};

export type DetailSource = {
  id: string;
  label: string;
  url: string | null;
  sourceType: string;
  status: string;
  /**
   * D'où vient le rattachement :
   *  - "etablissement" : lié directement à la fiche (institution_sources) ;
   *  - "donnees"       : atteint via un seuil d'admission ou une ligne de frais.
   * Une source peut être les deux ; "etablissement" l'emporte à l'affichage.
   */
  origin: "etablissement" | "donnees";
  /** Précision facultative saisie sur le rattachement direct. */
  note: string | null;
};

export type InstitutionPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

export type InstitutionDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  city: string | null;
  commune: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  recognitionStatus: string | null;
  units: DetailUnit[];
  programCount: number;
  sources: DetailSource[];
  photos: InstitutionPhoto[];
};

// Une seule requête : institution → academic_units → departments → programs,
// avec les sources rattachées aux seuils d'admission et aux frais.
const SELECT = `
  id, name, type, status, description, city, commune, address, phone, email,
  website, founded_year, logo_url, recognition_status,
  academic_units (
    id, name, type, description,
    departments (
      id, name, description,
      programs (
        id, name, level, duration_years, degree_awarded, specialty,
        admission_requirements ( sources ( id, label, url, source_type, status ) ),
        fees ( sources ( id, label, url, source_type, status ) )
      )
    )
  )
`;

type RawSource = {
  id: string;
  label: string;
  url: string | null;
  source_type: string;
  status: string;
};

type RawProgram = {
  id: string;
  name: string;
  level: string;
  duration_years: number | null;
  degree_awarded: string | null;
  specialty: string | null;
  admission_requirements: Array<{ sources: RawSource | null }> | null;
  fees: Array<{ sources: RawSource | null }> | null;
};

type RawInstitution = {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  city: string | null;
  commune: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  founded_year: number | null;
  logo_url: string | null;
  recognition_status: string | null;
  academic_units: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
    departments: Array<{
      id: string;
      name: string;
      description: string | null;
      programs: RawProgram[];
    }>;
  }>;
};

export async function getInstitutionIds() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("institutions").select("id");
  return (data ?? []).map((row) => row.id);
}

export async function getInstitutionDetail(
  id: string
): Promise<InstitutionDetail | null> {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("institutions")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  // Requête séparée plutôt qu'imbriquée dans SELECT : la policy public_read
  // d'institution_photos exige à la fois la photo approuvée et son
  // établissement approuvé, et se lit plus clairement isolée. Une erreur ici
  // ne doit pas faire échouer toute la fiche : la galerie retombe à vide.
  const { data: photoRows } = await supabase
    .from("institution_photos")
    .select("id, photo_url, caption")
    .eq("institution_id", id)
    .order("sort_order")
    .order("created_at");

  const photos = (photoRows ?? []).map((p) => ({
    id: p.id,
    url: p.photo_url,
    caption: p.caption,
  }));

  // Sources rattachées directement à l'établissement. Requête séparée, comme
  // pour les photos : la policy public_read d'institution_sources croise le
  // statut de la liaison et celui de l'établissement, et une erreur ici ne
  // doit pas faire échouer toute la fiche.
  const { data: linkedRows } = await supabase
    .from("institution_sources")
    .select("note, sources(id, label, url, source_type, status)")
    .eq("institution_id", id);

  const raw = data as unknown as RawInstitution;
  const sources = new Map<string, DetailSource>();

  const units: DetailUnit[] = (raw.academic_units ?? [])
    .map((unit) => {
      const departments: DetailDepartment[] = (unit.departments ?? [])
        .map((dept) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description,
          programs: (dept.programs ?? [])
            .map((program) => {
              for (const link of [
                ...(program.admission_requirements ?? []),
                ...(program.fees ?? []),
              ]) {
                if (link.sources) {
                  sources.set(link.sources.id, {
                    id: link.sources.id,
                    label: link.sources.label,
                    url: link.sources.url,
                    sourceType: link.sources.source_type,
                    status: link.sources.status,
                    origin: "donnees",
                    note: null,
                  });
                }
              }
              return {
                id: program.id,
                name: program.name,
                level: program.level,
                durationYears: program.duration_years,
                degreeAwarded: program.degree_awarded,
                specialty: program.specialty,
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name, "fr")),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));

      return {
        id: unit.id,
        name: unit.name,
        type: unit.type,
        description: unit.description,
        departments,
        programCount: departments.reduce((n, d) => n + d.programs.length, 0),
      };
    })
    // Les unités les plus fournies d'abord : la page reste lisible même
    // quand l'établissement en compte cinq (cas UGANC).
    .sort(
      (a, b) => b.programCount - a.programCount || a.name.localeCompare(b.name, "fr")
    );

  // Les liaisons directes sont fusionnées APRÈS le parcours des programmes :
  // une source déjà vue via un seuil ou des frais est requalifiée en
  // "etablissement", le rattachement explicite étant l'information la plus
  // forte des deux.
  type LinkedRow = {
    note: string | null;
    sources: {
      id: string; label: string; url: string | null;
      source_type: string; status: string;
    } | null;
  };
  for (const link of (linkedRows ?? []) as unknown as LinkedRow[]) {
    if (!link.sources) continue;
    sources.set(link.sources.id, {
      id: link.sources.id,
      label: link.sources.label,
      url: link.sources.url,
      sourceType: link.sources.source_type,
      status: link.sources.status,
      origin: "etablissement",
      note: link.note,
    });
  }

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    status: raw.status,
    description: raw.description,
    city: raw.city,
    commune: raw.commune,
    address: raw.address,
    phone: raw.phone,
    email: raw.email,
    website: raw.website,
    foundedYear: raw.founded_year,
    logoUrl: raw.logo_url,
    recognitionStatus: raw.recognition_status,
    units,
    photos,
    programCount: units.reduce((n, u) => n + u.programCount, 0),
    sources: [...sources.values()].sort(
      (a, b) =>
        Number(b.origin === "etablissement") - Number(a.origin === "etablissement") ||
        a.label.localeCompare(b.label, "fr")
    ),
  };
}
