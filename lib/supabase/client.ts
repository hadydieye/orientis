import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Client navigateur — écrit la session en cookies, relue côté serveur
// par lib/supabase/server.ts.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
