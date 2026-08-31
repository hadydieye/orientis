import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /recommendations?series=&average=
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get("series");
  const averageParam = searchParams.get("average");

  if (!series || !averageParam) {
    return NextResponse.json(
      { error: "Les paramètres 'series' et 'average' sont requis." },
      { status: 400 }
    );
  }

  const average = Number(averageParam);
  if (Number.isNaN(average)) {
    return NextResponse.json({ error: "'average' doit être un nombre." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recommend_programs", {
    p_series: series,
    p_average: average,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
