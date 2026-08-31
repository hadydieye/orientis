import { makeModerationHandler } from "@/lib/api/crud";

export const POST = makeModerationHandler("academic_units", "approved");
