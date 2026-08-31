import { makeModerationHandler } from "@/lib/api/crud";

export const POST = makeModerationHandler("institution_photos", "approved");
