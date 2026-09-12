import { createPublicClient } from "@/lib/supabase/public";
import { buildSearchIndex } from "@/lib/orientation/interests";
import { CATEGORIE_ORDER, PROFIL_ORDER, TYPE_DIPLOME_ORDER } from "@/lib/labels";

export type CatalogInstitutionRef = {
  id: string;
  name: string;
  sigle: string | null;
};

export type CatalogProgram = {
  id: string;
  name: string;
  code: string;
  level: string;
  typeDiplome: string | null;
  categorie: string | null;
  /**
   * Une formation peut être proposée par plusieurs établissements — c'est le
   * cas de 14 intitulés partagés entre universités. D'où un tableau, et non
   * un établissement unique comme dans l'ancien modèle par département.
   */
  institutions: CatalogInstitutionRef[];
  profils: string[];
  /** Intitulé + métiers, normalisé : sert au filtre par centre d'intérêt. */
  searchIndex: string;
};

type Row = {
  id: string;
  name: string;
  code: string;
  level: string;
  type_diplome_enum: string | null;
  categorie: string | null;
  program_institutions: Array<{
    institutions: { id: string; name: string; sigle: string | null };
  }>;
  program_profils: Array<{ profil: string }>;
  metiers: Array<{ libelle: string }>;
};

/** Trie selon un ordre de référence, les valeurs inconnues en fin de liste. */
function byReference<T extends string>(reference: readonly T[]) {
  return (a: string, b: string) => {
    const ia = reference.indexOf(a as T);
    const ib = reference.indexOf(b as T);
    return (ia === -1 ? reference.length : ia) - (ib === -1 ? reference.length : ib);
  };
}

/**
 * Toutes les formations du catalogue, avec leurs établissements et profils.
 *
 * Le rattachement passe par `program_institutions` : `department_id` est nul
 * sur les 200 formations ParcourSup et l'ancienne chaîne
 * programs → departments → academic_units → institutions ne renvoyait plus rien.
 *
 * Les listes de filtres sont dérivées du résultat, jamais codées en dur : une
 * valeur absente de la base n'apparaît pas comme un filtre qui ne trouve rien.
 */
export async function getCatalogPrograms() {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from("programs")
    .select(
      `id, name, code, level, type_diplome_enum, categorie,
       program_institutions ( institutions ( id, name, sigle ) ),
       program_profils ( profil ),
       metiers ( libelle )`
    )
    .order("name");

  const programs: CatalogProgram[] = ((data ?? []) as unknown as Row[]).map((p) => {
    const metiers = (p.metiers ?? []).map((m) => m.libelle);

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      level: p.level,
      typeDiplome: p.type_diplome_enum,
      categorie: p.categorie,
      institutions: (p.program_institutions ?? [])
        .map((link) => link.institutions)
        .filter((i): i is CatalogInstitutionRef => Boolean(i))
        .sort((a, b) => (a.sigle ?? a.name).localeCompare(b.sigle ?? b.name, "fr")),
      profils: (p.program_profils ?? [])
        .map((row) => row.profil)
        .sort(byReference(PROFIL_ORDER)),
      searchIndex: buildSearchIndex({ name: p.name, metiers }),
    };
  });

  const typeDiplomes = [
    ...new Set(programs.map((p) => p.typeDiplome).filter((t): t is string => !!t)),
  ].sort(byReference(TYPE_DIPLOME_ORDER));

  const categories = [
    ...new Set(programs.map((p) => p.categorie).filter((c): c is string => !!c)),
  ].sort(byReference(CATEGORIE_ORDER));

  const profils = [...new Set(programs.flatMap((p) => p.profils))].sort(
    byReference(PROFIL_ORDER)
  );

  const institutions = [
    ...new Map(
      programs.flatMap((p) => p.institutions.map((i) => [i.id, i] as const))
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return { programs, typeDiplomes, categories, profils, institutions };
}
