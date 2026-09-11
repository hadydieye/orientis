import { createPublicClient } from "@/lib/supabase/public";
import { TYPE_DIPLOME_ORDER } from "@/lib/labels";

export type DetailProgram = {
  id: string;
  name: string;
  code: string;
  typeDiplome: string | null;
  categorie: string | null;
  profils: string[];
};

/**
 * Les formations d'un établissement, regroupées par type de diplôme.
 *
 * Remplace l'ancien regroupement par unité académique puis département :
 * `programs.department_id` est nul sur les 200 formations ParcourSup, et les
 * 30 unités académiques n'ont plus aucune formation rattachée.
 */
export type DetailProgramGroup = {
  typeDiplome: string;
  programs: DetailProgram[];
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
  sigle: string | null;
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
  groups: DetailProgramGroup[];
  programCount: number;
  sources: DetailSource[];
  photos: InstitutionPhoto[];
};

const SELECT = `
  id, name, sigle, type, status, description, city, commune, address, phone,
  email, website, founded_year, logo_url, recognition_status
`;

type RawInstitution = {
  id: string;
  name: string;
  sigle: string | null;
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
};

type RawLink = {
  programs: {
    id: string;
    name: string;
    code: string;
    type_diplome_enum: string | null;
    categorie: string | null;
    program_profils: Array<{ profil: string }> | null;
    admission_requirements: Array<{ sources: RawSource | null }> | null;
    fees: Array<{ sources: RawSource | null }> | null;
  } | null;
};

type RawSource = {
  id: string;
  label: string;
  url: string | null;
  source_type: string;
  status: string;
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

  // Formations rattachées via la table de liaison N-N. Requête séparée de la
  // fiche : une formation peut appartenir à plusieurs établissements, et
  // l'imbriquer dans le SELECT ci-dessus rendrait la déduplication illisible.
  const { data: linkRows } = await supabase
    .from("program_institutions")
    .select(
      `programs (
         id, name, code, type_diplome_enum, categorie,
         program_profils ( profil ),
         admission_requirements ( sources ( id, label, url, source_type, status ) ),
         fees ( sources ( id, label, url, source_type, status ) )
       )`
    )
    .eq("institution_id", id);

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

  const programs: DetailProgram[] = ((linkRows ?? []) as unknown as RawLink[])
    .map((link) => link.programs)
    .filter((p): p is NonNullable<RawLink["programs"]> => Boolean(p))
    .map((program) => {
      for (const row of [
        ...(program.admission_requirements ?? []),
        ...(program.fees ?? []),
      ]) {
        if (row.sources) {
          sources.set(row.sources.id, {
            id: row.sources.id,
            label: row.sources.label,
            url: row.sources.url,
            sourceType: row.sources.source_type,
            status: row.sources.status,
            origin: "donnees",
            note: null,
          });
        }
      }

      return {
        id: program.id,
        name: program.name,
        code: program.code,
        typeDiplome: program.type_diplome_enum,
        categorie: program.categorie,
        profils: (program.program_profils ?? []).map((p) => p.profil),
      };
    });

  // Regroupement par type de diplôme, dans l'ordre de lecture de référence.
  const byType = new Map<string, DetailProgram[]>();
  for (const program of programs) {
    // `type_diplome_enum` est nullable en base ; un libellé de repli vaut
    // mieux qu'un groupe sans titre.
    const key = program.typeDiplome ?? "Autre";
    byType.set(key, [...(byType.get(key) ?? []), program]);
  }

  const groups: DetailProgramGroup[] = [...byType.entries()]
    .map(([typeDiplome, list]) => ({
      typeDiplome,
      programs: list.sort((a, b) => a.name.localeCompare(b.name, "fr")),
    }))
    .sort((a, b) => {
      const ia = TYPE_DIPLOME_ORDER.indexOf(
        a.typeDiplome as (typeof TYPE_DIPLOME_ORDER)[number]
      );
      const ib = TYPE_DIPLOME_ORDER.indexOf(
        b.typeDiplome as (typeof TYPE_DIPLOME_ORDER)[number]
      );
      return (
        (ia === -1 ? TYPE_DIPLOME_ORDER.length : ia) -
        (ib === -1 ? TYPE_DIPLOME_ORDER.length : ib)
      );
    });

  // Les liaisons directes sont fusionnées APRÈS le parcours des programmes :
  // une source déjà vue via un seuil ou des frais est requalifiée en
  // "etablissement", le rattachement explicite étant l'information la plus
  // forte des deux.
  type LinkedRow = { note: string | null; sources: RawSource | null };
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
    sigle: raw.sigle,
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
    groups,
    photos,
    programCount: programs.length,
    sources: [...sources.values()].sort(
      (a, b) =>
        Number(b.origin === "etablissement") - Number(a.origin === "etablissement") ||
        a.label.localeCompare(b.label, "fr")
    ),
  };
}
