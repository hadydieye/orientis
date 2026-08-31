import { makeModerationHandler } from "@/lib/api/crud";

export const POST = makeModerationHandler("programs", "approved");
