/**
 * Les quatre outils de l'agent conseiller.
 *
 * Règle unique : tout ce qui est retourné vient de la base ParcourSup 2026.
 * Aucune valeur n'est inventée ni complétée par défaut — le modèle ne doit
 * jamais pouvoir confondre une donnée absente avec une donnée nulle.
 *
 * Les requêtes réutilisent lib/queries/ telles quelles. Le catalogue fait
 * 200 formations : le charger entièrement pour filtrer en mémoire coûte moins
 * qu'un SQL de recherche sur deux tables, et c'est déjà ce que fait la page
 * /formations.
 */
import { createPublicClient } from "@/lib/supabase/public";
import { getCatalogPrograms } from "@/lib/queries/programs";
import { getProgramDetail } from "@/lib/queries/program-detail";
import { getInstitutionDetail } from "@/lib/queries/institution-detail";
import { normalizeText } from "@/lib/orientation/interests";

const MAX_RESULTS = 8;

/** Retire les champs nuls, vides ou absents — un trou reste un trou. */
function stripEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    })
  );
}

// ── 1. chercher_formations ────────────────────────────────────────────────

export type ChercherArgs = {
  profil?: string;
  categorie?: string;
  type_diplome?: string;
  mot_cle?: string;
};

export async function chercher_formations(args: ChercherArgs) {
  const { programs } = await getCatalogPrograms();

  const profil = args.profil?.trim().toUpperCase();
  const categorie = normalizeText(args.categorie);
  const typeDiplome = normalizeText(args.type_diplome);
  const motCle = normalizeText(args.mot_cle);

  const matches = programs.filter((p) => {
    // Les profils ne se recoupent pas (SS ≠ SS-FA) : égalité stricte.
    if (profil && !p.profils.includes(profil)) return false;
    if (categorie && !normalizeText(p.categorie).includes(categorie)) return false;
    if (typeDiplome && !normalizeText(p.typeDiplome).includes(typeDiplome)) return false;
    // searchIndex = intitulé + les métiers de la formation, déjà normalisé.
    if (motCle && !p.searchIndex.includes(motCle)) return false;
    return true;
  });

  // Zéro résultat sur un mot-clé qui est en fait une ville ou un établissement
  // (« N'Zérékoré », « UGANC ») : le modèle s'arrête là et conclut à tort que
  // le catalogue est vide. On lui rend la main sur le bon outil.
  if (matches.length === 0 && motCle) {
    const etablissements = await findInstitutions(args.mot_cle ?? "");
    if (etablissements.length > 0) {
      return {
        total_trouve: 0,
        formations: [],
        indice: `« ${args.mot_cle} » ne figure dans aucun intitulé ni aucun métier, mais correspond à ${
          etablissements.length > 1 ? "des établissements" : "un établissement"
        } du catalogue. Appelle infos_etablissement({ sigle: "${args.mot_cle}" }) pour obtenir leurs formations.`,
      };
    }
  }

  return {
    total_trouve: matches.length,
    affiches: Math.min(matches.length, MAX_RESULTS),
    formations: matches.slice(0, MAX_RESULTS).map((p) =>
      stripEmpty({
        code: p.code,
        name: p.name,
        type_diplome: p.typeDiplome,
        categorie: p.categorie,
        profils: p.profils,
        etablissements: p.institutions.map((i) => i.sigle ?? i.name),
      })
    ),
  };
}

// ── 2. detail_formation ───────────────────────────────────────────────────

/** Résout un code ParcourSup vers l'id interne attendu par getProgramDetail. */
async function idFromCode(code: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("programs")
    .select("id")
    .ilike("code", code.trim())
    .maybeSingle();
  return data?.id ?? null;
}

export async function detail_formation({ code }: { code: string }) {
  const id = await idFromCode(code);
  if (!id) return { erreur: `Aucune formation avec le code « ${code} » dans le catalogue.` };

  const p = await getProgramDetail(id);
  if (!p) return { erreur: `Aucune formation avec le code « ${code} » dans le catalogue.` };

  return stripEmpty({
    code: p.code,
    name: p.name,
    type_diplome: p.typeDiplome,
    categorie: p.categorie,
    profils_acceptes: p.profils,
    competences: p.competences,
    metiers: p.metiers,
    secteurs: p.secteurs.map((s) =>
      stripEmpty({ nom: s.nom, employeurs: s.employeurs })
    ),
    etablissements: p.institutions.map((i) =>
      stripEmpty({ name: i.name, sigle: i.sigle, ville: i.city })
    ),
    // Les deux cycles préparatoires ne sont rattachés à aucun IES. Sans cette
    // mention, `etablissements` disparaît du JSON (stripEmpty) et le modèle
    // n'a aucun moyen de distinguer « aucun » de « pas demandé ».
    ...(p.institutions.length === 0
      ? {
          aucun_etablissement:
            "Cette formation n'est rattachée à aucun établissement dans le catalogue.",
        }
      : {}),
    url_source: p.urlSource,
    // Dit explicitement au modèle ce que la base ne contient pas, pour qu'il
    // ne comble pas le silence.
    donnees_absentes:
      "Frais de scolarité, conditions d'admission chiffrées et procédure d'inscription ne figurent pas dans le catalogue.",
  });
}

// ── 3. comparer_formations ────────────────────────────────────────────────

export async function comparer_formations({ codes }: { codes: string[] }) {
  const liste = (codes ?? []).slice(0, 3);
  if (liste.length < 2) {
    return { erreur: "Il faut 2 ou 3 codes de formation pour comparer." };
  }

  const formations = await Promise.all(
    liste.map(async (code) => {
      const id = await idFromCode(code);
      const p = id ? await getProgramDetail(id) : null;
      if (!p) return { code, erreur: "Code introuvable dans le catalogue." };

      return stripEmpty({
        code: p.code,
        name: p.name,
        type_diplome: p.typeDiplome,
        etablissements: p.institutions.map((i) => i.sigle ?? i.name),
        profils: p.profils,
        nombre_competences: p.competences.length,
        premiers_metiers: p.metiers.slice(0, 5),
      });
    })
  );

  return { formations };
}

// ── 4. infos_etablissement ────────────────────────────────────────────────

/**
 * Le modèle passe ce qu'il a sous la main : un sigle, un nom, ou une ville.
 * Les 17 établissements sont filtrés en mémoire plutôt que par `ilike` :
 * PostgreSQL compare les accents et l'apostrophe littéralement, et
 * « N Zerekore » ne retrouverait jamais « N'Zérékoré ».
 */
async function findInstitutions(terme: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("institutions")
    .select("id, name, sigle, city")
    .order("name");

  const q = normalizeText(terme);
  if (!q) return [];

  const all = data ?? [];
  // Sigle d'abord : c'est l'identifiant le plus précis.
  const parSigle = all.filter((i) => normalizeText(i.sigle) === q);
  if (parSigle.length > 0) return parSigle;

  const parNom = all.filter((i) => normalizeText(i.name).includes(q));
  if (parNom.length > 0) return parNom;

  return all.filter((i) => normalizeText(i.city).includes(q));
}

export async function infos_etablissement({ sigle }: { sigle: string }) {
  const trouves = await findInstitutions(sigle ?? "");

  if (trouves.length === 0) {
    return { erreur: `Aucun établissement « ${sigle} » dans le catalogue.` };
  }

  // Plusieurs résultats (typiquement une ville) : on rend la liste, à charge
  // du modèle de redemander une fiche précise.
  if (trouves.length > 1) {
    return {
      plusieurs_etablissements: trouves.map((i) =>
        stripEmpty({ name: i.name, sigle: i.sigle, ville: i.city })
      ),
    };
  }

  const e = await getInstitutionDetail(trouves[0].id);
  if (!e) return { erreur: `Aucun établissement « ${sigle} » dans le catalogue.` };

  return stripEmpty({
    name: e.name,
    sigle: e.sigle,
    ville: e.city,
    type: e.type,
    status: e.status,
    website: e.website,
    nombre_formations: e.programCount,
    formations_par_diplome: e.groups.map((g) => ({
      type_diplome: g.typeDiplome,
      formations: g.programs.map((p) => ({ code: p.code, name: p.name })),
    })),
  });
}

// ── Déclarations OpenAI + dispatch ────────────────────────────────────────

export const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "chercher_formations",
      description:
        "Cherche des formations dans le catalogue ParcourSup Guinée 2026 par profil, catégorie, type de diplôme et mot-clé. Tous les critères sont facultatifs et se combinent. Retourne au maximum 8 formations. Ne filtre NI par ville NI par établissement : pour « les formations à telle ville » ou « dans tel établissement », utiliser infos_etablissement.",
      parameters: {
        type: "object",
        properties: {
          profil: {
            type: "string",
            enum: ["SM", "SE", "SS", "SE-FA", "SS-FA"],
            description: "Série du bac guinéen du candidat.",
          },
          categorie: {
            type: "string",
            description:
              "Catégorie : « Licence », « Diplôme d'État & Ingénierie » ou « DUT & Cycle préparatoire ».",
          },
          type_diplome: {
            type: "string",
            description:
              "Type de diplôme : Licence fondamentale, Licence professionnelle, Diplôme d'ingénieur, Diplôme d'État, DUT, Cycle préparatoire.",
          },
          mot_cle: {
            type: "string",
            description:
              "Un seul mot ou racine, cherché dans l'intitulé de la formation ET dans ses métiers (ex. « informatique », « agro », « enseign »).",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "detail_formation",
      description:
        "Fiche complète d'une formation : profils acceptés, compétences, métiers, secteurs et employeurs, établissements, lien source.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Code exact de la formation." },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "comparer_formations",
      description: "Compare 2 ou 3 formations à partir de leurs codes.",
      parameters: {
        type: "object",
        properties: {
          codes: {
            type: "array",
            items: { type: "string" },
            description: "2 ou 3 codes de formation.",
          },
        },
        required: ["codes"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "infos_etablissement",
      description:
        "Fiche d'un établissement et ses formations groupées par type de diplôme. Accepte un sigle, un nom, ou une VILLE — c'est l'outil à utiliser pour « quelles formations à telle ville ». Si la ville compte plusieurs établissements, la liste est renvoyée.",
      parameters: {
        type: "object",
        properties: {
          sigle: {
            type: "string",
            description:
              "Sigle (ex. UGANC), nom, ou ville (ex. N'Zérékoré, Kankan, Conakry).",
          },
        },
        required: ["sigle"],
      },
    },
  },
];

type ToolName =
  | "chercher_formations"
  | "detail_formation"
  | "comparer_formations"
  | "infos_etablissement";

/**
 * Exécute un outil. Une erreur n'est jamais propagée : elle est renvoyée au
 * modèle sous forme de donnée, pour qu'il puisse l'annoncer plutôt que de
 * faire tomber la route.
 */
export async function runTool(name: string, args: Record<string, unknown>) {
  try {
    switch (name as ToolName) {
      case "chercher_formations":
        return await chercher_formations(args as ChercherArgs);
      case "detail_formation":
        return await detail_formation(args as { code: string });
      case "comparer_formations":
        return await comparer_formations(args as { codes: string[] });
      case "infos_etablissement":
        return await infos_etablissement(args as { sigle: string });
      default:
        return { erreur: `Outil inconnu : ${name}` };
    }
  } catch (error) {
    return {
      erreur: `L'outil ${name} a échoué : ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
