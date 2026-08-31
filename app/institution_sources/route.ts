import { makeCreateHandler, makeListHandler } from "@/lib/api/crud";

export const GET = makeListHandler("institution_sources");
export const POST = makeCreateHandler("institution_sources");
