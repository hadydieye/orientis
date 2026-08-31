import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeDeleteHandler, makeUpdateHandler } from "@/lib/api/crud";

// GET /institutions/:id — academic_units -> departments -> programs imbriqués
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("institutions")
    .select("*, academic_units(*, departments(*, programs(*)))")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /institutions/:id (CONTRIBUTEUR sur sa propre soumission pending, ou ADMIN).
//
// Fabrique commune : elle retire les champs de workflow du corps, donc un
// contributeur ne peut pas glisser review_status='approved' dans sa mise à
// jour. L'autorisation sur la ligne reste portée par les policies RLS
// contributeur_update_own_pending et admin_update.
export const PATCH = makeUpdateHandler("institutions");

// DELETE /institutions/:id (admin) — ajouté rétroactivement.
export const DELETE = makeDeleteHandler("institutions");
