import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeCreateHandler } from "@/lib/api/crud";

// GET /programs?domain=&level=&series=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const level = searchParams.get("level");
  const series = searchParams.get("series");

  const supabase = await createClient();

  // "series" vit dans admission_requirements.accepted_series : on force un inner join
  // pour ne garder que les programmes ayant une exigence d'admission qui la couvre.
  const select = series ? "*, admission_requirements!inner(accepted_series)" : "*";
  let query = supabase.from("programs").select(select);

  if (domain) query = query.eq("domain", domain);
  if (level) query = query.eq("level", level);
  if (series) query = query.contains("admission_requirements.accepted_series", [series]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST /programs (CONTRIBUTEUR) — force review_status='pending' et created_by.
export const POST = makeCreateHandler("programs");
