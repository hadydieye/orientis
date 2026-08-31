import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickSourceFields, requireAdmin } from "@/lib/api/sources";

// GET /sources — lecture simple, pour alimenter le choix de source_id dans les
// formulaires admission_requirements / fees.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id, label, url, source_type, status, verified_at")
    .order("label");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /sources (ADMIN uniquement) — un contributeur ne crée pas de source.
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = pickSourceFields(await request.json());
  if (!body.label || !body.source_type) {
    return NextResponse.json(
      { error: "label et source_type sont obligatoires." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .insert(body as never)
    .select()
    .single();

  if (error) {
    const denied = error.code === "42501";
    return NextResponse.json(
      { error: denied ? "Création refusée par RLS (rôle admin requis)." : error.message },
      { status: denied ? 403 : 400 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}
