import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { countSourceReferences, pickSourceFields, requireAdmin } from "@/lib/api/sources";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ ...data, references: await countSourceReferences(id) });
}

// PATCH /sources/:id (ADMIN uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = pickSourceFields(await request.json());
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .update(body as never)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Sans policy UPDATE, PostgREST renvoie 200 et zéro ligne : on distingue
  // « ligne absente » de « modification refusée » plutôt que de laisser
  // croire à un succès.
  if (!data || data.length === 0) {
    const { data: still } = await supabase.from("sources").select("id").eq("id", id).maybeSingle();
    if (still) {
      return NextResponse.json(
        { error: "Modification refusée par RLS : aucune policy UPDATE n'autorise cet utilisateur sur sources." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  return NextResponse.json(data[0]);
}

// DELETE /sources/:id (ADMIN uniquement), refusé si la source est référencée.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  // Contrôle AVANT tentative : admission_requirements.source_id et
  // fees.source_id sont en `on delete restrict`. Sans ce comptage, l'appelant
  // recevrait une violation de contrainte brute au lieu de savoir combien de
  // lignes s'y rattachent et lesquelles corriger.
  const references = await countSourceReferences(id);
  if (references.total > 0) {
    const parts = [
      references.admissionRequirements
        ? `${references.admissionRequirements} condition${references.admissionRequirements > 1 ? "s" : ""} d'admission`
        : null,
      references.fees ? `${references.fees} ligne${references.fees > 1 ? "s" : ""} de frais` : null,
      references.institutions
        ? `${references.institutions} fiche${references.institutions > 1 ? "s" : ""} d'établissement`
        : null,
    ].filter(Boolean);
    return NextResponse.json(
      {
        error: `Source utilisée par ${parts.join(" et ")} : suppression impossible. Détachez ces lignes ou rattachez-les à une autre source d'abord.`,
        references,
      },
      { status: 409 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sources").delete().eq("id", id).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (!data || data.length === 0) {
    const { data: still } = await supabase.from("sources").select("id").eq("id", id).maybeSingle();
    if (still) {
      return NextResponse.json(
        { error: "Suppression refusée par RLS : aucune policy DELETE n'autorise cet utilisateur sur sources." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  return NextResponse.json({ deleted: data.length, id });
}
