import { makeModerationHandler } from "@/lib/api/crud";

// POST /admin/institutions/:id/approve (ADMIN) — autorisation portée par la
// policy RLS admin_update. Alignée sur la fabrique commune comme reject et les
// 5 autres tables : la version manuscrite précédente écrasait toute erreur en
// 404, y compris un refus d'autorisation (42501), qui se lit maintenant en 403.
export const POST = makeModerationHandler("institutions", "approved");
