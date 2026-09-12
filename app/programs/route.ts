import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeCreateHandler } from "@/lib/api/crud";
import type { Database } from "@/lib/database.types";

type TypeDiplome = Database["public"]["Enums"]["type_diplome"];
type Categorie = Database["public"]["Enums"]["categorie_formation"];
type Profil = Database["public"]["Enums"]["profil_entree"];

const TYPES_DIPLOME: readonly TypeDiplome[] = [
  "Licence professionnelle",
  "Licence fondamentale",
  "Diplôme d’ingénieur",
  "DUT",
  "Diplôme d’État",
  "Cycle préparatoire",
];
const CATEGORIES: readonly Categorie[] = [
  "Licence",
  "Diplôme d'État & Ingénierie",
  "DUT & Cycle préparatoire",
];
const PROFILS: readonly Profil[] = ["SM", "SE", "SS", "SE-FA", "SS-FA"];

/**
 * Valide une valeur d'enum. Une valeur hors liste est refusée en 400 plutôt
 * que de produire silencieusement un résultat vide : côté appelant, « aucune
 * formation » et « ta valeur de filtre n'existe pas » ne se soignent pas de
 * la même façon.
 */
function parseEnum<T extends string>(
  value: string | null,
  allowed: readonly T[]
): { ok: true; value: T | null } | { ok: false; allowed: readonly T[] } {
  if (value === null) return { ok: true, value: null };
  return allowed.includes(value as T)
    ? { ok: true, value: value as T }
    : { ok: false, allowed };
}

// GET /programs?level=&type_diplome=&categorie=&profil=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  const typeDiplome = parseEnum(searchParams.get("type_diplome"), TYPES_DIPLOME);
  const categorie = parseEnum(searchParams.get("categorie"), CATEGORIES);
  const profil = parseEnum(searchParams.get("profil"), PROFILS);

  for (const [name, parsed] of [
    ["type_diplome", typeDiplome],
    ["categorie", categorie],
    ["profil", profil],
  ] as const) {
    if (!parsed.ok) {
      return NextResponse.json(
        { error: `'${name}' doit valoir l'un de : ${parsed.allowed.join(", ")}.` },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // "profil" vit dans program_profils : on force un inner join pour ne garder
  // que les formations ouvertes à ce profil d'entrée. Le filtrage est strict,
  // SE ne ramène pas SE-FA — ce sont deux séries distinctes du baccalauréat.
  const select = profil.ok && profil.value
    ? "*, program_profils!inner(profil)"
    : "*";
  let query = supabase.from("programs").select(select);

  if (level) query = query.eq("level", level);
  if (typeDiplome.ok && typeDiplome.value)
    query = query.eq("type_diplome_enum", typeDiplome.value);
  if (categorie.ok && categorie.value)
    query = query.eq("categorie", categorie.value);
  if (profil.ok && profil.value)
    query = query.eq("program_profils.profil", profil.value);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /programs (CONTRIBUTEUR) — force review_status='pending' et created_by.
export const POST = makeCreateHandler("programs");
