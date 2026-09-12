import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Profil = Database["public"]["Enums"]["profil_entree"];

const PROFILS: readonly Profil[] = ["SM", "SE", "SS", "SE-FA", "SS-FA"];

/**
 * PUT /programs/:id/relations — remplace les liaisons N-N d'une formation.
 *
 * `program_institutions` et `program_profils` n'ont pas de clé technique : la
 * seule façon de refléter une sélection multiple est de remplacer l'ensemble
 * des lignes de la formation. C'est aussi ce que fait l'import.
 *
 * L'autorisation est portée par RLS (policies `admin_insert` / `admin_delete`
 * sur les deux tables) : ce handler n'ajoute aucun contrôle de rôle qui
 * pourrait diverger de la base. Un non-admin reçoit un 403.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { institutions?: unknown; profils?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const institutions = Array.isArray(body.institutions)
    ? body.institutions.filter((v): v is string => typeof v === "string")
    : null;
  const profils = Array.isArray(body.profils)
    ? body.profils.filter((v): v is string => typeof v === "string")
    : null;

  const invalid = profils?.filter((p) => !PROFILS.includes(p as Profil)) ?? [];
  if (invalid.length > 0) {
    return NextResponse.json(
      {
        error: `Profil inconnu : ${invalid.join(", ")}. Attendu : ${PROFILS.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 42501 = insufficient_privilege : c'est RLS qui refuse, donc un problème de
  // rôle. Tout le reste est une erreur de saisie (clé étrangère inconnue…).
  const fail = (message: string, code?: string) =>
    NextResponse.json({ error: message }, { status: code === "42501" ? 403 : 400 });

  if (institutions) {
    const del = await supabase
      .from("program_institutions")
      .delete()
      .eq("program_id", id);
    if (del.error) return fail(del.error.message, del.error.code);

    if (institutions.length > 0) {
      const ins = await supabase.from("program_institutions").insert(
        institutions.map((institution_id) => ({
          program_id: id,
          institution_id,
        }))
      );
      if (ins.error) return fail(ins.error.message, ins.error.code);
    }
  }

  if (profils) {
    const del = await supabase
      .from("program_profils")
      .delete()
      .eq("program_id", id);
    if (del.error) return fail(del.error.message, del.error.code);

    if (profils.length > 0) {
      const ins = await supabase.from("program_profils").insert(
        profils.map((profil) => ({ program_id: id, profil: profil as Profil }))
      );
      if (ins.error) return fail(ins.error.message, ins.error.code);
    }
  }

  return NextResponse.json({ ok: true });
}
