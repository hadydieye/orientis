import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Les cinq profils d'entrée publiés par ParcourSup Guinée. */
const PROFILS = ["SM", "SE", "SS", "SE-FA", "SS-FA"] as const;
type Profil = (typeof PROFILS)[number];

// GET /recommendations?profil=
//
// `series` et `average` ont disparu avec les données 2025 : aucun seuil
// d'admission n'est publié pour 2026, la fonction Postgres ne filtre plus que
// sur le profil d'entrée.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profil = searchParams.get("profil");

  if (!profil) {
    return NextResponse.json(
      { error: "Le paramètre 'profil' est requis." },
      { status: 400 }
    );
  }

  if (!PROFILS.includes(profil as Profil)) {
    return NextResponse.json(
      { error: `'profil' doit valoir l'un de : ${PROFILS.join(", ")}.` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recommend_programs", {
    p_profil: profil as Profil,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
