import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeCreateHandler } from "@/lib/api/crud";

// GET /institutions?city=&type=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const type = searchParams.get("type");

  const supabase = await createClient();
  let query = supabase.from("institutions").select("*").order("name");

  if (city) query = query.eq("city", city);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /institutions (CONTRIBUTEUR) — soumission en attente de validation admin.
//
// Passe par la fabrique commune, comme les 5 autres tables du catalogue : elle
// force review_status='pending' et created_by=auth.uid() côté serveur, et
// retire du corps les champs de workflow (review_status, created_by, id,
// created_at). Sans cela, la seule barrière contre une auto-publication était
// le `with check` de la policy contributeur_insert.
export const POST = makeCreateHandler("institutions");
