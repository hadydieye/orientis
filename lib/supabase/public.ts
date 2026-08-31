import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Client anonyme sans cookies — pour les pages publiques en lecture seule.
// Ne pas utiliser cookies() ici : cela forcerait le rendu dynamique à chaque
// requête, alors que la landing doit pouvoir être générée statiquement (ISR)
// pour le public cible (Android bas de gamme, connexion instable).
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
