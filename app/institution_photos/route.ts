import { makeCreateHandler, makeListHandler } from "@/lib/api/crud";

export const GET = makeListHandler("institution_photos");
export const POST = makeCreateHandler("institution_photos");
